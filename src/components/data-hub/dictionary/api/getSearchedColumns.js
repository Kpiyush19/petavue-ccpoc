import { useInfiniteQuery } from '@tanstack/react-query';
import { useAxios } from '../context';

export const getSearchedColumns = (axios, {
  keyword = '',
  pageNumber = 1,
  pageSize = 100,
  sortTableOnTop,
  status,
  integrationId,
  tableIds,
}) => {
  let url = `/api/v1/integration/data-dictionaries/columns?keyword=${keyword}&pageSize=${pageSize}&pageNumber=${pageNumber}`;
  if (sortTableOnTop) {
    url += `&sortTableOnTop=${sortTableOnTop}`;
  }
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

export const useGetSearchedColumns = ({
  keyword = '',
  pageSize = 100,
  sortTableOnTop,
  status,
  integrationId,
  tableIds,
  config,
} = {}) => {
  const axios = useAxios();

  const queryKey = ['searchedColumnsWithColumnName', keyword, sortTableOnTop];
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
      getSearchedColumns(axios, {
        keyword,
        pageNumber: pageParam,
        pageSize,
        sortTableOnTop,
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
