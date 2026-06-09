import axios from '../../../lib/axios';

export const googleLogin = async (data) => {
  return axios.post('/api/v1/auth/google-login', data);
};
