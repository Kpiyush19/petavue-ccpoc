# PRD: Verify & Publish

| | |
|---|---|
| **Status** | Draft |
| **Target release** | TBD |
| **Epic** | [link] |
| **Document owner** | [you] |
| **Designer** | — |
| **Scope** | Front-end experience only (the modal flow). Excludes the data pipeline and the verifying agent's internals. |
| **Last updated** | 2026-06-15 |

---

## 1. Objective
Give users a single, guided flow to take a working dashboard from "looks right while I'm building it" to "trusted, scheduled, and shared." It does two things in order: **Verify** (prove the dashboard is correct before it can go live) and **Publish** (ship it as a live dashboard and/or an AI-written summary, sent wherever the team needs it).

## 2. Problem & background
Dashboards are built in a working session, but there's no checkpoint between building and relying on them — especially for recurring use, where a silent break is costly. There's also no clean way to distribute results: a summary that's useful weekly shouldn't be locked to a single Slack message. Verify & Publish adds the trust gate and a flexible distribution model in one modal.

## 3. Goals
- Nothing publishes until it has passed a review.
- Re-checking is effortless — don't make people re-verify when nothing changed.
- Users can publish a **dashboard**, a **summary**, or both — as separate choices.
- A summary can go to more than one place (a folder and/or Slack) so it's reusable beyond a single channel.
- The common path is fast: sensible defaults, clear gating, and no dead-ends where a button is disabled with no explanation.

## 4. Non-goals
- Building or configuring the data sources, or how the dashboard is generated.
- Summary destinations beyond folder and Slack (email / webhook / API are future).
- Nested or advanced folder management.

## 5. Users
- **Builder** — creates the dashboard, verifies it, and publishes. Primary user of this flow.
- **Recipients** — dashboard viewers, Slack channel members/people, and AI assistants that read the saved summary file.

## 6. Experience principles
- **Gate, don't nag.** Verification is mandatory, but the flow guides rather than scolds.
- **Choose, don't auto-jump.** After a review passes, the user opts into detail instead of being dropped into it.
- **Defaults do the obvious thing.** Publish the dashboard, save the summary — most users move straight through.
- **Never a silent dead-end.** If an action is blocked, the reason is shown at the moment it matters.
- **Respect time.** Skip re-verification when nothing changed; only re-run when the dashboard actually changed.

## 7. Information architecture
The modal has two top tabs, used in order:
1. **Verify** — must pass before Publish unlocks. Contains two steps: **User Review** (optional) → **Agentic Review** (the gate).
2. **Publish** — locked until the review passes. Contains three steps: **Workflow** → **Outputs** → **Schedule**.

Each tab shows a step indicator so the user always knows where they are and what's done.

---

## 8. Verify

### 8.1 User Review (optional)
- The user sees a list of the dashboard's widgets and can open any one to inspect/confirm it.
- Continuing from User Review marks the step complete (checkmark) and advances to Agentic Review.
- User Review can be skipped — it is not the gate.

**Acceptance criteria**
- Continuing from User Review marks it done in the step indicator.
- The user can reach Agentic Review without verifying every widget.

### 8.2 Agentic Review (the gate)
An AI agent reviews the dashboard end-to-end: checks the data, recomputes the numbers, and — for recurring dashboards — prepares it to run reliably on every refresh. If it finds issues, it proposes **adjustments** the user reviews.

**States the user can encounter:**

| State | What the user sees | Primary action |
|---|---|---|
| **Intro** | Explanation of what the review checks. | **Start Review** |
| **Running** | Progress checklist + progress bar; a "Preparing for scheduled refresh" step for recurring dashboards. | (wait) |
| **Passed** | A recap: every check that ran, plus a "Review passed" card. | **View adjustments** / **Continue** |
| **No code change detected** | Confirmation that nothing changed since the last review. | **View adjustments** (no re-run) / **Continue to Publish** |
| **Changes detected** | Notice that the dashboard changed since the last review (including edits made during User Review), showing the last request. | **Run review again** |
| **Error** | What went wrong and how to fix it. | **Run review again** |

**Passed → adjustments detail.** From the recap, **View adjustments** opens a three-part view:
- **Proposed adjustments** — each adjustment as a card the user can accept or skip individually, expand/collapse, and see what changed.
- **Ask or edit** — a chat to ask questions or request changes to any adjustment.
- **Output preview** — opens on demand to view the resulting file/dashboard.
- Footer: **Approve adjustments & continue**. **Back** returns to the recap.

**Acceptance criteria**
- Publishing is locked until the review passes.
- A passed review shows a recap first; the detailed adjustments view is opened by the user, not automatically.
- When nothing changed, the review is skipped and the user can still view the previous adjustments without re-running.
- When the dashboard changed, the user is told and must re-run before publishing.
- Each adjustment can be individually accepted or skipped.

---

## 9. Publish

Publish is a three-step sequence with a step indicator. It is only reachable after the review passes.

### 9.1 Workflow
- The user chooses **Create new workflow** or **Edit an existing one**, and names the workflow (or selects which to edit).
- Editing pre-fills the following steps from the existing workflow.

### 9.2 Outputs — "What do you want to publish?"
The user toggles on any combination of two artifacts:

**Dashboard**
- A live dashboard on the Dashboards page.
- Requires a name.

**Summary** (an AI-written recap of the data)
- **Authoring:** a prompt (pre-filled with a useful example) → **Generate** → live preview of the result.
- **Destinations** appear only after the first summary is generated, and at least one is required (marked with `*`):
  - **Save to a folder** *(on by default)* — keeps it in a folder so the team and AI assistants can pick it up anytime. The user picks an **existing folder or creates a new one**, and names the file.
  - **Send to Slack** — posts the summary to a channel or people each time the data refreshes; includes a **Test alert** to preview the message.

**Acceptance criteria**
- At least one of Dashboard / Summary must be selected to continue.
- Dashboard, when on, requires a name.
- The summary's destination options are hidden until a summary has been generated; once generated, the view scrolls to reveal them.
- Summary requires at least one destination; folder requires a file name (and a name for a newly created folder).

### 9.3 Schedule
- The user chooses a **one-time snapshot** or a **recurring** schedule (frequency, day, time, timezone).
- The dashboard and summary refresh together on the chosen cadence.

### 9.4 Success
- On publish, a confirmation screen appears with a **View dashboard** action.

---

## 10. Gating & validation rules (as experienced)
- **Publish tab is locked** until the Agentic Review passes.
- **Continue (Outputs)** is enabled when there is at least one valid output:
  - Dashboard selected and named, and/or
  - Summary generated with at least one destination (a valid folder, or Slack toggled on).
- **Continue stays enabled when Slack is on but no channel/DM is picked.** If the user clicks Continue in that state, an inline message appears beneath the Test alert button — *"Select at least one channel or direct message to continue"* — and the step does not advance. The message clears once a channel/DM is chosen.
- Blocking reasons are surfaced contextually (e.g. "Name your dashboard," "Generate the summary first," "Name the new folder") rather than leaving a button silently disabled.

## 11. Key copy reference
- Outputs heading: *"What do you want to publish?"*
- Summary destinations heading: *"What do you want to do with this summary?*"* (required marker)
- Folder: *"Keep it in a folder so your team and AI assistants can pick it up anytime."*
- Slack: *"Send it to a channel or teammates every time the data refreshes."*
- No-change state: *"No code change detected — … Open the review to see the adjustments, output and ask or edit."*

## 12. Success metrics
- **Trust:** 100% of publishes preceded by a passed review (by design — track for regressions).
- **Efficiency:** re-verification skip rate (skips ÷ reopens) — quantifies time saved.
- **Adoption:** % of publishes that include a summary; folder vs. Slack destination split.
- **Funnel:** time-to-publish and drop-off at each step (Workflow / Outputs / Schedule).

## 13. Open questions
- Should a summary ever be publishable with **no** destination (generate-and-discard)? Current stance: no.
- When changes are detected, should the user be able to view the previous adjustments before re-running?
- Should User Review surface completion progress (e.g. "3 of 8 widgets reviewed") or stay fully optional?

## 14. Out of scope / future
- Additional summary destinations: email, webhook, API (the destinations model is built to extend).
- Richer folder organization (nested folders, browsing).
- Multi-workspace Slack management.
