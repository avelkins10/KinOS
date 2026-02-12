# Storage: attachments bucket

Supabase Storage buckets are created via Dashboard or Management API, not SQL.

1. In Supabase Dashboard: **Storage** → **New bucket**
2. Name: `attachments`
3. Public: **No** (private; use signed URLs for download)
4. Add RLS policies so users can upload/view/delete only for their company's contacts/deals (e.g. path prefix `{company_id}/` or validate via app).

After creating the bucket, attachment uploads from `/api/attachments` (POST) will work.
