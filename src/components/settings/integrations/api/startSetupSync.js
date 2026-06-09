import { useMutation } from "@tanstack/react-query";
import axios from "../../../../lib/axios";
import { useNotificationStore } from "../stores/notifications";

// POST /api/v1/integration/integration-setup/:id/start
//   Trigger the initial sync at the end of the wizard.
export const startSetupSync = ({ id }) => {
  return axios.post(`/api/v1/integration/integration-setup/${id}/start`);
};

export const useStartSetupSync = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: startSetupSync,
    onError: (error) => {
      addNotification({
        type: "error",
        title: "Couldn't start sync",
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
