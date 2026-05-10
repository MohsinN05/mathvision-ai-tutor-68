# MathVision

**AI-powered symbolic mathematics platform.** Solves equations, generates step-by-step explanations, and renders notebook-style solutions. Designed as a *web app today, mobile/desktop tomorrow* — frontend and backend are decoupled.

```
mathvision/
├── src/                # Web frontend (TanStack Start, hosted on Lovable)
└── backend/            # Standalone Node + Express + Python service (self-host)
    ├── src/            # REST API (TypeScript / Express)
    └── python-service/ # SymPy symbolic solver (FastAPI)
```

## Two ways to run the platform

### A. Lovable-hosted (current default)
The website ships with **server functions** (`src/lib/solver.functions.ts`) that
call Wolfram Alpha directly. No external infra required. Add the
`WOLFRAM_APP_ID` secret in your Lovable project and you're live.

### B. Self-hosted backend (for mobile / desktop / production scale)
Use the standalone `/backend` service when you want:
- a single REST API shared by web + React Native + desktop apps
- SymPy symbolic computation (richer than Wolfram alone)
- persistent history / auth / favorites in your own DB

```bash
cd backend
cp .env.example .env       # set WOLFRAM_APP_ID, MONGO_URI, etc.
docker compose up --build  # starts api (4000), python-solver (5000), mongo
```

Then point the website at the backend by setting `VITE_API_BASE_URL=http://localhost:4000`.

## REST contract (shared)

| Method | Path                    | Body / Params              | Purpose                       |
|--------|-------------------------|----------------------------|-------------------------------|
| POST   | `/api/solve`            | `{ latex }`                | Solve + step-by-step          |
| GET    | `/api/history`          | —                          | List user history             |
| POST   | `/api/history/:id/save` | —                          | Toggle saved                  |
| DELETE | `/api/history/:id`      | —                          | Delete entry                  |
| GET    | `/health`               | —                          | Liveness probe                |

The Lovable server function `solveEquation` mirrors `POST /api/solve` exactly,
so a future React Native app can talk to either implementation by swapping the
base URL.

## Frontend (this repo)

```bash
bun install
bun run dev
```

Stack: TanStack Start, React 19, Tailwind v4, KaTeX, Framer Motion, Zustand.

## Backend

```bash
cd backend
npm install
npm run dev          # API on :4000
```

Python solver:
```bash
cd backend/python-service
pip install -r requirements.txt
uvicorn main:app --reload --port 5000
```

## Environment variables

### Frontend (Lovable secrets)
| Name              | Required | Notes                              |
|-------------------|----------|------------------------------------|
| `WOLFRAM_APP_ID`  | yes      | https://developer.wolframalpha.com |

### Backend (`backend/.env`)
| Name                | Required | Notes                                          |
|---------------------|----------|------------------------------------------------|
| `WOLFRAM_APP_ID`    | yes      | Wolfram Alpha API key                          |
| `PYTHON_SOLVER_URL` | no       | Defaults to `http://localhost:5000`            |
| `MONGO_URI`         | no       | History storage                                |
| `DATABASE_URL`      | no       | Postgres alternative                           |
| `CORS_ORIGINS`      | yes      | Comma-separated list incl. mobile schemes      |

## Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system design, mobile strategy
- [`EXTERNAL_SERVICES_AND_APIS.md`](./EXTERNAL_SERVICES_AND_APIS.md) — every external dependency

## License

MIT.
