# Telegram Stars webhook

Source for the existing Google Cloud Run function `bill-split-webhook` in
`europe-west1` (`https://bill-split-webhook-892309313274.europe-west1.run.app/`).
Entry point: `telegram_webhook`; Python with `functions-framework`.

Environment:

- `BOT_TOKEN`: Secret Manager reference to the existing `bill-split-bot-token`
  (never store the token in source or a plain environment value).
- `BACKEND_PAYMENT_URL`:
  `https://functions.yandexcloud.net/d4e7c88ua76rvj5028r1?method=stars/verified_payment`.

Security and delivery:

1. On the first rollout only, set `REGISTER_WEBHOOK=1` and
   `WEBHOOK_URL=https://bill-split-webhook-892309313274.europe-west1.run.app/`.
   Proactively call the new revision with GET once: the handler calls Telegram
   `setWebhook` before checking the HTTP method. It sets the *same* URL and a
   `secret_token` equal to `_webhook_secret(BOT_TOKEN)`, derived by
   domain-separated HMAC without printing it. It preserves `allowed_updates`
   and pending updates. The old revision ignores the extra header. After
   observing successful registration, set `REGISTER_WEBHOOK=0` (or remove it)
   and deploy another revision to disable the setup step. `WEBHOOK_URL` can
   then be removed as well.
2. Approve checkout only for an invoice payload signed by the invoice service,
   the same Telegram user, `XTR` and the configured Stars price. Old invoices
   with unsigned payloads must be rejected at checkout, not charged.
3. On `message.successful_payment`, validate the same fields and relay a signed
   JSON body to the Yandex Function. Return HTTP 200 only once it has committed
   the payment or confirmed a duplicate. Return 503 on transient errors so
   Telegram can retry. No raw updates, payment IDs or credentials are logged.
   A signed 1-Star / 1-day canary is delivered through the same path and then
   refunded with `refundStarPayment`; an explicit already-refunded response is
   treated as idempotent success. Normal plans are not automatically refunded.
4. The YDB `premium_payments` table and the backend handler must be deployed
   before this function is rolled out. The UI should be deployed after this.

Local verification: `cd cloudrun/webhook && python3 -m unittest`.

After deployment, check `getWebhookInfo` for the URL, allowed update types,
pending updates and recent delivery errors. Probe a missing secret header (403),
an invalid signed payload (checkout rejected), then make one supervised real
payment from the Mini App and verify the account expiration and a single YDB
ledger row. Replay the same successful update to verify that no extra days are
granted. Automated local tests cannot prove this production path.
