import { useMutation } from '@tanstack/react-query';
import { useAxios } from '../context';

export const getDictionaryDetail = (axios, { id, keyword }) => {
  return axios.get(
    `/api/v1/integration/data-dictionaries/${id}?keyword=${keyword}`
  );
};

export const useGetDictionaryDetail = ({ config } = {}) => {
  const axios = useAxios();

  return useMutation({
    mutationFn: (params) => getDictionaryDetail(axios, params),
    ...config,
  });
};
