# MathVision — Architecture

## Goals

1. One backend serves **web, mobile, and desktop** through a single REST contract.
2. The Lovable web app must work today, with no external infra, by talking to Wolfram Alpha through server functions.
3. The same web app can be repointed at the standalone `/backend` service later, without changing UI code.

## High-level diagram

```text
                    ┌────────────────────────────┐
                    │     React Native (future)  │
                    │     Desktop (future)       │
                    └────────────┬───────────────┘
                                 │ HTTPS / JSON
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                MathVision Backend (self-hosted)             │
│                                                             │
│  Express (TS)  ──►  Wolfram service  ──►  api.wolfram...   │
│       │                                                     │
│       └──►  Python service (FastAPI + SymPy)                │
│       │                                                     │
│       └──►  MongoDB / Postgres  (history, favorites)        │
└────────────┬──────────────────────────────────────┬─────────┘
             │ (alt) direct                         │
             ▼                                      ▼
┌────────────────────────┐               ┌────────────────────┐
│  Lovable Web App       │               │  Wolfram Alpha API │
│  (TanStack Start)      │ ──────────────┘                    │
│                        │      via server function           │
│  Server functions ◄────┘                                    │
│  React UI / KaTeX                                           │
└────────────────────────┘
```

## Two execution paths for `solve()`

**Path A — Lovable hosted (today):**
`UI → useServerFn(solveEquation) → fetch Wolfram → response`

**Path B — Self-hosted (production / mobile):**
`UI / Mobile → POST /api/solve → SymPy first, Wolfram fallback → response`

Both paths return the same shape:
```ts
{ ok, equationType, solverUsed, resultLatex, steps: [{ stepNumber, symbolic, explanation }] }
```

This is the single contract that must remain stable.

## Frontend layers

```
src/routes/        URL → page (TanStack file-based routing)
src/components/    Visual primitives (Logo, BottomNav, MathRender, etc.)
src/lib/           Domain logic
  ├ solver.functions.ts  createServerFn for /api/solve
  ├ math.ts              LaTeX→Wolfram query, equation type detector
  ├ store.ts             Zustand store (history, current, save toggle)
  └ theme.ts             Light/dark toggle
src/styles.css     Design tokens (oklch), KaTeX import, component utilities
```

State is kept in Zustand with `localStorage` persistence so a fresh visit hydrates the user's last 50 solutions.

## Backend layers

```
src/app.ts                    Express bootstrap, CORS, Helmet
src/routes/                   Endpoint registration
src/controllers/              Validate, orchestrate, respond
src/services/                 wolfram, python (SymPy proxy), explanation engine
src/middleware/error.ts       Centralised error response
src/utils/equation.ts         Type detection (mirrors src/lib/math.ts)
src/database/                 Mongo + Postgres adapters
python-service/main.py        FastAPI + SymPy
```

The **explanation engine** is templated by equation type — algebraic, quadratic, integral, derivative, ODE, trig — so the same symbolic step sequence becomes natural-language guidance suitable for a tutor.

## Solving pipeline

```
1. Receive LaTeX
2. Validate (zod, length 1..500)
3. Detect equation type
4. Try Python SymPy
   ├─ ok  → take result + symbolic steps
   └─ fail → try Wolfram (3 retries with backoff)
5. Run steps through explanation templates
6. Persist history (optional)
7. Return JSON
```

If both solvers fail:
```
{ ok: false, solverUsed: "fallback", error: "Solver currently unavailable" }
```
The UI renders this gracefully (warning card on result page).

## Why a separate Python service?

- SymPy is the most powerful free symbolic engine, but cannot run inside Cloudflare Workers (Lovable's runtime).
- Isolating it as a microservice means:
  - The Node backend stays small, deployable to any Node host.
  - Python can be scaled / replaced independently.
  - Mobile and desktop never need to know it exists.

## Mobile strategy

Future React Native app:

1. Reuse `src/lib/store.ts` and `src/lib/math.ts` verbatim.
2. Swap KaTeX → `react-native-katex`, Framer Motion → Moti.
3. Set `API_BASE_URL` to the deployed `/backend`.
4. Use Lovable Cloud auth (or Clerk/Auth0) — backend validates the JWT.
5. Never embed `WOLFRAM_APP_ID` in the app binary.

The REST contract was designed to be **payload-stable** so the same screens (Solver, Processing, Result, Explain, Full) port directly with only presentation changes.

## Security

- All secrets (`WOLFRAM_APP_ID`, DB URIs) live server-side only.
- `zod` validates every request body.
- `helmet` sets sane HTTP defaults.
- Apply `express-rate-limit` to `/api/solve` in production.
- CORS is allow-list only; mobile schemes (`capacitor://localhost`) must be added explicitly.

## Future expansion

- Replace fallback chain with LLM (Lovable AI Gateway) for explanations.
- Add WebSocket channel (`backend/src/websocket/`) for streaming step generation in real time.
- Add Mathpix OCR for handwritten equations.
- Add user accounts via Lovable Cloud auth, store history server-side.
