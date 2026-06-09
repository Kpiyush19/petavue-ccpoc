import { useMutation } from "@tanstack/react-query";
import axios from "../../../../lib/axios";
import { useNotificationStore } from "../stores/notifications";

// POST /api/v1/integration/integration-setup/:id/custom-object-requests
//   Logs a custom-object request and fires a Sentry alert so ops can
//   provision the schema asynchronously.
//   Body: { requestedObjects: string[], notes?: string }
//     - BE rejects empty arrays, missing strings, names > 80 chars, or
//       arrays larger than MAX_CUSTOM_OBJECTS_PER_REQUEST with 400.
export const requestCustomObjects = ({ id, body }) => {
  return axios.post(
    `/api/v1/integration/integration-setup/${id}/custom-object-requests`,
    body
  );
};

export const useRequestCustomObjects = ({ config } = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: requestCustomObjects,
    onError: (error) => {
      addNotification({
        type: "error",
        title: "Couldn't submit custom object request",
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
