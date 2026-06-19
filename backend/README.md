# IPNL Backend (minimal auth)

This is a minimal Express + TypeScript backend to provide auth endpoints used by the frontend during development.

Endpoints:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/demo-login
- GET /api/auth/me
- POST /api/auth/logout
- POST /api/auth/refresh

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
```
