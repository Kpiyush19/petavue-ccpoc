// Analytics Chat Widget - Main Exports
// A self-contained, reusable chat widget with artifact viewer

// Main component
export { default as AnalyticsChat } from './AnalyticsChat';

// Context and Provider (for dependency injection)
export {
  AnalyticsChatProvider,
  useAnalyticsChatContext,
  useQueryClientFromContext,
  useNotification,
  useExternalComponents,
} from './context/AnalyticsChatContext';

// API utilities
export {
  setApiConfig,
  getApiBaseUrl,
  getAuthToken,
  // React Query hooks
  useCreateSession,
  useGetSessionHistory,
  useGetDashboardSessions,
  useSendMessage,
  useCancelTurn,
  useDeleteLastMessage,
  useUploadFiles,
  useGetFileData,
  useGetWorkspaceFiles,
  // Raw API functions
  getDashboardSessions,
  createSession,
  getSessionHistory,
  sendMessage,
  cancelTurn,
  deleteLastMessage,
  uploadFiles,
  getFileData,
  getWorkspaceFiles,
  // Cleanup utility
  cleanupAnalyticsChatQueries,
  ANALYTICS_CHAT_QUERY_KEYS,
} from './api';

// Pusher config
export { setPusherConfig, getPusherKey, getPusherCluster } from './config';

// Hooks (for advanced usage)
export { useSession } from './hooks/useSession';
export { usePusher } from './hooks/usePusher';
export { useDataTable } from './hooks/useDataTable';
export { useArtifactPanel } from './hooks/useArtifactPanel';

// UI Components (for customization)
export { Button, Tooltip } from '@/ui';
export { Badge } from './components/ui/Badge';
export { Input, Textarea, Select, Label } from './components/ui/Input';
export { default as TextareaAutosize } from './components/ui/TextareaAutosize';

// Utility functions
export { cn } from './utils/cn';
export { inferContentType, getFileIcon, formatFileSize } from './utils/fileTypes';
export { escapeHtml, formatToolInput } from './utils/escapeHtml';
