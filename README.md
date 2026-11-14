# Skillora

AI-powered personalized learning and career intelligence platform.

## Phase 1 structure

- `frontend/` - React, TypeScript, Vite, Tailwind CSS, and client-side routing
- `backend/` - FastAPI application and Python project configuration

## Local development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -e .
.venv/bin/uvicorn app.main:app --reload
```

Copy the environment templates before starting either application:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

## Phase 3 Supabase setup

1. Create a Supabase project and copy its project URL and public anon key into
   `frontend/.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. Copy the URL, anon key, JWT issuer, and JWKS URL into `backend/.env`.
3. Apply `supabase/migrations/20261114120000_skillora_initial_schema.sql` in
   the Supabase SQL editor or with the Supabase CLI.
4. Configure Supabase Auth email settings and the redirect URL
   `http://localhost:5173/reset-password`.

The application remains in local preview mode when the frontend Supabase
variables contain the example placeholders. Real authentication and protected
routes activate only after valid Supabase configuration is supplied. The
service-role key is intentionally not used by the frontend or ordinary API
requests.

## Phase 3 AI Mentor setup

The AI Mentor calls Gemini only from the FastAPI backend. Add these values to
`backend/.env` and never to frontend environment variables:

```env
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash
MENTOR_RATE_LIMIT_PER_MINUTE=20
MENTOR_REQUEST_TIMEOUT_SECONDS=20
```

Keep `VITE_API_BASE_URL=http://localhost:8000` in `frontend/.env`, then start
the applications in separate terminals:

```bash
cd backend && .venv/bin/uvicorn app.main:app --reload
cd frontend && npm run dev
```

The backend validates the Supabase bearer token and queries Supabase with that
same user token, so learner-owned records remain protected by RLS. Automated
backend tests mock Gemini and do not require a live API key. A live authenticated
chat requires valid Supabase configuration, an authenticated session, and a
Gemini API key; no live request is made by the test suite.

