import { useMutation } from "@tanstack/react-query";
import axios from "../../../../lib/axios";
import { useNotificationStore } from "../stores/notifications";

// POST /api/v1/integration/{platform}/setupSync/SelectedFrequency
//   Save the tenant's sync schedule. Body:
//     { syncPeriod: number(years), syncFrequency: number(days), scheduleDetails: string }
//   scheduleDetails encodes the timezone token at the end ("1:00AM IST").
export const postSetupSyncFrequency = ({ platform, body }) => {
  return axios.post(
    `/api/v1/integration/${platform}/setupSync/SelectedFrequency`,
    body
  );
};

export const usePostSetupSyncFrequency = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: postSetupSyncFrequency,
    onError: (error) => {
      addNotification({
        type: "error",
        title: "Couldn't save schedule",
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
