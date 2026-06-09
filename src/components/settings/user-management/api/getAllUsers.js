import { useQuery } from '@tanstack/react-query';
import axios from '../../../../lib/axios';

export const getAllUsers = (data) => {
  return axios.post(`/api/v1/tenant/users`, data);
};

export const useGetAllUsers = ({ data, config } = {}) => {
  return useQuery({
    queryKey: ['allUser', data],
    queryFn: () => getAllUsers(data),
    ...config,
  });
};
