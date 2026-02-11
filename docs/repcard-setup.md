# RepCard Integration Setup

This document describes how to configure the RepCard connector and webhook in KinOS.

## Webhook Endpoint

- **URL:** `https://{your-domain}/api/webhooks/repcard`
- **Method:** POST
- **Content-Type:** application/json

## RepCard Connector Configuration

1. In RepCard admin, go to **Connectors** → **Add Connector**.
2. Configure:
   - **Connector Type:** Custom
   - **Type:** Web (or Mobile)
   - **Method:** POST
   - **Title:** e.g. "Send to KinOS"
   - **URL:** `https://{your-domain}/api/webhooks/repcard`

### Required fields to enable in RepCard connector

**Contact (customers):**

- customers.id
- customers.firstName
- customers.lastName
- customers.email
- customers.phoneNumber
- customers.fullPhoneNumber
- customers.countryCode
- customers.address
- customers.city
- customers.state
- customers.zip
- customers.type
- customers.statusId

**User (rep):**

- user.id
- user.firstName
- user.lastName
- user.email
- user.jobTitle

## Environment Variables

Set in your production environment (e.g. Vercel):

- `REPCARD_API_KEY` — **Required.** API key for RepCard API (x-api-key). Must be set in production.
- `REPCARD_COMPANY_ID` — Fallback RepCard company ID for user sync when not set per company (see below).

Optional:

- `REPCARD_API_BASE_URL` — Override API base URL (default: `https://app.repcard.com/api`).
- `REPCARD_CONTACT_PUSH_ENABLED` — Set to `true` to enable pushing contacts to RepCard (customer creation endpoint not yet documented; leave unset to avoid 404s).

**Per-company RepCard ID:** User sync uses the RepCard company identifier from `companies.settings.repcard_company_id` when present; otherwise it falls back to `REPCARD_COMPANY_ID`. Set `settings.repcard_company_id` (string) on each company record for multi-tenant setups.

## Security

- Consider adding webhook signature validation if RepCard supports it. The endpoint currently accepts any POST with valid JSON payload structure.
- Use HTTPS in production. Do not expose the service role key or RepCard API key to the client.

## Flow Summary

1. **Lead creation:** Rep manually triggers "Send to KinOS" in RepCard. RepCard POSTs to the webhook URL with customer and user data. KinOS creates or updates the contact, looks up the KinOS user by `repcard_user_id`, and creates a deal at stage `new_lead` assigned to that user.
2. **User sync:** Run user sync (e.g. via server action `triggerUserSync()`) to pull RepCard users and match/link them to KinOS users by email or `repcard_user_id`.
3. **Contact push (optional):** Call `pushContactToRepCard(contactId)` from contact creation flows to create the contact in RepCard and store `repcard_customer_id` on the KinOS contact.
