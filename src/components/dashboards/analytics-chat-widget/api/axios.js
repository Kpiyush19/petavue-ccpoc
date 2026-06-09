import { getApiBase, getAuthToken, apiGet, apiPost, apiDelete } from '../../../../api';

export { getApiBase as getApiBaseUrl, getAuthToken };

export function setApiConfig() {}
export function clearAuthToken() {}

export const axios = {
  get: (path) => apiGet(path),
  post: (path, body) => apiPost(path, body),
  delete: (path) => apiDelete(path),
};
