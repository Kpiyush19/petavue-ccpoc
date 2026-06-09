import { createContext, useContext } from 'react';

const DictionaryContext = createContext(null);

export const DictionaryProvider = ({
  children,
  axios,
  queryClient,
  notifications,
  user,
  navigate,
  basePath = '/data-catalog',
}) => {
  const value = {
    axios,
    queryClient,
    notifications,
    user,
    navigate,
    basePath,
  };

  return (
    <DictionaryContext.Provider value={value}>
      {children}
    </DictionaryContext.Provider>
  );
};

export const useDictionaryContext = () => {
  const context = useContext(DictionaryContext);
  if (!context) {
    throw new Error('useDictionaryContext must be used within DictionaryProvider');
  }
  return context;
};

export const useAxios = () => useDictionaryContext().axios;
export const useQueryClient = () => useDictionaryContext().queryClient;
export const useNotifications = () => useDictionaryContext().notifications;
export const useUser = () => useDictionaryContext().user;
export const useNavigate = () => useDictionaryContext().navigate;
export const useBasePath = () => useDictionaryContext().basePath;
