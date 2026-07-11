# Migrate the Petavue design system into this repo (automated procedure)

You are Claude Code running **inside the target repository**. The user has
copied a self-contained `petavue/` folder (Petavue's full design system:
tokens, typography, 26 components, 13 pages, assets, services) into this repo
and wants it wired in. **Petavue's design system is the source of truth** — its
colors, typography (Poppins), and reset are authoritative; do not remap its
tokens onto this repo's existing system.

The bundle was pre-built so every internal import already resolves *as long as
the folder lives at `src/petavue/`*. Your job is the repo-specific wiring only.
Do not rewrite imports inside `petavue/` unless Step 6 finds a real breakage.

## Step 0 — Locate the bundle

Find the copied folder (search for `petavue/petavue.css` containing
`@import './style/colorography.css'`). It should sit at `src/petavue/`. If it
was placed elsewhere, **move it to `src/petavue/`** — the internal relative
paths assume that location. If this repo has no `src/` (e.g. Next.js app
router at root), put it at `petavue/` and keep all later import paths relative
to wherever you place it.

## Step 1 — Install dependencies

The bundle needs these runtime deps. Install whichever are missing (match this
repo's package manager — npm/pnpm/yarn):

- `@phosphor-icons/react` (icons — used widely)
- `recharts` (charts — used by the dashboard + chat pages)
- `react` and `react-dom` ≥ 18 (almost certainly already present)

Check `package.json` first; only install what's absent.

## Step 2 — Load the global styles once

Petavue's tokens, fonts, and reset must load globally. Add **one** import to
this app's entry file (e.g. `src/main.jsx`, `src/main.tsx`, `src/index.js`,
`app/layout.tsx`, or the root `App`):

```js
import './petavue/petavue.css';
```

(Adjust the relative path to wherever the entry sits vs. `src/petavue/`.)
That file pulls in `style/colorography.css`, `style/typography.css`, and
`reset.css`. ⚠️ The reset is global and opinionated — if this repo has its own
reset/normalize, confirm with the user whether Petavue's reset should win
(it should, per "Petavue wins") or be trimmed to avoid clobbering host styles.

## Step 3 — Verify the design tokens are live

The components reference CSS variables like `--color-primary-500`,
`--spacing-12`, `--font-size-body-2`, `--font-family-primary`. After Step 2
these are defined globally. Render any component (e.g. a `Button`) and confirm
it picks up Poppins + the blue primary. If variables are missing, the entry
import in Step 2 isn't loading — fix that before continuing.

## Step 4 — Wire up usage (components and/or pages)

Two independent things shipped: **components** (a library) and **pages**
(full screens). Use whichever the user wants.

- **Components** — import from the barrel:
  ```jsx
  import { Button, MenuBar, DataTable, Dialog, Tag } from './petavue';
  // full list: src/petavue/components/index.js
  ```
- **Pages** — each page composes components + a `MenuBar`. They take props like
  `user`, `onNavigate`, `menuOpen`, `onMenuToggle` (see `petavue/App.jsx` for
  exact prop wiring per page).

### Routing
This bundle has **no router** — `petavue/App.jsx` is a `useState`-based screen
switcher. Pick the approach that fits this repo:

- **This repo has a router (react-router / Next.js / TanStack):** map each page
  to a route. Read `petavue/App.jsx` to see the page list, their props, and the
  navigation ids (`chats`, `dashboard`, `data-hub`, `project`, `reports`,
  `skills`, `settings`, `profile`, `new-chat`). Translate its `setPage(...)`
  calls into your router's navigation, and feed `onNavigate` from the active
  route. Pages live in `petavue/pages/<name>/`.
- **This repo has no routing yet:** mount `petavue/App.jsx` directly as the app
  shell — `import { App as PetavueApp } from './petavue/App';` — and render it.

If the user only wants components (not the full pages), skip the page wiring
and leave `petavue/pages/` and `App.jsx` in place unused (or remove them).

## Step 5 — Services & assets (only if pages are used)

`petavue/services/` contains `api.js`, `auth.js`, `cookie.js`, `google.js`
(the login/signup pages call `google.js`; `api.js` may point at a Petavue
backend). `petavue/assets/` holds the spinner gif + integration logos used by
the chat and settings pages. These work as-is, but:

- If using the login/signup pages, set `GOOGLE_CLIENT_ID` in `services/google.js`
  for this environment.
- If this app has its own API client, reconcile `services/api.js` (it may need
  this repo's base URL / auth). Flag this to the user rather than guessing.
- Vite/CRA import the `.gif` and `.svg` assets fine. If this repo is Next.js or
  uses a different bundler, confirm static asset imports are configured.

## Step 6 — Verify

- Run this repo's typecheck/build/lint (e.g. `npm run build`, `tsc --noEmit`,
  or the dev server) and confirm `petavue/` compiles with no unresolved imports.
- If any import fails, it's almost always because the folder isn't at
  `src/petavue/`. Either move it there or fix the offending relative path.
- Render at least one component and one page (if used) and confirm Poppins, the
  primary blue, spacing, and the `MenuBar` look correct.

## Step 7 — Report

Summarize: where the bundle was placed, deps installed, the entry file you
edited, the routing approach chosen (and routes added), any
services/assets that need environment-specific config, and the reset-CSS
decision from Step 2. Flag anything the user must finish manually
(e.g. Google client id, API base URL).
