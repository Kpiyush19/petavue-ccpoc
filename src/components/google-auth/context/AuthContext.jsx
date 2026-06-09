import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setAuthConfig } from '../config';
import { initReactQueryAuth } from '../lib/initReactQueryAuth';
import storage from '../utils/storage';
import { decodeToken, isTokenExpired } from '../utils/decodeToken';
import { googleLogin } from '../api/googleLogin';
import { loginWithEmailAndPassword } from '../api/emailLogin';
import { logoutUser } from '../api/logout';

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function createAuthProvider(config) {
  const {
    apiUrl,
    googleClientId,
    storagePrefix = 'app_',
    queryClient = defaultQueryClient,
    onLogout,
    getToken,
    LoaderComponent,
    ErrorComponent,
  } = config;

  setAuthConfig({ apiUrl, googleClientId, storagePrefix });

  async function loadUser() {
    const token = getToken ? getToken() : storage.getToken();
    if (!token) return null;

    if (isTokenExpired(token)) {
      storage.clear();
      return null;
    }

    const decoded = decodeToken(token);
    if (!decoded) return null;

    return {
      id: decoded.userId,
      role: decoded.userRole || decoded.role,
      tenantId: decoded.tenantId,
      email: storage.getEmail(),
    };
  }

  async function handleLoginResponse(data, email) {
    const { access_token } = data;
    storage.setToken(access_token);
    if (email) storage.setEmail(email);
    return loadUser();
  }

  async function loginFn({ username, password }) {
    const response = await loginWithEmailAndPassword({ username, password });
    return handleLoginResponse(response, username);
  }

  async function googleLoginFn({ access_token }) {
    const response = await googleLogin({ access_token });
    return handleLoginResponse(response, response.email);
  }

  async function logoutFn() {
    await logoutUser().catch(() => {});
    storage.clear();
    onLogout?.();
  }

  const { AuthProvider: BaseAuthProvider, useAuth } = initReactQueryAuth({
    loadUser,
    loginFn,
    googleLoginFn,
    logoutFn,
    LoaderComponent,
    ErrorComponent,
  });

  function AuthProvider({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <GoogleOAuthProvider clientId={googleClientId}>
          <BaseAuthProvider>{children}</BaseAuthProvider>
        </GoogleOAuthProvider>
      </QueryClientProvider>
    );
  }

  return { AuthProvider, useAuth };
}

export { createAuthProvider };
