import { useQuery } from '@tanstack/react-query';
import axios from '../../../lib/axios';

export const getUserDetails = async () => {
  const res = await axios.get('/api/v1/tenant/users/me');
  return res;
};

export const useGetUserDetails = ({ config = {} } = {}) => {
  return useQuery({
    queryKey: ['userDetails'],
    queryFn: () => getUserDetails(),
    ...config,
  });
};
