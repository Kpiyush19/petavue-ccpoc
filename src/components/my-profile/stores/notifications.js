import { create } from 'zustand';

let notificationId = 0;

export const useNotificationStore = create((set) => ({
  notifications: [],
  addNotification: (notification, duration = 3000) => {
    const id = ++notificationId;
    set((state) => ({
      notifications: [...state.notifications, { id, ...notification }],
    }));

    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter(
          (notification) => notification.id !== id
        ),
      }));
    }, duration);
  },
  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.id !== id
      ),
    })),
}));
