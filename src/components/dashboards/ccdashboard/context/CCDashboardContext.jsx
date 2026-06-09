import { createContext, useContext } from 'react';
import { PUSHER_KEY, PUSHER_CLUSTER } from '../../../../config';
import { getApiBase, getAuthToken } from '../../../../api';

const CCDashboardContext = createContext(null);

export const CCDashboardProvider = ({
  children,
  queryClient,
  notifications,
  navigate,
  basePath = '/dashboards',
  widgets = {},
}) => {
  const value = {
    queryClient,
    notifications,
    navigate,
    basePath,
    config: {
      apiUrl: getApiBase(),
      pusherKey: PUSHER_KEY,
      pusherCluster: PUSHER_CLUSTER,
    },
    widgets: {
      AnalyticsChat: widgets.AnalyticsChat || null,
      ChatOverlay: widgets.ChatOverlay || null,
      FilesTrayButton: widgets.FilesTrayButton || null,
      ChatHistoryButton: widgets.ChatHistoryButton || null,
      WorkspaceTray: widgets.WorkspaceTray || null,
      useGetWorkspaceFiles: widgets.useGetWorkspaceFiles || null,
      cleanupAnalyticsChatQueries: widgets.cleanupAnalyticsChatQueries || (() => {}),
      getDashboardSessions: widgets.getDashboardSessions || (() => Promise.resolve([])),
      setApiConfig: widgets.setApiConfig || (() => {}),
      ...widgets,
    },
  };

  return (
    <CCDashboardContext.Provider value={value}>
      {children}
    </CCDashboardContext.Provider>
  );
};

export const useCCDashboardContext = () => {
  const context = useContext(CCDashboardContext);
  if (!context) {
    throw new Error('useCCDashboardContext must be used within CCDashboardProvider');
  }
  return context;
};

export const useQueryClient = () => useCCDashboardContext().queryClient;
export const useNotifications = () => useCCDashboardContext().notifications;
export const useNavigate = () => useCCDashboardContext().navigate;
export const useBasePath = () => useCCDashboardContext().basePath;
export const useConfig = () => useCCDashboardContext().config;
export const useWidgets = () => useCCDashboardContext().widgets;
