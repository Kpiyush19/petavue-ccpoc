# Retired: Goals list page

`GoalsPage.jsx` was the `/goals` list (goal portfolio + goal-grouped recommendation
queue). Retired in favour of `/recommendations`; archived, not deleted.

`/goals` now redirects to `/recommendations`. The rest of the Goals module is still
live and routed: `/goals/new`, `/goals/:id`, `/goals/:id/runs`, and the
`/api/goals*` mock routes. To restore: move the file back and point the `goals`
route in `src/router.jsx` at it again.
