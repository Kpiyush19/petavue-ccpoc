# Handoff: Workflows, Agents and Recommendations

**From:** the `petavue-demo` prototype repo, forked from this codebase in Aug 2026.
**For:** whoever merges these three modules back into the main app.
**Method:** copy files, then wire five things. No git history moves.

Everything here was traced from the actual imports, not guessed: 162 files, of which 91 are new, 31 are edits to files you already have, and 40 are untouched.

---

## 1. What the three modules are

| Route | What it is |
|---|---|
| `/workflows` | Six paid-media workflows. Four deployed, two available. Each one automates a recurring analysis and ends in one specific change. |
| `/workflows/:id` | One workflow: objective, the analyst playbook it replaces, the agent sequence as a canvas, run history. |
| `/workflows/paid-media-assessment` | The entry assessment for customers who do not know which workflow to deploy. |
| `/agents` | Five agent families, each holding named specialists. |
| `/agents/:key` | One family: what it owns, its specialists, where it is deployed, what it found. |
| `/recommendations` | The decision queue. Each card is one change, with its evidence, and Accept, Hold or Reject. |

All of it runs on the in-browser mock. No backend calls.

---

## 2. Copy these as-is

New folders and files. Nothing in your repo has these paths, so they cannot collide.

```bash
SRC=~/Development/petavue-demo
DST=.            # run from your repo root

# The three modules
cp -R $SRC/src/pages/workflows        $DST/src/pages/
cp -R $SRC/src/pages/agents           $DST/src/pages/
cp -R $SRC/src/pages/recommendations  $DST/src/pages/
mkdir -p $DST/src/pages/goals && cp $SRC/src/pages/goals/SageWidget.jsx $DST/src/pages/goals/

# Their data
cp $SRC/src/mocks/agentWorkflows.js $SRC/src/mocks/recommendations.js \
   $SRC/src/mocks/goals.js $SRC/src/mocks/skillRun.js $DST/src/mocks/

# Icons and glyphs they need
cp $SRC/src/components/AgentMark.jsx $SRC/src/components/SourceIcon.jsx \
   $SRC/src/components/WorkflowGlyph.jsx $DST/src/components/

# Small utilities
cp $SRC/src/utils/MarkdownRenderer.jsx $SRC/src/utils/embed.js $DST/src/utils/
cp $SRC/src/skills/skillsCatalog.js $DST/src/skills/
```

**One caveat, `src/pages/workflows/index.jsx`.** That path already exists in your repo as the old step-based workflow engine. In the prototype it was replaced, and the old engine moved to `/workflow-engine`. Decide which you want at `/workflows` before you copy, or the copy silently replaces your engine page.

## 3. The design system

`src/ui/` is entirely new: it did not exist at the fork point. 88 of the 91 new files are in it, including `Button`, `Tooltip`, `MenuBar`, `Modal`, and the colour tokens. The three modules import from `@/ui` throughout.

```bash
cp -R $SRC/src/ui $DST/src/
```

If your repo has since grown its own `src/ui`, **stop and compare before copying.** Everything else in this handoff assumes the prototype's version. Diff the two, and if they have diverged, the cheaper path is usually to keep yours and rewrite the imports in the three modules.

## 4. Files to merge, not overwrite

These 31 exist in both repos and changed in the prototype. Overwriting them will undo whatever your repo did since the fork. The ones that matter:

| File | What changed and why you need it |
|---|---|
| `src/mocks/handlers.js` | Adds the API routes the three modules call. Copy the route entries, not the file. |
| `src/mocks/db.js` | The demo account (Novacert) and the current user. |
| `src/mocks/index.js`, `fetchPatch.js`, `adapter.js` | Mock bootstrap. Take only what is missing. |
| `src/api.js`, `src/config.js`, `src/lib/api-axios.js` | Small changes. Diff before touching. |
| `src/components/dashboards/**` (20 files) | Sage's chat widget. Needed only if you keep "Ask Sage" on the recommendations page. |
| `src/components/sessions/components/SuggestedQuestions.jsx` | Same, Sage only. |
| `src/mocks/dashboardAssets.js`, `pusherBus.js` | Same, Sage only. |

The mock routes to add:

```
GET   /api/agent-workflows
POST  /api/agent-workflows/:id/activate
POST  /api/agent-workflows/:id/pause
GET   /api/agents
GET   /api/agents/:key
GET   /api/goals/recommendations
POST  /api/goals/recommendations/:id/decide
POST  /api/goals/recommendations/:id/comment
```

They are in `handlers.js`, grouped together and importing `agentWorkflows.js` and `recommendations.js`.

## 5. Wiring

**Routes.** Six of them. `paid-media-assessment` must sit above `:id`, or the id route swallows it.

```
/workflows                          → pages/workflows
/workflows/paid-media-assessment    → pages/workflows/Assessment
/workflows/:id                      → pages/workflows/WorkflowDetail
/agents                             → pages/agents
/agents/:key                        → pages/agents/AgentDetail
/recommendations                    → pages/recommendations
```

`/goals` redirects to `/recommendations` in the prototype, and `/goals/:id` still resolves, so old links keep working. Do the same if your repo has goal links in the wild.

**Navigation.** The prototype's nav list lives in `src/ui/components/MenuBar/MenuBar.jsx` as `ALL_NAV`, with a `HIDDEN_NAV` array that hides entries without deleting routes. Order is deliberate: Workflows, Agents, Recommendations first, because that is the pitch, then Dashboard, Skills, Data Hub.

**Path alias.** `@` must resolve to `src`. The modules import `@/ui` and `@/utils/...`.

**Styles.** In `main.jsx`, in this order: `index.css`, then `ui/global.css`, then `ui/tokens/tokens.css`. The tokens file carries every colour variable. Without it the pages render unstyled.

**Mock mode.** `VITE_MOCK=1`.

---

## 6. Take the context too

Four documents carry the product thinking behind these modules. Without them the next person will rename things back.

| File | What it settles |
|---|---|
| `docs/20-petavue-three-ps-strategy.md` | The positioning: Workflows (what), Agents (how), Recommendations (what you get). |
| `docs/21-petavue-agents-and-workflows-catalog.md` | Every workflow and agent in full, generated from the code itself. |
| `docs/22-homepage-three-ps-proposal.md` | How the positioning lands on the website. |
| `docs/23-guideflow-demo-script.md` | The click-by-click demo script. |

Two naming rules are load-bearing and easy to undo by accident:

1. **Vary the agent role words.** Auditor, Mapper, Examiner, Strategist, Planner, Inspector, Validator, Scorer. Not everything is an "Analyst". Uniform naming reads as generated filler.
2. **Name the connector, never the category.** "HubSpot-qualified lead", never "CRM-qualified". A Salesforce shop reads HubSpot and correctly assumes their own parallel.

---

## 7. Three traps

**Tailwind v4 ignores `var()` inside class names.** `text-[var(--text-primary)]` silently renders nothing. Hex literals work in classes, `var()` works in inline styles and CSS files. The code already respects this.

**esbuild does not catch undefined JSX identifiers.** A green build is not proof. Open all six routes in a browser.

**Escapes in JSX text render literally.** Writing `’` inside JSX text puts the characters on screen. Use the real character. This bit us three times.

---

## 8. Verify

```bash
npm install && npm run dev
```

- `/workflows` lists six rows, four live, two with a Deploy button. The Deploy button shows "Deploying…" then goes live.
- `/workflows/wasted-spend` shows a three-agent canvas. Clicking the first card opens a drawer with Analytical responsibility, Evidence used, Analysis performed, Deliverable, Technical details, Next analytical step.
- `/agents` shows five families, Measurement marked Foundational.
- `/recommendations` shows six open cards. Accept opens a modal, and after confirming, the card walks from "confirming the saved settings" to the read-back line a few seconds later.

If a page is blank, it is nearly always a missing token file or a missing import. The browser console names it.
