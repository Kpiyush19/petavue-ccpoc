import { useMutation } from "@tanstack/react-query";
import axios from "../../../../lib/axios";
import { useNotificationStore } from "../stores/notifications";

// PUT /api/v1/integration/integration-setup/:id/associations
//   HubSpot only. Body: { associations: AssociationPair[] }
//   Empty array reverts to auto mode.
export const putSetupAssociations = ({ id, body }) => {
  return axios.put(`/api/v1/integration/integration-setup/${id}/associations`, body);
};

export const usePutSetupAssociations = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: putSetupAssociations,
    onError: (error) => {
      addNotification({
        type: "error",
        title: "Couldn't save associations",
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
