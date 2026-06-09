import axios from '../../../lib/axios';
import storage from '../utils/storage';

export const logoutUser = async () => {
  const token = storage.getToken();
  return axios.post('/api/v1/auth/logout', null, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};
