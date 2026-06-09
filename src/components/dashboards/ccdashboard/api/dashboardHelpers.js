import { getApiBase, getAuthToken } from '../../../../api';

export const getDashboardApiPath = (dashboard) => {
  return `/api/workflows/dashboards/${dashboard.id}`;
};

export const getDashboardFileUrl = (dashboard) => {
  if (!dashboard?.latest_run || !dashboard?.target_file) {
    return null;
  }

  const baseUrl = getApiBase();
  const authToken = getAuthToken();
  const encodedToken = encodeURIComponent(authToken || '');

  if (dashboard.source === 'workflow') {
    return `${baseUrl}/api/workflows/dashboards/${dashboard.id}/files/${dashboard.target_file}?token=${encodedToken}`;
  }

  return `${baseUrl}/api/published/${dashboard.id}/files/${dashboard.target_file}?token=${encodedToken}`;
};

export const getDashboardId = (dashboard) => {
  return dashboard?.id || dashboard?.published_id;
};
