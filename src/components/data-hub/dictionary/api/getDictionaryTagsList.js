import { useQuery } from '@tanstack/react-query';
import { useAxios } from '../context';

export const getTagsList = (axios, { keyword = '' }) => {
  return axios.get(
    `/api/v1/integration/data-dictionaries/columns/tags?pageSize=100&pageNumber=1&keyword=${keyword}`
  );
};

export const useGetTagsList = ({ payload = {}, config } = {}) => {
  const axios = useAxios();

  const keyword = payload.keyword || '';

  return useQuery({
    queryKey: ['dictionaryTableTags', keyword],
    queryFn: () => getTagsList(axios, { keyword }),
    ...config,
  });
};
