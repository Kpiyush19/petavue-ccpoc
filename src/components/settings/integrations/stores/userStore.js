import { create } from 'zustand';

export const useUserStore = create((set) => ({
  hasDetail: false,
  user: null,
  error: false,
  loggingOut: false,
  setHasDetail: (flag) => set({ hasDetail: flag }),
  setUser: (detail) => set({ user: detail }),
  setFetchError: (flag) => set({ error: flag }),
  setLoggingOut: (flag) => set({ loggingOut: flag }),
}));
