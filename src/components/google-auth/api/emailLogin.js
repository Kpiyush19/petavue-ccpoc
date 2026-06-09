import axios from '../../../lib/axios';

export const loginWithEmailAndPassword = async (data) => {
  return axios.post('/api/v1/auth/login', data);
};
