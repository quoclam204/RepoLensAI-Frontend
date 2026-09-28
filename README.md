# RepoLensAI Frontend

Independent Next.js repository for the Frontend and Visualization scope owned by
Person 4. It does not import or modify source code from `RepoLensAI-Backend`.

## Monday foundation

- Next.js, TypeScript and Tailwind configuration.
- Shared application layout and navigation.
- Route shells required by the SRS.
- Typed API contracts and a single REST client boundary.
- Mock adapter for parallel frontend development.

## Tuesday implementation

- Public Git URL and ZIP input with client-side validation.
- JSON and multipart adapters for `POST /api/analyses`.
- Analysis lifecycle polling through `GET /api/analyses/{id}`.
- Repository overview through `GET /api/analyses/{id}/overview`.
- Loading, failed, retry and empty states.
- Browser-local mock lifecycle when no backend URL is configured.

## Wednesday implementation

- Interactive Architecture and Dependencies graphs with React Flow.
- Pan, zoom, fit-view controls and a repository minimap.
- Node selection with path, type and metadata details.
- Typed adapters for the architecture graph and paginated dependency API contracts.
- Loading, retry and empty states, plus clearly labelled browser-local demo data.

Explorer and chat routes remain placeholders for their scheduled implementation
days.

## Local setup

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL` when the backend API contract is available. Without
it, feature implementations should explicitly use `mock-analysis-adapter.ts`.

## Validation

```powershell
npm run lint
npm run build
```
