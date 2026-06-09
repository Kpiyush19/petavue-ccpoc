import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const useCCDashboardStore = create()(
  immer((set, get) => ({
    chatInputs: {},

    getChatInputKey: (dashboardId, sessionId) =>
      `${dashboardId}:${sessionId || 'new'}`,

    setChatInput: (dashboardId, sessionId, value) => {
      set((state) => {
        const key = `${dashboardId}:${sessionId || 'new'}`;
        state.chatInputs[key] = value;
      });
    },

    getChatInput: (dashboardId, sessionId) => {
      const key = `${dashboardId}:${sessionId || 'new'}`;
      return get().chatInputs[key] || '';
    },

    clearChatInput: (dashboardId, sessionId) => {
      set((state) => {
        const key = `${dashboardId}:${sessionId || 'new'}`;
        delete state.chatInputs[key];
      });
    },

    clearAllChatInputs: () => {
      set((state) => {
        state.chatInputs = {};
      });
    },
  }))
);

export default useCCDashboardStore;
