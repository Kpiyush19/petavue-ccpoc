import axios from '../../../lib/axios';

export const accepttnc = async (data) => {
  return axios.post('/api/v1/self-serve/accept-term-and-condition', null, {
    headers: {
      Authorization: `Bearer ${data?.access_token}`,
    },
  });
};
