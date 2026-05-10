# External Services and APIs

This document is the **source of truth** for every third-party service, API, or library MathVision depends on. It is written so that a future mobile/desktop client can be added against the same backend without surprises.

---

## 1. Wolfram Alpha API

- **Used in:** `src/lib/solver.functions.ts` (web), `backend/src/services/wolfram.service.ts` (server)
- **Why:** Industrial-strength symbolic engine. Handles algebra, calculus, ODEs, trig, linear algebra.
- **Endpoint:** `https://api.wolframalpha.com/v2/query`
- **Auth:** `appid` query parameter
- **Setup:**
  1. Sign up at https://developer.wolframalpha.com/
  2. Create an AppID (free tier: 2,000 queries/month).
  3. Add as secret:
     - Lovable: project secrets → `WOLFRAM_APP_ID`
     - Backend: `backend/.env` → `WOLFRAM_APP_ID=...`
- **Integration example (server function):**
  ```ts
  await fetch(`https://api.wolframalpha.com/v2/query?appid=${id}&input=${q}&output=json`)
  ```
- **Mobile compatibility:** ✅ The mobile app should NEVER call Wolfram directly — it must go through the backend so the AppID stays server-side.
- **Web compatibility:** ✅ Called only from server functions; AppID never reaches the browser.
- **Future replacements:** Mathematica Cloud, SymPy (Python), or LLM-based solvers (Lovable AI Gateway, OpenAI).

---

## 2. SymPy (via Python microservice)

- **Used in:** `backend/python-service/main.py`
- **Why:** Pure-Python computer algebra system. Free, deterministic, supports stepwise transformations Wolfram won't expose.
- **Library:** `sympy==1.13.2`
- **Endpoint exposed:** `POST http://<host>:5000/solve`
- **Setup:**
  ```bash
  cd backend/python-service
  pip install -r requirements.txt
  uvicorn main:app --port 5000
  ```
- **Auth:** None by default (internal service). Front it with an API gateway or shared secret in production.
- **Mobile compatibility:** ✅ Indirect — mobile calls Node backend, which proxies to Python.
- **Web compatibility:** ⚠ Not callable from the Lovable preview directly (Cloudflare Worker has no Python). Self-host required.
- **Future replacements:** Maxima, SageMath, custom Rust CAS.

---

## 3. KaTeX

- **Used in:** `src/components/MathRender.tsx`
- **Why:** Fast LaTeX → HTML rendering. Smaller and faster than MathJax. SSR-friendly.
- **Setup:** `bun add katex` (already installed). CSS imported in `src/styles.css`.
- **Mobile compatibility:** ✅ For React Native, swap to `react-native-math-view` or `react-native-katex`. The data shape (LaTeX strings in `result` and `steps[].symbolic`) stays identical.
- **Web compatibility:** ✅ Native.
- **Future replacements:** MathJax, Temml.

---

## 4. Framer Motion

- **Used in:** Page transitions, processing pipeline, explanation card swipes.
- **Why:** Declarative animations with first-class React 19 support.
- **Mobile compatibility:** ⚠ Not RN-compatible. Use `react-native-reanimated` + `moti` on mobile (Moti has the same API).
- **Web compatibility:** ✅ Native.

---

## 5. Zustand

- **Used in:** `src/lib/store.ts`, `src/lib/theme.ts` — solution + history + theme state.
- **Why:** Tiny, no provider boilerplate, works on web AND React Native unchanged.
- **Mobile compatibility:** ✅ Same package, same API. Swap `localStorage` persistence for `@react-native-async-storage/async-storage`.
- **Web compatibility:** ✅ Native.

---

## 6. TanStack Router + Start

- **Used in:** Routing, server functions, SSR.
- **Why:** Type-safe routes, server functions, SSR on Cloudflare Workers.
- **Mobile compatibility:** ❌ Web-only. Mobile apps will use **Expo Router** or **React Navigation**.
- **Web compatibility:** ✅ Native.

---

## 7. Express + Helmet + CORS + Morgan

- **Used in:** `backend/src/app.ts`
- **Why:** Battle-tested Node HTTP layer. Helmet for security headers, CORS configured to accept mobile origins (`capacitor://localhost`, `http://localhost`).
- **Mobile compatibility:** ✅ The backend is the *single point of contact* for all clients.
- **Future replacements:** Fastify, Hono, NestJS.

---

## 8. MongoDB / PostgreSQL (optional)

- **Used in:** `backend/src/database/mongo.ts`, `backend/src/database/postgres.schema.sql`
- **Why:** Persistent history, favorites, future user accounts.
- **Setup:** Configure `MONGO_URI` *or* `DATABASE_URL` in `backend/.env`. Both adapters provided; pick one.
- **Mobile compatibility:** ✅ Indirect via REST.
- **Future replacements:** Supabase / Lovable Cloud, PlanetScale, Neon.

---

## 9. OCR (skipped in v1, planned)

- **Planned providers:**
  - **Mathpix** — best-in-class math OCR. Endpoint: `https://api.mathpix.com/v3/text`. Requires `MATHPIX_APP_ID` + `MATHPIX_APP_KEY`.
  - **Lovable AI vision** — LLM reads handwritten equations, no extra key.
- **Mobile compatibility:** ✅ Send base64 image to backend, backend proxies to provider.
- **Status:** Not enabled. Camera button in UI shows "coming soon".

---

## 10. Authentication (planned)

- **Recommendation:** Lovable Cloud auth (managed) for the web app; the backend can validate Lovable Cloud JWTs to authorize mobile requests against the same user identity.
- **Alternative:** Auth0, Clerk, Firebase Auth.
- **Mobile compatibility:** ✅ All listed providers ship RN SDKs.

---

## 11. File Storage (planned)

- **Recommendation:** Lovable Cloud storage for equation images, user-uploaded handwriting.
- **Alternative:** S3, Cloudflare R2.
- **Mobile compatibility:** ✅ All offer signed-URL upload from mobile.

---

## Mobile-app integration checklist

When building the React Native / Expo client:

1. Set `API_BASE_URL` to the deployed backend (NOT the Lovable preview).
2. Reuse the REST contract above — no new endpoints required for v1.
3. Reuse `src/lib/store.ts` (Zustand) verbatim, swap persistence layer.
4. Reuse `src/lib/math.ts` (LaTeX → query, type detection).
5. Replace KaTeX with `react-native-katex`.
6. Replace Framer Motion with Moti / Reanimated.
7. Add the mobile origin to backend `CORS_ORIGINS` (e.g. `capacitor://localhost`).
8. Send Wolfram requests through the backend; never bundle the AppID into the app binary.

---

## Security memo

- **Never expose `WOLFRAM_APP_ID` to clients.** It must live only in server functions or the backend.
- **Always validate input** — `zod` schemas exist on both web and backend.
- **Rate limit `/api/solve`** in production (e.g. `express-rate-limit`) to prevent burning your Wolfram quota.
