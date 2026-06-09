import { create } from 'zustand';

export const useUserDetailStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
