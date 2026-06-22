# IPNL Backend

Express + TypeScript backend used by the frontend during development.

Endpoints:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/demo-login
- GET /api/auth/me
- POST /api/auth/logout
- POST /api/auth/refresh
- GET|POST|PATCH /api/profile/*
- GET|POST|PATCH /api/messages/*
- GET|POST|PATCH /api/intros/*
- GET|PATCH|DELETE /api/notifications/*
- GET /api/leaderboard
- GET|POST|PATCH /api/kyc/*
- GET|PATCH|DELETE /api/admin/*
- GET|POST /api/billing/*
- GET|POST|PATCH|DELETE /api/mandates/*

Run locally:

```
cd backend
npm install
# create backend/.env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npx tsc -p tsconfig.json
node ./dist/index.js
```

Create `backend/.env` with:

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role_key...

# S3 placeholders (replace with real values)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-s3-bucket-name
```

## S3 upload mode (with placeholder fallback)

Logo and KYC endpoints now accept `multipart/form-data` and upload file buffers via
`src/lib/objectStorage.ts`.

1. If AWS credentials are not set, uploads run in placeholder mode and return deterministic placeholder URLs.
2. Once you set real `AWS_*` env values, the same endpoints upload to S3 using `PutObject` and return S3 object URLs.

Required field names:

1. Profile logo endpoint `PATCH /api/profile/me/logo`: `logo` (single file)
2. KYC submit/resubmit endpoints:
   - required: `panCard`, `incorporationCertificate`
   - optional: `gstCertificate`, `reraCertificate`, `addressProof`

## Runtime-backed modules (development scaffold)

Some modules use in-memory runtime storage in `src/lib/runtimeStore.ts` for local development speed:

1. Intros
2. Notifications
3. KYC submissions
4. Billing state
5. Admin audit feed

These are reset when the backend process restarts.

## Why teammates cannot see your locally posted mandate

Git only syncs code, not database rows. If you post a mandate on your machine,
that row exists in the Supabase project configured in your local `backend/.env`.
Teammates will only see that mandate if one of the following is true:

1. Everyone uses the same `SUPABASE_URL` (same project/database) in local setup.
2. You share SQL seed/export scripts and they import the same rows into their own DB.

Quick checks:

1. Confirm backend is running and healthy at `GET /api/health`.
2. Confirm all teammates use the same `SUPABASE_URL` value when shared data is expected.
3. Confirm the mandate has `status = ACTIVE` (only active mandates are listed in marketplace).
