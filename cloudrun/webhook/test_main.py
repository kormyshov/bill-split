"""Run with `cd cloudrun/webhook && python3 -m unittest`."""

import hashlib
import hmac
import io
import json
import os
import sys
import types
import unittest
from unittest.mock import patch

if "functions_framework" not in sys.modules:
    sys.modules["functions_framework"] = types.SimpleNamespace(http=lambda function: function)

import main


TOKEN = "test-token-not-a-credential"


def invoice_payload(user_id=42, days=30):
    data = f"v1:{user_id}:{days}:abcdef0123456789"
    key = hmac.new(TOKEN.encode(), b"BillSplitInvoiceV1", hashlib.sha256).digest()
    signature = hmac.new(key, data.encode(), hashlib.sha256).hexdigest()[:32]
    return f"{data}:{signature}"


def payment(user_id=42, days=30):
    return {"currency": "XTR", "total_amount": main.PLANS[days],
            "invoice_payload": invoice_payload(user_id, days),
            "telegram_payment_charge_id": "unique-charge"}


class Request:
    method = "POST"
    content_length = 250

    def __init__(self, data, secret=None):
        self.data = data
        self.headers = {"X-Telegram-Bot-Api-Secret-Token": secret or main._webhook_secret(TOKEN)}

    def get_json(self, silent=False):
        return self.data


class WebhookTests(unittest.TestCase):
    def setUp(self):
        env = patch.dict(os.environ, {"BOT_TOKEN": TOKEN, "BACKEND_PAYMENT_URL": "https://backend.test/?method=stars/verified_payment"})
        env.start()
        self.addCleanup(env.stop)

    def test_precheckout_validates_payer_amount_currency_and_signature(self):
        valid = {"pre_checkout_query": {"id": "query", "from": {"id": 42},
                 "currency": "XTR", "total_amount": 99, "invoice_payload": invoice_payload()}}
        with patch.object(main, "urlopen", return_value=io.BytesIO(b'{"ok":true}')) as send:
            self.assertEqual(main.telegram_webhook(Request(valid))[1], 200)
        answered = json.loads(send.call_args.args[0].data)
        self.assertTrue(answered["ok"])
        for change in ({"total_amount": 1}, {"currency": "USD"},
                       {"invoice_payload": invoice_payload(999)},
                       {"invoice_payload": "forged"}):
            with self.subTest(change=change), patch.object(main, "urlopen", return_value=io.BytesIO(b'{"ok":true}')) as send:
                invalid = {"pre_checkout_query": {**valid["pre_checkout_query"], **change}}
                self.assertEqual(main.telegram_webhook(Request(invalid))[1], 200)
                self.assertFalse(json.loads(send.call_args.args[0].data)["ok"])

    def test_successful_payment_delivered_with_signed_request(self):
        update = {"message": {"from": {"id": 42}, "successful_payment": payment()}}

        class Response(io.BytesIO):
            status = 200

        with patch.object(main, "urlopen", return_value=Response(b'{"ok":true}')) as send:
            self.assertEqual(main.telegram_webhook(Request(update))[1], 200)
        request = send.call_args.args[0]
        data = json.loads(request.data)
        self.assertEqual(data["telegram_id"], 42)
        self.assertEqual(data["charge_id"], "unique-charge")
        self.assertEqual(data["amount"], 99)
        timestamp = request.get_header("X-bill-split-timestamp")
        key = hmac.new(TOKEN.encode(), b"BillSplitDeliveryV1", hashlib.sha256).digest()
        expected = hmac.new(key, timestamp.encode() + b"." + request.data, hashlib.sha256).hexdigest()
        self.assertEqual(request.get_header("X-bill-split-signature"), expected)

    def test_rejects_forged_webhook_without_contacting_backend(self):
        update = {"message": {"from": {"id": 42}, "successful_payment": payment()}}
        with patch.object(main, "urlopen") as send:
            self.assertEqual(main.telegram_webhook(Request(update, secret="wrong"))[1], 403)
            self.assertEqual(main.telegram_webhook(Request({"message": {"from": {"id": 7}, "successful_payment": payment()}}))[1], 400)
            send.assert_not_called()

    def test_backend_failure_requests_telegram_redelivery(self):
        update = {"message": {"from": {"id": 42}, "successful_payment": payment()}}
        with patch.object(main, "urlopen", side_effect=OSError("offline")):
            self.assertEqual(main.telegram_webhook(Request(update))[1], 503)

    def test_one_time_registration_before_header_enforcement(self):
        with patch.dict(os.environ, {"REGISTER_WEBHOOK": "1", "WEBHOOK_URL": "https://webhook.test/"}), \
             patch.object(main, "urlopen", return_value=io.BytesIO(b'{"ok":true}')) as send:
            main._registered = False
            self.addCleanup(setattr, main, "_registered", False)
            request = Request({}, secret="wrong")
            request.method = "GET"
            self.assertEqual(main.telegram_webhook(request)[1], 405)
            self.assertEqual(main.telegram_webhook(request)[1], 405)
            send.assert_called_once()
        registration = json.loads(send.call_args.args[0].data)
        self.assertEqual(registration["url"], "https://webhook.test/")
        self.assertEqual(registration["secret_token"], main._webhook_secret(TOKEN))


if __name__ == "__main__":
    unittest.main()
