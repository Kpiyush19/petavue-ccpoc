import { useMutation } from "@tanstack/react-query";
import axios from "../../../../lib/axios";
import { useNotificationStore } from "../stores/notifications";

// POST /api/v1/integration/integration-setup/:id/clear-initial-review
//   Petavue staff only. Clears the post-initial-sync review hold (LF-tag
//   enablement), resumes the connector, and restarts the data-catalog build.
export const clearInitialReview = ({ id }) => {
  return axios.post(`/api/v1/integration/integration-setup/${id}/clear-initial-review`, {});
};

export const useClearInitialReview = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: clearInitialReview,
    onError: (error) => {
      addNotification({
        type: "error",
        title: "Couldn't enable for analysis",
        message:
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Please try again."
      });
    },
    ...config
  });
};
