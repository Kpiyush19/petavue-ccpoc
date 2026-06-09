let config = {
  apiUrl: "",
  googleClientId: "",
  storagePrefix: "app_"
};

export function setAuthConfig(newConfig) {
  config = { ...config, ...newConfig };
}

export function getAuthConfig() {
  return config;
}

export function getApiUrl() {
  return config.apiUrl;
}

export function getGoogleClientId() {
  return config.googleClientId;
}

export function getStoragePrefix() {
  return config.storagePrefix;
}
