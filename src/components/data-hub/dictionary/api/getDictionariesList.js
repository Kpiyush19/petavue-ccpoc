import { useQuery } from '@tanstack/react-query';
import { useAxios } from '../context';

export const getDictionariesList = (axios, { keyword = '', columnNameKeyword = '' }) => {
  return axios.get(
    `/api/v1/integration/data-dictionaries?keyword=${keyword}&columnNameKeyword=${columnNameKeyword}`
  );
};

export const useGetDictionariesList = ({
  keyword = '',
  columnNameKeyword = '',
  config,
} = {}) => {
  const axios = useAxios();

  const queryKey = ['dictionariesList'];
  if (keyword.length > 0) {
    queryKey.push(keyword);
  }
  if (columnNameKeyword.length > 0) {
    queryKey.push(columnNameKeyword);
  }

  return useQuery({
    queryKey,
    queryFn: () => getDictionariesList(axios, { keyword, columnNameKeyword }),
    ...config,
  });
};
