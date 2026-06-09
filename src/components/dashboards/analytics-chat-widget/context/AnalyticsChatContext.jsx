import { createContext, useContext, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * AnalyticsChatContext - Provides dependency injection for the Analytics Chat Widget
 *
 * This context allows the widget to be completely self-contained and reusable
 * by accepting external dependencies via props/context rather than importing
 * from the host application.
 *
 * Required dependencies:
 *   - queryClient: React Query QueryClient instance (optional - creates default if not provided)
 *   - onNotification: Callback for showing notifications (optional)
 *   - components: External component overrides (optional)
 */

const AnalyticsChatContext = createContext(null);

// Default notification handler (no-op)
const defaultOnNotification = () => {};

// Default components (can be overridden)
const defaultComponents = {
  Button: null,
  Input: null,
  Tooltip: null,
};

export function AnalyticsChatProvider({
  children,
  queryClient: externalQueryClient,
  onNotification = defaultOnNotification,
  components = {},
}) {
  // Create internal QueryClient if not provided
  const internalQueryClient = useMemo(() => {
    if (externalQueryClient) return null;
    return new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: 1,
          staleTime: 5 * 60 * 1000,
        },
      },
    });
  }, [externalQueryClient]);

  const queryClient = externalQueryClient || internalQueryClient;

  const value = useMemo(
    () => ({
      queryClient,
      onNotification,
      components: { ...defaultComponents, ...components },
    }),
    [queryClient, onNotification, components]
  );

  // If using internal QueryClient, wrap with provider
  if (internalQueryClient) {
    return (
      <QueryClientProvider client={internalQueryClient}>
        <AnalyticsChatContext.Provider value={value}>
          {children}
        </AnalyticsChatContext.Provider>
      </QueryClientProvider>
    );
  }

  return (
    <AnalyticsChatContext.Provider value={value}>
      {children}
    </AnalyticsChatContext.Provider>
  );
}

export function useAnalyticsChatContext() {
  const context = useContext(AnalyticsChatContext);
  if (!context) {
    throw new Error(
      'useAnalyticsChatContext must be used within an AnalyticsChatProvider'
    );
  }
  return context;
}

/**
 * Hook to access the QueryClient from context
 */
export function useQueryClientFromContext() {
  const { queryClient } = useAnalyticsChatContext();
  return queryClient;
}

/**
 * Hook to show notifications via the context callback
 */
export function useNotification() {
  const { onNotification } = useAnalyticsChatContext();
  return {
    addNotification: (notification) => {
      onNotification(notification);
    },
    showError: (message, title = 'Error') => {
      onNotification({ type: 'error', title, message });
    },
    showSuccess: (message, title = 'Success') => {
      onNotification({ type: 'success', title, message });
    },
    showWarning: (message, title = 'Warning') => {
      onNotification({ type: 'warning', title, message });
    },
  };
}

/**
 * Hook to access external component overrides
 */
export function useExternalComponents() {
  const { components } = useAnalyticsChatContext();
  return components;
}

export default AnalyticsChatContext;
