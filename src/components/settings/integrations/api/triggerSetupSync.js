import { useMutation } from "@tanstack/react-query";
import axios from "../../../../lib/axios";
import { useNotificationStore } from "../stores/notifications";

// POST /api/v1/integration/integration-setup/:id/sync
//   Manual sync trigger (post-setup). Body: { objects?: string[], syncMode?: 'full' | 'incremental' | 'initial' }
export const triggerSetupSync = ({ id, body }) => {
  return axios.post(`/api/v1/integration/integration-setup/${id}/sync`, body || {});
};

export const useTriggerSetupSync = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: triggerSetupSync,
    onError: (error) => {
      addNotification({
        type: "error",
        title: "Couldn't trigger sync",
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
