import { useQuery } from '@tanstack/react-query';
import { useAxios } from '../context';

export const getColumnSampleData = (axios, { tableId, columnName }) => {
  return axios.get(
    `/api/v1/integration/data-dictionaries/tables/${tableId}/columns/${columnName}/sample-values`
  );
};

export const useGetColumnSampleData = ({ tableId, columnName, config } = {}) => {
  const axios = useAxios();

  return useQuery({
    queryKey: ['columnSampleData', tableId, columnName],
    queryFn: () => getColumnSampleData(axios, { tableId, columnName }),
    ...config,
  });
};
