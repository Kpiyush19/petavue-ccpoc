import { toast } from 'sonner';

export const useNotificationStore = () => ({
  addNotification: ({ type, title, message }) => {
    const toastMessage = message ? `${title}: ${message}` : title;
    if (type === 'error') {
      toast.error(toastMessage);
    } else if (type === 'success') {
      toast.success(toastMessage);
    } else {
      toast(toastMessage);
    }
  },
  dismissNotification: () => {},
});
