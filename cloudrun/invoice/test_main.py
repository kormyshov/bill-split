"""Run with `python -m unittest discover -s cloudrun/invoice -p 'test_*.py'`."""

import hashlib
import hmac
import io
import json
import os
import sys
import time
import types
import unittest
from unittest.mock import patch
from urllib.parse import urlencode


# The Cloud Run runtime provides this decorator; no cloud dependency is needed
# for the local request and Telegram API contract tests.
if "functions_framework" not in sys.modules:
    sys.modules["functions_framework"] = types.SimpleNamespace(http=lambda function: function)

import main


TOKEN = "test-token-not-a-real-credential"
ORIGIN = "https://example.test"


def signed_init_data(user_id=42, auth_date=None):
    fields = {
        "auth_date": str(int(time.time()) if auth_date is None else auth_date),
        "user": json.dumps({"id": user_id}, separators=(",", ":")),
    }
    check_string = "\n".join(f"{key}={value}" for key, value in sorted(fields.items()))
    secret = hmac.new(b"WebAppData", TOKEN.encode(), hashlib.sha256).digest()
    fields["hash"] = hmac.new(secret, check_string.encode(), hashlib.sha256).hexdigest()
    return urlencode(fields)


class Request:
    def __init__(self, body=None, method="POST", origin=ORIGIN):
        self.body = body
        self.method = method
        self.headers = {"Origin": origin} if origin else {}

    def get_json(self, silent=False):
        return self.body


class InvoiceTests(unittest.TestCase):
    def setUp(self):
        self.environment = patch.dict(os.environ, {"BOT_TOKEN": TOKEN, "ALLOWED_ORIGIN": ORIGIN})
        self.environment.start()
        self.addCleanup(self.environment.stop)

    def test_issues_invoice_for_verified_user_and_server_price(self):
        body = {"days": 30, "init_data": signed_init_data(), "stars": 1, "user_id": 999}
        with patch.object(main, "urlopen", return_value=io.BytesIO(b'{"ok":true,"result":"https://t.me/$invoice"}')) as send:
            response, status, headers = main.create_invoice_link(Request(body))

        self.assertEqual(status, 200)
        self.assertEqual(json.loads(response), {"invoice_link": "https://t.me/$invoice"})
        self.assertEqual(headers["Access-Control-Allow-Origin"], ORIGIN)
        telegram_request = send.call_args.args[0]
        invoice = json.loads(telegram_request.data)
        self.assertEqual(invoice["prices"], [{"label": "Premium", "amount": 99}])
        self.assertEqual(invoice["currency"], "XTR")
        self.assertTrue(invoice["payload"].startswith("v1:42:30:"))
        self.assertLessEqual(len(invoice["payload"].encode()), 128)
        self.assertEqual(send.call_args.kwargs["timeout"], 8)

    def test_rejects_unknown_or_malformed_plan_without_calling_telegram(self):
        for days in (0, 11, "10", True, None):
            with self.subTest(days=days), patch.object(main, "urlopen") as send:
                _, status, _ = main.create_invoice_link(Request({"days": days, "init_data": signed_init_data()}))
                self.assertEqual(status, 400)
                send.assert_not_called()

    def test_rejects_forged_or_expired_telegram_identity(self):
        for init_data in (signed_init_data().replace("42", "43"), signed_init_data(auth_date=int(time.time()) - 90000), "hash=invalid&user=%7B%7D"):
            with self.subTest(init_data=init_data), patch.object(main, "urlopen") as send:
                _, status, _ = main.create_invoice_link(Request({"days": 10, "init_data": init_data}))
                self.assertEqual(status, 401)
                send.assert_not_called()

    def test_rejects_repeated_authentication_fields(self):
        _, status, _ = main.create_invoice_link(Request({"days": 10, "init_data": signed_init_data() + "&user=other"}))
        self.assertEqual(status, 401)

    def test_preflight_allows_only_configured_origin(self):
        _, status, headers = main.create_invoice_link(Request(method="OPTIONS"))
        self.assertEqual(status, 204)
        self.assertEqual(headers["Access-Control-Allow-Origin"], ORIGIN)
        _, status, headers = main.create_invoice_link(Request(method="OPTIONS", origin="https://other.test"))
        self.assertEqual(status, 403)
        self.assertNotIn("Access-Control-Allow-Origin", headers)

    def test_rejects_other_origin(self):
        _, status, _ = main.create_invoice_link(Request({"days": 10, "init_data": signed_init_data()}, origin="https://other.test"))
        self.assertEqual(status, 403)

    def test_telegram_failure_returns_safe_error(self):
        with patch.object(main, "urlopen", return_value=io.BytesIO(b'{"ok":false,"description":"failed"}')):
            response, status, _ = main.create_invoice_link(Request({"days": 10, "init_data": signed_init_data()}))
        self.assertEqual(status, 502)
        self.assertNotIn(TOKEN, response)

    def test_fails_closed_without_token(self):
        with patch.dict(os.environ, {"BOT_TOKEN": ""}):
            _, status, _ = main.create_invoice_link(Request({"days": 10, "init_data": signed_init_data()}))
        self.assertEqual(status, 503)

    def test_secret_with_trailing_newline_is_normalized(self):
        with patch.dict(os.environ, {"BOT_TOKEN": TOKEN + "\n"}), \
             patch.object(main, "urlopen", return_value=io.BytesIO(b'{"ok":true,"result":"https://t.me/$invoice"}')) as send:
            _, status, _ = main.create_invoice_link(Request({"days": 10, "init_data": signed_init_data()}))
        self.assertEqual(status, 200)
        self.assertIn(f"bot{TOKEN}/createInvoiceLink", send.call_args.args[0].full_url)


if __name__ == "__main__":
    unittest.main()
