/**
 * DashboardsPage - List of published dashboards
 * Uses ccdashboard module with analytics-chat-widget integration
 *
 * To revert: Replace with DashboardsPage_legacy.jsx
 */
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { queryClient } from '../lib/queryClient'

// ccdashboard module
import {
  CCDashboardProvider,
  CCDashboardHome,
  CCDashboardWrapper,
} from '../components/dashboards/ccdashboard'

// analytics-chat-widget
import {
  AnalyticsChat,
  setApiConfig,
  getDashboardSessions,
  useGetDashboardSessions,
  cleanupAnalyticsChatQueries,
  useGetWorkspaceFiles,
} from '../components/dashboards/analytics-chat-widget'

// dashboard-viewer-widget
import {
  ChatOverlay,
  ChatHistoryButton,
  FilesTrayButton,
} from '../components/dashboards/dashboard-viewer-widget'

// workspace-tray-widget
import { WorkspaceTray } from '../components/dashboards/workspace-tray-widget'

// Import styles
import '../components/dashboards/analytics-chat-widget/styles.css'
import '../components/dashboards/dashboard-viewer-widget/styles.css'
import '../components/dashboards/workspace-tray-widget/styles.css'

export default function DashboardsPage() {
  const navigate = useNavigate()

  return (
    <CCDashboardProvider
      queryClient={queryClient}
      notifications={{
        addNotification: ({ type, title }) => {
          if (type === 'error') toast.error(title)
          else if (type === 'warning') toast.warning(title)
          else if (type === 'success') toast.success(title)
          else toast.info(title)
        },
      }}
      navigate={(path) => navigate(path)}
      basePath="/dashboards"
      widgets={{
        AnalyticsChat,
        ChatOverlay,
        FilesTrayButton,
        ChatHistoryButton,
        WorkspaceTray,
        useGetWorkspaceFiles,
        useGetDashboardSessions,
        cleanupAnalyticsChatQueries,
        getDashboardSessions,
        setApiConfig,
      }}
    >
      <CCDashboardWrapper>
        <CCDashboardHome />
      </CCDashboardWrapper>
    </CCDashboardProvider>
  )
}
