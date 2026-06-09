import axios from "../../../../lib/axios";

// GET /api/v1/integration/fivetran/poll-completion
//
// Fallback for Fivetran's PbfCard not auto-redirecting back to our callback.
// While the user has a Connect Card tab open, we poll this endpoint —
// the BE asks Fivetran for each pending row's setup_state, finalizes any
// that came back `connected`, and returns the list so we can navigate.
export const pollFivetranCompletion = () => {
  return axios.get(`/api/v1/integration/fivetran/poll-completion`);
};
