# Skillora

AI-powered personalized learning and career intelligence platform.

## Stack

- React, TypeScript, Vite, and Tailwind CSS
- Supabase Auth, PostgreSQL, and Row Level Security
- Optional Supabase Edge Function for the AI Mentor

The application is frontend-only. The browser uses the Supabase publishable
(anon) key for authenticated data access, and Supabase RLS remains the security
boundary for learner-owned records.

## Local development

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Set these values in `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Apply the migrations in `supabase/migrations/` using the Supabase SQL editor or
the Supabase CLI. Configure Supabase Auth email settings and add your local
redirect URL, for example `http://localhost:5173/reset-password`.

The service-role key and any AI provider key must never be added to frontend
environment variables or browser code.

## AI Mentor (optional)

The AI Mentor page is available without an AI service, but chat responses
require an Edge Function named `ai-mentor`. Deploy that function to Supabase
and configure the Gemini API key as a server-side Edge Function secret. The
frontend invokes the function with the authenticated Supabase session; Gemini
credentials never reach the browser.

From the repository root, deploy the prepared function and set its secrets:

```bash
supabase functions deploy ai-mentor
supabase secrets set GEMINI_API_KEY=your-gemini-api-key GEMINI_MODEL=gemini-2.0-flash
```

If the function is not deployed, the rest of the application remains usable
and AI Mentor displays a configuration message.

## Vercel deployment

Create a Vercel project connected to this repository with:

- Root Directory: `frontend`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

The included `frontend/vercel.json` rewrite keeps client-side routes working
when users open a route directly.

Add the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment
variables in Vercel for the appropriate deployment environments, then deploy.

The production build can be verified locally with:

```bash
cd frontend
npm install
npm run build
```
