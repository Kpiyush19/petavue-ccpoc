import { useQuery } from '@tanstack/react-query';
import { useAxios } from '../context';

export const getTableColumnsList = (axios, {
  tableId,
  keyword = '',
  pageNumber = 1,
  pageSize = 100,
  searchKeywordInDescription = false,
  filterConfig,
}) => {
  return axios.get(
    `/api/v1/integration/data-dictionaries/tables/${tableId}/columns?pageSize=${pageSize}&pageNumber=${pageNumber}&keyword=${keyword}${filterConfig ? `&dataFillOperator=${filterConfig.dataFillOperator}&dataFillValue=${filterConfig.dataFillValue}${typeof filterConfig.status === 'boolean' ? `&status=${filterConfig.status}` : ``}${filterConfig.formats ? `&formats=${filterConfig.formats}` : ``}${filterConfig.dataTypes ? `&dataTypes=${filterConfig.dataTypes}` : ``}${filterConfig.tags ? `&tags=${filterConfig.tags}` : ``}` : ``}${searchKeywordInDescription ? `&searchKeywordInDescription=${searchKeywordInDescription}` : ``}`
  );
};

export const useGetTableColumnsList = ({
  tableId,
  keyword = '',
  pageNumber,
  filterConfig,
  pageSize = 100,
  searchKeywordInDescription,
  config,
}) => {
  const axios = useAxios();

  const queryKey = ['tableColumns'];
  if (tableId !== null) {
    queryKey.push(tableId, keyword, pageNumber);
  }
  if (searchKeywordInDescription) {
    queryKey.push('searchKeywordInDescription');
  }
  if (pageSize !== 100) {
    queryKey.push(pageSize);
  }
  if (filterConfig) {
    const {
      dataFillOperator,
      dataFillValue,
      status,
      formats,
      dataTypes,
      tags,
    } = filterConfig;
    queryKey.push(dataFillOperator, dataFillValue);
    if (typeof status === 'boolean') {
      queryKey.push(status);
    }
    if (formats) {
      queryKey.push(formats);
    }
    if (dataTypes) {
      queryKey.push(dataTypes);
    }
    if (tags) {
      queryKey.push(tags);
    }
  }

  return useQuery({
    queryKey,
    queryFn: () =>
      getTableColumnsList(axios, {
        tableId,
        keyword,
        pageNumber,
        pageSize,
        searchKeywordInDescription,
        filterConfig,
      }),
    ...config,
  });
};
