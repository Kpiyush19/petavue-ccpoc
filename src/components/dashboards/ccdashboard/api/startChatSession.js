import { useMutation } from '@tanstack/react-query';
import { apiPost } from '../../../../api';
import { useNotifications } from '../context';

export const startChatSession = ({ dashboardId, source, workflowId, forceNew = false }) => {
  const body = forceNew ? { force_new: true } : {};
  if (source === 'workflow' && workflowId) {
    return apiPost(`/api/workflows/${workflowId}/chat`, body);
  }
  return apiPost(`/api/published/${dashboardId}/chat`, body);
};

export const useStartChatSession = () => {
  const notifications = useNotifications();

  return useMutation({
    mutationFn: (params) => startChatSession(params),
    onError: (error) => {
      notifications?.addNotification?.({
        type: 'error',
        title:
          error?.response?.data?.error?.message ||
          error?.message ||
          'Failed to start chat session',
      });
    },
  });
};
