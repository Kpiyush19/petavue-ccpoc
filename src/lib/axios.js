import Axios from 'axios';
import { toast } from 'sonner';
import { PETAVUE_API_URL } from '../config';
import { installMockAdapter } from '../mocks';

const axios = Axios.create({
  baseURL: PETAVUE_API_URL,
});

installMockAdapter(axios);

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'An error occurred';
    toast.error(message);
    return Promise.reject(error);
  }
);

export default axios;
