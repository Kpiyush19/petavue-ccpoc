import { useMutation } from '@tanstack/react-query';
import { apiPost } from '../../../../api';

export async function sendMessage(sessionId, message, attachments = null) {
  const body = { message };
  if (attachments) {
    body.attachments = attachments;
  }
  return apiPost(`/api/sessions/${sessionId}/chat`, body);
}

export function useSendMessage({ onSuccess, onError, onNotification } = {}) {
  return useMutation({
    mutationFn: ({ sessionId, message, attachments }) =>
      sendMessage(sessionId, message, attachments),
    onSuccess: (data, variables) => {
      onSuccess?.(data, variables);
    },
    onError: (error) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Failed to send message';
      onNotification?.({
        type: 'error',
        title: message,
      });
      onError?.(error);
    },
  });
}
