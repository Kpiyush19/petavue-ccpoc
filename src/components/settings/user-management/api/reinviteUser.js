import { useMutation } from '@tanstack/react-query';
import axios from '../../../../lib/axios';
import { useNotificationStore } from '../stores/notifications';

export const reinviteUser = async ({ data }) => {
  return axios.post(`/api/v1/tenant/users/${data.userId}/resend-invite`);
};

export const useReinvite = (config = {}) => {
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn: reinviteUser,
    onError: () => {
      addNotification({
        type: 'error',
        title: 'Failed to Resend Invite',
      });
    },
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Invite Sent Successfully',
      });
    },
    ...config,
  });
};
