"""Issue Bill Split Premium invoices from a dedicated Cloud Run function."""

import hashlib
import hmac
import json
import os
import secrets
import time
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl
from urllib.request import Request, urlopen

import functions_framework


PLANS = {10: 49, 30: 99, 365: 999}
MAX_INIT_DATA_AGE_SECONDS = 24 * 60 * 60
TELEGRAM_TIMEOUT_SECONDS = 8


def _response(body, status, origin=None):
    headers = {"Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Origin"}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
    return json.dumps(body), status, headers


def _verified_user_id(init_data, bot_token):
    if not isinstance(init_data, str) or not 0 < len(init_data) <= 4096:
        raise ValueError("Invalid Telegram authentication")

    pairs = parse_qsl(init_data, keep_blank_values=True, strict_parsing=True)
    fields = dict(pairs)
    if len(fields) != len(pairs) or not fields.get("hash"):
        raise ValueError("Invalid Telegram authentication")

    data_check_string = "\n".join(
        f"{key}={value}" for key, value in sorted(pairs) if key != "hash"
    )
    secret_key = hmac.new(b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256).digest()
    expected_hash = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected_hash, fields["hash"]):
        raise ValueError("Invalid Telegram authentication")

    try:
        auth_date = int(fields["auth_date"])
        user_id = json.loads(fields["user"])["id"]
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
        raise ValueError("Invalid Telegram authentication") from error

    age = time.time() - auth_date
    if not -60 <= age <= MAX_INIT_DATA_AGE_SECONDS or type(user_id) is not int or user_id <= 0:
        raise ValueError("Invalid Telegram authentication")
    return user_id


def _invoice_payload(user_id, days, bot_token):
    # This compact, signed payload fits Telegram's 128-byte limit and can be
    # verified by the payment webhook without trusting the browser's plan.
    data = f"v1:{user_id}:{days}:{secrets.token_hex(8)}"
    key = hmac.new(bot_token.encode("utf-8"), b"BillSplitInvoiceV1", hashlib.sha256).digest()
    signature = hmac.new(key, data.encode("ascii"), hashlib.sha256).hexdigest()[:32]
    return f"{data}:{signature}"


@functions_framework.http
def create_invoice_link(request):
    allowed_origin = os.environ.get("ALLOWED_ORIGIN", "").rstrip("/")
    bot_token = os.environ.get("BOT_TOKEN", "").strip()
    origin = request.headers.get("Origin", "")

    if not allowed_origin or not bot_token:
        return _response({"error": "Payment service is not configured"}, 503)
    if origin and origin != allowed_origin:
        return _response({"error": "Origin not allowed"}, 403)

    if request.method == "OPTIONS":
        if origin != allowed_origin:
            return _response({"error": "Origin not allowed"}, 403)
        return "", 204, {
            "Access-Control-Allow-Origin": allowed_origin,
            "Access-Control-Allow-Methods": "POST",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "3600",
            "Vary": "Origin",
        }
    if request.method != "POST":
        return _response({"error": "Method not allowed"}, 405, origin or None)
    if getattr(request, "content_length", None) and request.content_length > 8192:
        return _response({"error": "Invalid request"}, 413, origin or None)

    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return _response({"error": "Invalid request"}, 400, origin or None)
    days = body.get("days")
    if type(days) is not int or days not in PLANS:
        return _response({"error": "Invalid Premium plan"}, 400, origin or None)

    try:
        user_id = _verified_user_id(body.get("init_data"), bot_token)
    except ValueError:
        return _response({"error": "Invalid Telegram authentication"}, 401, origin or None)

    payload = {
        "title": f"Premium for {days} days",
        "description": f"Bill Split Premium for {days} days",
        "payload": _invoice_payload(user_id, days, bot_token),
        "provider_token": "",
        "currency": "XTR",
        "prices": [{"label": "Premium", "amount": PLANS[days]}],
    }
    telegram_request = Request(
        f"https://api.telegram.org/bot{bot_token}/createInvoiceLink",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(telegram_request, timeout=TELEGRAM_TIMEOUT_SECONDS) as result:
            answer = json.loads(result.read(4096))
        if not isinstance(answer, dict):
            raise ValueError("Invalid Telegram response")
        invoice_link = answer.get("result")
        if answer.get("ok") is not True or not isinstance(invoice_link, str) or not invoice_link.startswith("https://t.me/"):
            raise ValueError("Invalid Telegram response")
    except (HTTPError, URLError, OSError, ValueError, TypeError):
        # HTTP errors and their URLs can contain the bot token; don't log them.
        return _response({"error": "Premium purchase is temporarily unavailable"}, 502, origin or None)

    return _response({"invoice_link": invoice_link}, 200, origin or None)
