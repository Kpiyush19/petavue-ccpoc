import { useMutation } from "@tanstack/react-query";
import axios from "../../../../lib/axios";
import { useNotificationStore } from "../stores/notifications";

// POST /api/v1/integration/integration-setup/:id/request-disconnect
//   Soft-disconnect — flips isActive: false and notifies ops. No hard delete.
//   Body (optional): { reason?: string }
export const requestSetupDisconnect = ({ id, body }) => {
  return axios.post(`/api/v1/integration/integration-setup/${id}/request-disconnect`, body || {});
};

export const useRequestSetupDisconnect = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: requestSetupDisconnect,
    onError: (error) => {
      addNotification({
        type: "error",
        title: "Couldn't request disconnect",
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
