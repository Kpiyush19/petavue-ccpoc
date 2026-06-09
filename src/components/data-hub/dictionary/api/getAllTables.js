import { useQuery } from '@tanstack/react-query';
import { useAxios } from '../context';

export const getTablesList = (axios, {
  keyword = '',
  columnNameKeyword = '',
  tableNameKeyword = '',
  integrationId = '',
  pageNumber = 1,
  pageSize = 100,
}) => {
  return axios.get(
    `/api/v1/integration/data-dictionaries/tables?keyword=${keyword}&columnNameKeyword=${columnNameKeyword}&tableNameKeyword=${tableNameKeyword}&integrationId=${integrationId}&pageSize=${pageSize}&pageNumber=${pageNumber}`
  );
};

export const useGetTablesList = ({
  keyword = '',
  columnNameKeyword = '',
  tableNameKeyword = '',
  integrationId = '',
  pageNumber = 1,
  pageSize = 100,
  config,
} = {}) => {
  const axios = useAxios();

  let queryKey = [
    'allTables',
    keyword,
    columnNameKeyword,
    tableNameKeyword,
    integrationId,
    pageNumber,
  ];
  if (pageSize > 100) {
    queryKey.push(pageSize);
  }
  return useQuery({
    queryKey,
    queryFn: () =>
      getTablesList(axios, {
        keyword,
        columnNameKeyword,
        tableNameKeyword,
        integrationId,
        pageNumber,
        pageSize,
      }),
    ...config,
  });
};
