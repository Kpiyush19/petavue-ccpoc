import { useMutation } from '@tanstack/react-query';
import { apiUpload } from '../../../../api';

export async function uploadFiles(sessionId, files) {
  return apiUpload(`/api/sessions/${sessionId}/upload`, files);
}

export function useUploadFiles({ onSuccess, onError, onNotification } = {}) {
  return useMutation({
    mutationFn: ({ sessionId, files }) => uploadFiles(sessionId, files),
    onSuccess: (data, variables) => {
      const failed = (data.uploads || []).filter((u) => u.error);
      if (failed.length > 0) {
        for (const f of failed) {
          onNotification?.({
            type: 'warning',
            title: `Upload failed: ${f.filename} — ${f.error}`,
          });
        }
      }
      onSuccess?.(data, variables);
    },
    onError: (error) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Failed to upload files';
      onNotification?.({
        type: 'error',
        title: message,
      });
      onError?.(error);
    },
  });
}
