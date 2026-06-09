import { useEffect } from 'react';
import { useQueryClient } from '../context';
import useCCDashboardStore from '../store/useCCDashboardStore';

export const CCDashboardWrapper = ({ children }) => {
  const queryClient = useQueryClient();
  const clearAllChatInputs = useCCDashboardStore(
    (state) => state.clearAllChatInputs
  );

  useEffect(() => {
    return () => {
      // Only clear chat inputs on unmount, cache cleanup handled by DashboardsLayout
      clearAllChatInputs();
    };
  }, [clearAllChatInputs]);

  return <>{children}</>;
};
