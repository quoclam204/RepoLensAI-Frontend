# RepoLens AI — Frontend

Base frontend architecture for RepoLens AI (Next.js + TypeScript).

## Prerequisites

- Node.js 18+

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Backend origin (no trailing `/api`) | `http://localhost:5237` (backend `http` profile in `RepoLensAI-Backend/src/RepoLens.Api/Properties/launchSettings.json`) |

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — Next.js lint
- `npm run typecheck` — `tsc --noEmit`

## Structure

```text
app/                  # routes (/, /analyses/[id])
src/
  config.ts           # env-based config (API base URL)
  types.ts            # backend contract types (mirror of contracts/api.md)
  lib/api/            # typed API client + per-domain functions
  lib/async-state.ts  # minimal loading/success/error foundation
  features/
    analysis/         # analysis container state (status hook)
    chat/             # chat container state (ask hook)
  components/ui/      # minimal primitives (Card, Button, Loading, ErrorMessage)
```

Backend contract source of truth:
`../RepoLensAI-Backend/specs/001-repolens-mvp/contracts/api.md`.
