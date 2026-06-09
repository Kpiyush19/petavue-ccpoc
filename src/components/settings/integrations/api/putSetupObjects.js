import { useMutation } from "@tanstack/react-query";
import axios from "../../../../lib/axios";
import { useNotificationStore } from "../stores/notifications";

// PUT /api/v1/integration/integration-setup/:id/objects
//   Replace-semantic save of the user's object picks.
//   Body: { selectedObjects: string[], pausedObjects?: string[] }
//   NOTE: BE field is `selectedObjects` (not `objects`).
export const putSetupObjects = ({ id, body }) => {
  return axios.put(`/api/v1/integration/integration-setup/${id}/objects`, body);
};

export const usePutSetupObjects = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: putSetupObjects,
    onError: (error) => {
      addNotification({
        type: "error",
        title: "Couldn't save object selection",
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
