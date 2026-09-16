# Premium invoice service

This Cloud Run function only creates Telegram Stars invoice links. The sibling
`cloudrun/webhook` handler confirms `successful_payment`; the Yandex backend
activates Premium after validating its authenticated delivery.

- Runtime: Python 3.14; entry point: `create_invoice_link` in `main.py`.
- Request: `POST` JSON `{ "days": 10 | 30 | 365, "init_data": "<Telegram.WebApp.initData>" }`.
- Success: `200` JSON `{ "invoice_link": "https://t.me/..." }`.
- Configuration: `BOT_TOKEN` from Secret Manager secret `bill-split-bot-token`,
  version `1` (the existing bot token, not checked into source);
  `ALLOWED_ORIGIN=https://bill-split-index.website.yandexcloud.net`.
- Deployment: separate service `bill-split-invoice` in `europe-west1`,
  URL `https://bill-split-invoice-892309313274.europe-west1.run.app/`,
  request-based billing, minimum instances 0, maximum instances 3, request
  timeout 30 seconds. Allow public HTTP access because
  Telegram Mini App users cannot present Google IAM credentials; the function
  verifies their signed Telegram `init_data` before making an invoice.
- Service identity: `bill-split-invoice@project-ba4d7bdd-473e-4677-839.iam.gserviceaccount.com`.
  It has `Secret Manager Secret Accessor` on `bill-split-bot-token` only, not a
  project-wide role.

Never put the token into source, a shell command, a URL shared in a log, or
Cloud Run's plain-text configuration. Bind the secret to the service identity.
The invoice payload is `v1:<telegram_user_id>:<days>:<nonce>:<signature>`; the
payment webhook will need to verify it before approving checkout or activating
Premium. The frontend change to use this service is staged locally; do not
deploy it until the webhook verifies and records `successful_payment` and
activates Premium idempotently. A paid invoice callback is not proof of
server-side activation.

Deployment smoke checks (2026-09-16): the public service responds with `405`
to GET, `204` to CORS preflight from `ALLOWED_ORIGIN`, `401` to an unsigned
`init_data`, and `403` to a foreign origin. The deployed `main.py` SHA-256
matched the local file. These checks prove startup, secret injection, public
access, and rejection paths; they do not prove an invoice was issued by
Telegram or that a payment activates Premium.
