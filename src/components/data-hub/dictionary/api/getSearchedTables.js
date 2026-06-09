import { useInfiniteQuery } from '@tanstack/react-query';
import { useAxios } from '../context';

export const getSearchedTables = (axios, {
  tableNameKeyword = '',
  pageNumber = 1,
  pageSize = 100,
  status,
  integrationId,
  tableIds,
}) => {
  let url = `/api/v1/integration/data-dictionaries/tables?tableNameKeyword=${tableNameKeyword}&pageSize=${pageSize}&pageNumber=${pageNumber}`;
  if (typeof status === 'boolean') {
    url += `&status=${status}`;
  }
  if (integrationId) {
    url += `&integrationId=${integrationId}`;
  }
  if (tableIds) {
    url += `&tableIds=${tableIds}`;
  }
  return axios.get(url);
};

export const useGetSearchedTables = ({
  tableNameKeyword = '',
  pageSize = 100,
  status,
  integrationId,
  tableIds,
  config,
} = {}) => {
  const axios = useAxios();

  const queryKey = ['searchedTablesWithTableName', tableNameKeyword];
  if (typeof status === 'boolean') {
    queryKey.push(status);
  }
  if (integrationId) {
    queryKey.push(integrationId);
  }
  if (tableIds) {
    queryKey.push(tableIds);
  }

  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) =>
      getSearchedTables(axios, {
        tableNameKeyword,
        pageNumber: pageParam,
        pageSize,
        status,
        integrationId,
        tableIds,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage?.pageNumber < lastPage?.totalPages
        ? lastPage.pageNumber + 1
        : undefined;
    },
    ...config,
  });
};
