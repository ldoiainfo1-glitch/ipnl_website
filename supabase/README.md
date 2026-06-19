Supabase schema and migration
=============================

This folder contains a versioned SQL file you can run to create core tables, RLS policies, and triggers used by the IPNL app.

Files
- `schema.sql` — SQL to create `profiles`, `mandates`, `conversations`, `messages`, RLS policies, and triggers.

How to apply
------------

Option A — Supabase Dashboard (quick, recommended):
1. Open your Supabase project.
2. Go to **SQL Editor** → **New query**.
3. Paste the contents of `supabase/schema.sql` and click **Run**.

Option B — psql (CLI):
1. Get your database connection string from Supabase (Settings → Database → Connection string).
2. Run:

```bash
# replace CONNECTION_STRING with the Supabase DB connection URL
psql "CONNECTION_STRING" -f supabase/schema.sql
```

Option C — Supabase CLI (for migration workflows):
- If you prefer using the Supabase CLI and migrations, convert this SQL into a migration file under `supabase/migrations/` and use the CLI to apply.

Notes & tips
- Running this requires privileges to create tables and extensions — use the project owner or service-role credentials in the Dashboard or a database connection.
- Do NOT put the service-role key into the frontend. Keep it in `backend/.env` only.
- After running, test by signing up a user and checking the `profiles` table to ensure a row is created automatically.

If you want, I can:
- Convert `schema.sql` into a Supabase CLI migration structure, or
- Add a small admin-only backend endpoint to run the SQL once using the service-role key (less recommended).
