# RepoLens AI — Frontend

Visual Repository Intelligence client for RepoLens AI (Next.js + TypeScript).

RepoLens AI connects to the RepoLens ASP.NET Core backend to provide evidence-grounded architectural graphs, C4 Archify specifications, API endpoint discovery, ER database modeling, and traceable AI Q&A.

## Prerequisites

- Node.js 18+ (tested on Node.js 20+)
- .NET 10 SDK (for running the backend)
- PostgreSQL (with pgvector extension for chunk embeddings)

## Ports & Architecture

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:5237` (ASP.NET Core HTTP profile)

## Quick Start

### 1. Start the Backend

In your terminal:

```bash
cd RepoLensAI-Backend
dotnet run --project src/RepoLens.Api --launch-profile http
```

Verify backend health at `http://localhost:5237/openapi/v1.json` or by creating an analysis.

### 2. Configure & Start the Frontend

In a separate terminal:

```bash
cd RepoLensAI-Frontend
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | No | `http://localhost:5237` | Origin of the RepoLens backend (no trailing `/api`). |

## Basic User Flow

1. **Home (`/`)**:
   - Enter a public GitHub repository URL (e.g. `https://github.com/octocat/Hello-World`) or upload a `.zip` repository archive (up to 100MB).
   - Click **Analyze Repository** or **Upload & Analyze ZIP**.
2. **Analysis Progress (`/analyses/[id]`)**:
   - The frontend receives an `analysisId` (HTTP 202 Accepted) and automatically navigates to `/analyses/[id]`.
   - Real-time status polling monitors the 11 pipeline stages: *Validation → Repository Acquisition → File Scanning → Static Analysis → Dependency Analysis → Evidence Generation → Persistence → Chunking → Embedding → Indexing → Completed*.
3. **Completed Dashboard**:
   - **Overview**: High-level repository statistics (projects, files, symbols, dependencies, endpoints, database entities) and language distribution.
   - **Architecture Graph**: Interactive dependency graph with pan, zoom, node type filtering, and incoming/outgoing relationship drawers.
   - **Archify C4**: Architectural C4 container and component specification with JSON schema export.
   - **Dependencies**: Filterable table showing source, target, relationship type, and line-level evidence.
   - **API Endpoints**: Detected REST/HTTP endpoints with method badges, controller/actions, and linked source evidence.
   - **Database**: ER-style entity cards detailing columns, nullability, and foreign key relationships.
   - **Files & Code**: Repository file explorer with secure, plain-text source code viewer and line range highlighting.
   - **AI Q&A**: Semantic code search and grounded AI chat with confidence badges (`high`, `medium`, `low`, `unknown`) and verifiable file/line evidence snippets.

## Security

- Untrusted repository source code is rendered purely as plain-text; HTML evaluation or script execution is strictly forbidden.
- No backend secrets or API keys are embedded in frontend source code.

## Scripts

- `npm run dev` — Launch Next.js development server on port 3000
- `npm run build` — Compile production bundle
- `npm run typecheck` — TypeScript contract check (`tsc --noEmit`)
- `npm run lint` — ESLint validation
