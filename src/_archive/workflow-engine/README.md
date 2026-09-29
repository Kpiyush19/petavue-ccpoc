# Retired: step-based workflow engine

Retired when the agentic Workflows module (from the petavue-demo prototype) took
over `/workflows`. Archived, not deleted — nothing here is imported or routed.

- `index.jsx` — the engine's list page (was `src/pages/workflows/index.jsx`, then `/workflow-engine`)
- `WorkflowDetailPage.jsx` — its detail page (was `src/pages/WorkflowDetailPage.jsx`)
- `WorkflowsLayout.jsx` — its route layout (was `src/layouts/WorkflowsLayout.jsx`)
- `components/` — rename/delete modals

`/workflow-engine` and `/workflow-engine/:id` now redirect to `/workflows`.
To restore: move these back and re-add the routes in `src/router.jsx`.
The mock API (`/api/workflows*`) is still served, so the engine would work again as-is.
