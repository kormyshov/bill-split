"""Handle Telegram Stars updates and deliver verified purchases to Yandex."""

import hashlib
import hmac
import json
import logging
import os
import threading
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import functions_framework


PLANS = {1: 1, 10: 49, 30: 99, 365: 999}
CANARY_DAYS = 1
TELEGRAM_TIMEOUT_SECONDS = 4
BACKEND_TIMEOUT_SECONDS = 8
logger = logging.getLogger(__name__)
_registration_lock = threading.Lock()
_registered = False


def _key(token, context):
    return hmac.new(token.encode("utf-8"), context, hashlib.sha256).digest()


def _webhook_secret(token):
    return hmac.new(_key(token, b"BillSplitWebhookV1"), b"header", hashlib.sha256).hexdigest()


def _invoice_details(payload, token):
    if not isinstance(payload, str) or len(payload) > 128:
        raise ValueError("Invalid invoice")
    parts = payload.split(":")
    if len(parts) != 5 or parts[0] != "v1":
        raise ValueError("Invalid invoice")
    _, user, duration, nonce, signature = parts
    if not user.isascii() or not user.isdecimal() or not duration.isascii() or not duration.isdecimal():
        raise ValueError("Invalid invoice")
    if len(nonce) != 16 or any(char not in "0123456789abcdef" for char in nonce):
        raise ValueError("Invalid invoice")
    if len(signature) != 32 or any(char not in "0123456789abcdef" for char in signature):
        raise ValueError("Invalid invoice")
    data = ":".join(parts[:-1])
    expected = hmac.new(_key(token, b"BillSplitInvoiceV1"), data.encode("ascii"), hashlib.sha256).hexdigest()[:32]
    if not hmac.compare_digest(signature, expected):
        raise ValueError("Invalid invoice")
    user_id, days = int(user), int(duration)
    if user_id <= 0 or days not in PLANS:
        raise ValueError("Invalid invoice")
    return user_id, days


def _validated_payment(data, payer_id, token):
    if not isinstance(data, dict) or type(payer_id) is not int or payer_id <= 0:
        raise ValueError("Invalid payment")
    user_id, days = _invoice_details(data.get("invoice_payload"), token)
    if user_id != payer_id or data.get("currency") != "XTR" or type(data.get("total_amount")) is not int or data["total_amount"] != PLANS[days]:
        raise ValueError("Invalid payment")
    return days


def _answer_checkout(query_id, ok, token):
    request = Request(
        f"https://api.telegram.org/bot{token}/answerPreCheckoutQuery",
        data=json.dumps({"pre_checkout_query_id": query_id, "ok": ok, **({"error_message": "This invoice is not valid. Please reopen Bill Split."} if not ok else {})}).encode("utf-8"),
        headers={"Content-Type": "application/json"}, method="POST",
    )
    with urlopen(request, timeout=TELEGRAM_TIMEOUT_SECONDS) as response:
        answer = json.loads(response.read(4096))
    if answer.get("ok") is not True:
        raise ValueError("Telegram rejected pre-checkout response")


def _register_webhook_once(token):
    """One-time rollout switch; disabled by removing REGISTER_WEBHOOK later."""
    global _registered
    if _registered:
        return
    with _registration_lock:
        if _registered:
            return
        webhook_url = os.environ.get("WEBHOOK_URL", "")
        if not webhook_url.startswith("https://"):
            raise ValueError("Webhook URL is not configured")
        body = json.dumps({"url": webhook_url, "secret_token": _webhook_secret(token)}).encode("utf-8")
        request = Request(f"https://api.telegram.org/bot{token}/setWebhook",
                          data=body, headers={"Content-Type": "application/json"}, method="POST")
        with urlopen(request, timeout=TELEGRAM_TIMEOUT_SECONDS) as response:
            answer = json.loads(response.read(4096))
        if answer.get("ok") is not True:
            raise ValueError("Telegram rejected webhook registration")
        _registered = True
        logger.info("Telegram webhook registered with secret header")


def _deliver_payment(payment, payer_id, days, token, backend_url):
    body = json.dumps({
        "telegram_id": payer_id,
        "days": days,
        "amount": PLANS[days],
        "currency": "XTR",
        "invoice_payload": payment["invoice_payload"],
        "charge_id": payment["telegram_payment_charge_id"],
    }, separators=(",", ":")).encode("utf-8")
    timestamp = str(int(time.time()))
    signature = hmac.new(_key(token, b"BillSplitDeliveryV1"), timestamp.encode("ascii") + b"." + body, hashlib.sha256).hexdigest()
    request = Request(backend_url, data=body, headers={
        "Content-Type": "application/json",
        "X-Bill-Split-Timestamp": timestamp,
        "X-Bill-Split-Signature": signature,
    }, method="POST")
    with urlopen(request, timeout=BACKEND_TIMEOUT_SECONDS) as response:
        if response.status != 200:
            raise ValueError("Payment storage failed")


def _refund_canary(payment, payer_id, token):
    body = json.dumps({
        "user_id": payer_id,
        "telegram_payment_charge_id": payment["telegram_payment_charge_id"],
    }).encode("utf-8")
    request = Request(
        f"https://api.telegram.org/bot{token}/refundStarPayment",
        data=body, headers={"Content-Type": "application/json"}, method="POST",
    )
    try:
        with urlopen(request, timeout=TELEGRAM_TIMEOUT_SECONDS) as response:
            answer = json.loads(response.read(4096))
    except HTTPError as error:
        # Telegram may redeliver successful_payment after a completed refund.
        # Treat only its explicit already-refunded response as idempotent success.
        try:
            answer = json.loads(error.read(4096))
            description = answer.get("description", "") if isinstance(answer, dict) else ""
        except (OSError, TypeError, ValueError, json.JSONDecodeError):
            description = ""
        normalized = description.upper().replace(" ", "_")
        if error.code == 400 and "ALREADY_REFUNDED" in normalized:
            return
        raise
    if not isinstance(answer, dict) or answer.get("ok") is not True or answer.get("result") is not True:
        raise ValueError("Telegram rejected canary refund")


@functions_framework.http
def telegram_webhook(request):
    token = os.environ.get("BOT_TOKEN", "").strip()
    backend_url = os.environ.get("BACKEND_PAYMENT_URL", "")
    if not token or not backend_url:
        return "", 503
    if os.environ.get("REGISTER_WEBHOOK") == "1":
        try:
            _register_webhook_once(token)
        except HTTPError as error:
            # Never log the exception: its URL contains the bot token.
            logger.warning("Telegram webhook registration HTTP status %d", error.code)
            return "", 503
        except (URLError, OSError, ValueError, TypeError):
            logger.warning("Telegram webhook registration failed before HTTP success")
            return "", 503
    if request.method != "POST":
        return "", 405
    if not hmac.compare_digest(request.headers.get("X-Telegram-Bot-Api-Secret-Token", ""), _webhook_secret(token)):
        return "", 403
    if request.content_length and request.content_length > 64 * 1024:
        return "", 413
    update = request.get_json(silent=True)
    if not isinstance(update, dict):
        return "", 400

    checkout = update.get("pre_checkout_query")
    if isinstance(checkout, dict):
        payer = checkout.get("from")
        payer_id = payer.get("id") if isinstance(payer, dict) else None
        query_id = checkout.get("id")
        if not isinstance(query_id, str) or not query_id:
            return "", 400
        try:
            _validated_payment(checkout, payer_id, token)
            valid = True
        except ValueError:
            valid = False
        try:
            _answer_checkout(query_id, valid, token)
        except (HTTPError, URLError, OSError, ValueError, TypeError):
            # URL in HTTPError may contain a credential. Never log it.
            logger.warning("Telegram pre-checkout answer failed")
            return "", 503
        return "", 200

    message = update.get("message")
    payment = message.get("successful_payment") if isinstance(message, dict) else None
    if payment is not None:
        payer = message.get("from")
        payer_id = payer.get("id") if isinstance(payer, dict) else None
        charge_id = payment.get("telegram_payment_charge_id") if isinstance(payment, dict) else None
        if not isinstance(charge_id, str) or not 0 < len(charge_id) <= 256:
            return "", 400
        try:
            days = _validated_payment(payment, payer_id, token)
        except ValueError:
            logger.error("Telegram payment failed invoice validation")
            return "", 400
        try:
            _deliver_payment(payment, payer_id, days, token, backend_url)
        except (HTTPError, URLError, OSError, ValueError, TypeError):
            # Retry the Telegram update until the YDB transaction succeeds.
            logger.warning("Premium payment delivery failed; requesting retry")
            return "", 503
        if days == CANARY_DAYS:
            try:
                _refund_canary(payment, payer_id, token)
            except (HTTPError, URLError, OSError, ValueError, TypeError):
                logger.warning("Canary refund failed; requesting retry")
                return "", 503
        return "", 200

    return "", 200
