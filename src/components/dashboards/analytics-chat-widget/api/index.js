export {
  setApiConfig,
  getApiBaseUrl,
  getAuthToken,
  clearAuthToken,
} from './axios';

export { createSession, useCreateSession } from './createSession';
export { getSessionStatus, useGetSessionStatus } from './getSessionStatus';
export { getSessionHistory, useGetSessionHistory } from './getSessionHistory';
export {
  getDashboardSessions,
  useGetDashboardSessions,
} from './getDashboardSessions';
export { sendMessage, useSendMessage } from './sendMessage';
export { cancelTurn, useCancelTurn } from './cancelTurn';
export { deleteLastMessage, useDeleteLastMessage } from './deleteLastMessage';

export { uploadFiles, useUploadFiles } from './uploadFiles';
export { getFileData, useGetFileData } from './getFileData';
export { getRawFileData, useGetRawFileData } from './getRawFileData';
export { getWorkspaceFiles, useGetWorkspaceFiles } from './getWorkspaceFiles';

export const ANALYTICS_CHAT_QUERY_KEYS = [
  'session-history',
  'dashboard-sessions',
  'workspace-files',
  'file-data',
  'raw-file-data',
];

export function cleanupAnalyticsChatQueries(queryClient) {
  if (!queryClient) {
    console.warn(
      'cleanupAnalyticsChatQueries: queryClient is required but was not provided'
    );
    return;
  }
  ANALYTICS_CHAT_QUERY_KEYS.forEach((key) => {
    queryClient.removeQueries(key);
  });
}
