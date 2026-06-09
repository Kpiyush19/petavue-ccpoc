import { useMutation } from "@tanstack/react-query";
import axios from "../../../../lib/axios";
import { useNotificationStore } from "../stores/notifications";

// POST /api/v1/integration/integration-setup/:id/test-connection
//   Probes the stored OAuth token. Returns 200 even when invalid —
//   caller branches on `tokenStatus` ('valid' | 'invalid' | 'expired').
export const testSetupConnection = ({ id }) => {
  return axios.post(`/api/v1/integration/integration-setup/${id}/test-connection`);
};

export const useTestSetupConnection = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: testSetupConnection,
    onError: (error) => {
      addNotification({
        type: "error",
        title: "Test Connection failed",
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
