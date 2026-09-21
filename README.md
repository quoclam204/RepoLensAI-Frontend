# RepoLensAI Frontend

Independent Next.js repository for the Frontend and Visualization scope owned by
Person 4. It does not import or modify source code from `RepoLensAI-Backend`.

## Monday foundation

- Next.js, TypeScript and Tailwind configuration.
- Shared application layout and navigation.
- Route shells required by the SRS.
- Typed API contracts and a single REST client boundary.
- Mock adapter for parallel frontend development.

Analyze, Overview, graphs, explorers and chat are route placeholders only. Their
feature logic remains assigned to the following scheduled days.

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
