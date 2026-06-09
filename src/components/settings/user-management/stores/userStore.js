import { create } from 'zustand';

export const useUserStore = create((set) => ({
  user: null,
  setUser: (detail) => set({ user: detail }),
}));
