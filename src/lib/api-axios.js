import Axios from 'axios';
import { toast } from 'sonner';
import { installMockAdapter } from '../mocks';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const apiAxios = Axios.create({
  baseURL: API_BASE,
});

installMockAdapter(apiAxios);

apiAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.authorization = `Bearer ${token}`;
  }
  return config;
});

apiAxios.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
      return Promise.reject(error);
    }
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'An error occurred';
    toast.error(message);
    return Promise.reject(error);
  }
);

export default apiAxios;
