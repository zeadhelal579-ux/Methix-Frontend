# METHIX — Agri-Intelligence (Frontend)

AI-driven methane emission prediction, explanation and recommendations for dairy cattle farms.

React 19 · TypeScript · Vite · Tailwind CSS v4 · TanStack Query · Recharts

## Two ways to run it

| Mode | What it does | When to use it |
|---|---|---|
| **Demo mode** | Runs 100% in the browser. A built-in mock backend (`src/mocks`) answers every API call and stores data in `localStorage`. | Vercel deployment, presentations, working without the backend. |
| **Real backend** | Calls the ASP.NET Core API at `VITE_API_BASE_URL`. | Local development with the real server. |

Mode is chosen by environment variables (see `.env.example`):

| Variable | Meaning |
|---|---|
| `VITE_DEMO_MODE` | `true` = demo mode, `false` = real backend. If missing, demo mode is on when `VITE_API_BASE_URL` is empty. |
| `VITE_API_BASE_URL` | Real API base URL, e.g. `https://localhost:7193/api`. |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Web Client ID. Optional. |

## Scripts

```bash
npm install
npm run dev        # real backend (uses .env.development)
npm run dev:demo   # demo mode on the local dev server (uses .env.demo)
npm run build      # type-check + production build (demo mode, uses .env.production)
npm run preview    # serve the production build locally
npm run lint
```

Node.js 20.19 or newer is required.

## Demo mode details

- Sample account: `demo@methix.app` / `demo1234` (a populated farm with 12 animals and 30 days of history).
- You can also register a new account or use Google sign-in. A brand-new account goes through "Create farm" and receives the same sample herd.
- Data you add (cattle, feed records, predictions, accounts) is kept in this browser only. **Settings → Demo data → Reset demo data** wipes it.
- Predictions are produced by a small deterministic simulation (`src/mocks/demoPrediction.ts`). It reacts to the numbers you enter, but it is **not** the trained AI model.

## Google sign-in

The app uses Google Identity Services (loaded from `accounts.google.com`, no npm package).

1. Open the Google Cloud Console → **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**.
2. Under **Authorized JavaScript origins** add your origins, for example:
   - `http://localhost:5173`
   - `https://your-project.vercel.app` (and any custom domain)
3. Copy the **Client ID** and set it as `VITE_GOOGLE_CLIENT_ID` (Vercel → Project → Settings → Environment Variables, or `.env.local` locally), then redeploy.

Without a client ID the button still works in demo mode: it signs you in with a sample Google account and shows a small notice.

**Real backend:** the frontend sends the Google ID token to `POST /api/auth/google` with body `{ "credential": "<id token>" }` and expects the same response as `/auth/login` (`{ token, user }`). That endpoint does not exist in the current backend. When you add it, it must verify the token's signature, audience (your client ID) and expiry (for example with `GoogleJsonWebSignature.ValidateAsync` from `Google.Apis.Auth`) before trusting the email inside it.

## Deploying to Vercel

1. Push this folder to a GitHub repository (`.gitignore` is included).
2. In Vercel: **Add New → Project**, import the repository. Vercel detects Vite automatically (`vercel.json` already sets the build command, output folder and the single-page-app rewrite, so deep links such as `/cattle/3` survive a refresh).
3. Optional: add `VITE_GOOGLE_CLIENT_ID`. No other variable is needed: `.env.production` already turns demo mode on.
4. Deploy.

## Project structure

```
src/
  api/          axios client + one file per backend controller
  components/   auth, cattle, common, dashboard, layout, predictions, settings
  config/       env.ts — reads and normalizes environment variables
  context/      AuthContext (user + token), FarmContext (selected farm id)
  hooks/        TanStack Query hooks
  lib/          cn() helper, Google Identity Services helpers
  mocks/        in-browser mock backend used by demo mode
  pages/        one component per route
  types/        TypeScript contracts mirroring the backend DTOs
  utils/        formatters, emission level config, error messages
```
