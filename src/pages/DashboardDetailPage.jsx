/**
 * DashboardDetailPage - Single dashboard view with embedded Sage chat
 * Uses ccdashboard module with analytics-chat-widget integration
 *
 * Key difference from legacy: Sage chat opens in overlay instead of navigating to /session/:id
 *
 * To revert: Replace with DashboardDetailPage_legacy.jsx
 */
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { queryClient } from '../lib/queryClient'

// ccdashboard module
import {
  CCDashboardProvider,
  CCDashboardView,
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

export default function DashboardDetailPage() {
  const { id } = useParams()
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
        <CCDashboardView dashboardId={id} />
      </CCDashboardWrapper>
    </CCDashboardProvider>
  )
}
