import { getStoragePrefix } from '../config';

const storage = {
  getToken: () => {
    const prefix = getStoragePrefix();
    return window.localStorage.getItem(`${prefix}token`);
  },
  setToken: (token) => {
    const prefix = getStoragePrefix();
    window.localStorage.setItem(`${prefix}token`, token);
  },
  clearToken: () => {
    const prefix = getStoragePrefix();
    window.localStorage.removeItem(`${prefix}token`);
  },
  getEmail: () => {
    const prefix = getStoragePrefix();
    return window.localStorage.getItem(`${prefix}email`);
  },
  setEmail: (email) => {
    const prefix = getStoragePrefix();
    window.localStorage.setItem(`${prefix}email`, email);
  },
  clear: () => {
    window.localStorage.clear();
  },
};

export default storage;
