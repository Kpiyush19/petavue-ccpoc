import { createContext, useContext, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function initReactQueryAuth(config) {
  const AuthContext = createContext(null);

  const {
    loadUser,
    loginFn,
    googleLoginFn,
    logoutFn,
    onLoginSuccess,
    key = 'auth-user',
    LoaderComponent = () => <div>Loading...</div>,
    ErrorComponent = (error) => (
      <div style={{ color: 'tomato' }}>{JSON.stringify(error, null, 2)}</div>
    ),
  } = config;

  function AuthProvider({ children }) {
    const queryClient = useQueryClient();

    const {
      data: user,
      error,
      status,
      isLoading,
      isPending,
      isSuccess,
      refetch,
    } = useQuery({
      queryKey: [key],
      queryFn: loadUser,
    });

    const setUser = useCallback(
      (data) => queryClient.setQueryData([key], data),
      [queryClient]
    );

    const loginMutation = useMutation({
      mutationFn: loginFn,
      onSuccess: (user) => {
        setUser(user);
        onLoginSuccess?.(user);
      },
      onError: () => null,
    });

    const googleLoginMutation = useMutation({
      mutationFn: googleLoginFn,
      onSuccess: (user) => {
        setUser(user);
        onLoginSuccess?.(user);
      },
      onError: () => null,
    });

    const logoutMutation = useMutation({
      mutationFn: logoutFn,
      onSuccess: () => {
        queryClient.clear();
      },
    });

    const value = useMemo(
      () => ({
        user,
        error,
        setUser,
        refetchUser: refetch,
        login: loginMutation.mutateAsync,
        googleLogin: googleLoginMutation.mutateAsync,
        isLoggingIn: loginMutation.isPending || googleLoginMutation.isPending,
        logout: logoutMutation.mutateAsync,
        isLoggingOut: logoutMutation.isPending,
      }),
      [
        user,
        error,
        setUser,
        refetch,
        loginMutation.mutateAsync,
        loginMutation.isPending,
        googleLoginMutation.mutateAsync,
        googleLoginMutation.isPending,
        logoutMutation.mutateAsync,
        logoutMutation.isPending,
      ]
    );

    if (isPending || isLoading) {
      return <LoaderComponent />;
    }

    if (error) {
      return <ErrorComponent error={error} />;
    }

    if (isSuccess) {
      return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
      );
    }

    return <div>Unhandled status: {status}</div>;
  }

  function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  }

  return { AuthProvider, useAuth };
}
