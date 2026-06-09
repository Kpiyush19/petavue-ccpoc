import { useMutation } from '@tanstack/react-query';
import Axios from 'axios';
import { PETAVUE_API_URL } from '../../../config';

export const useClaudeLogin = () => {
  return useMutation({
    mutationFn: (payload) => Axios.post(`${PETAVUE_API_URL}/api/claude/mcp/oauth/login`, payload),
  });
};

export const useClaudeGoogleLogin = () => {
  return useMutation({
    mutationFn: (payload) => Axios.post(`${PETAVUE_API_URL}/api/claude/mcp/oauth/google-login`, payload),
  });
};
