import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import * as z from 'zod';
import { useRegister } from './api';
import { storage } from '../../components/google-auth';
import { logoutUser } from '../../components/google-auth';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  password: z.string().trim().min(8, 'Minimum 8 characters required')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[#$%[\]()*&@!~]).*$/, 'Password must contain at least one uppercase letter, one lowercase letter, and one special character from #$%[]()*&@!~'),
  confirmpassword: z.string().trim().min(8, 'Minimum 8 characters required')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[#$%[\]()*&@!~]).*$/, 'Password must contain at least one uppercase letter, one lowercase letter, and one special character from #$%[]()*&@!~'),
});

const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-8,56a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm8,104a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M13.5672 7.68281C13.6253 7.74086 13.6714 7.80979 13.7029 7.88566C13.7343 7.96154 13.7505 8.04287 13.7505 8.125C13.7505 8.20713 13.7343 8.28846 13.7029 8.36434C13.6714 8.44021 13.6253 8.50914 13.5672 8.56719L9.19219 12.9422C9.13415 13.0003 9.06522 13.0464 8.98934 13.0779C8.91347 13.1093 8.83214 13.1255 8.75 13.1255C8.66787 13.1255 8.58654 13.1093 8.51067 13.0779C8.43479 13.0464 8.36586 13.0003 8.30782 12.9422L6.43282 11.0672C6.31554 10.9499 6.24966 10.7909 6.24966 10.625C6.24966 10.4591 6.31554 10.3001 6.43282 10.1828C6.55009 10.0655 6.70915 9.99965 6.875 9.99965C7.04086 9.99965 7.19992 10.0655 7.31719 10.1828L8.75 11.6164L12.6828 7.68281C12.7409 7.6247 12.8098 7.5786 12.8857 7.54715C12.9615 7.5157 13.0429 7.49951 13.125 7.49951C13.2071 7.49951 13.2885 7.5157 13.3643 7.54715C13.4402 7.5786 13.5091 7.6247 13.5672 7.68281ZM18.125 10C18.125 11.607 17.6485 13.1779 16.7557 14.514C15.8629 15.8502 14.594 16.8916 13.1093 17.5065C11.6247 18.1215 9.99099 18.2824 8.4149 17.9689C6.8388 17.6554 5.39106 16.8815 4.25476 15.7452C3.11846 14.6089 2.34463 13.1612 2.03112 11.5851C1.71762 10.009 1.87852 8.37535 2.49348 6.8907C3.10844 5.40605 4.14985 4.1371 5.486 3.24431C6.82214 2.35152 8.39303 1.875 10 1.875C12.1542 1.87727 14.2195 2.73403 15.7427 4.25727C17.266 5.78051 18.1227 7.84581 18.125 10ZM16.875 10C16.875 8.64025 16.4718 7.31104 15.7164 6.18045C14.9609 5.04987 13.8872 4.16868 12.631 3.64833C11.3747 3.12798 9.99238 2.99183 8.65876 3.2571C7.32514 3.52237 6.10013 4.17716 5.13864 5.13864C4.17716 6.10013 3.52238 7.32513 3.2571 8.65875C2.99183 9.99237 3.12798 11.3747 3.64833 12.6309C4.16868 13.8872 5.04987 14.9609 6.18046 15.7164C7.31105 16.4718 8.64026 16.875 10 16.875C11.8227 16.8729 13.5702 16.1479 14.8591 14.8591C16.1479 13.5702 16.8729 11.8227 16.875 10Z" fill="#08BD50" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M12.9422 7.94219L10.8836 10L12.9422 12.0578C13.0003 12.1159 13.0463 12.1848 13.0777 12.2607C13.1092 12.3366 13.1254 12.4179 13.1254 12.5C13.1254 12.5821 13.1092 12.6634 13.0777 12.7393C13.0463 12.8152 13.0003 12.8841 12.9422 12.9422C12.8841 13.0003 12.8152 13.0463 12.7393 13.0777C12.6634 13.1092 12.5821 13.1253 12.5 13.1253C12.4179 13.1253 12.3366 13.1092 12.2607 13.0777C12.1848 13.0463 12.1159 13.0003 12.0578 12.9422L10 10.8836L7.94219 12.9422C7.88412 13.0003 7.81518 13.0463 7.73931 13.0777C7.66344 13.1092 7.58213 13.1253 7.5 13.1253C7.41788 13.1253 7.33656 13.1092 7.26069 13.0777C7.18482 13.0463 7.11588 13.0003 7.05782 12.9422C6.99975 12.8841 6.95368 12.8152 6.92226 12.7393C6.89083 12.6634 6.87466 12.5821 6.87466 12.5C6.87466 12.4179 6.89083 12.3366 6.92226 12.2607C6.95368 12.1848 6.99975 12.1159 7.05782 12.0578L9.11641 10L7.05782 7.94219C6.94054 7.82491 6.87466 7.66585 6.87466 7.5C6.87466 7.33415 6.94054 7.17509 7.05782 7.05781C7.17509 6.94054 7.33415 6.87465 7.5 6.87465C7.66586 6.87465 7.82492 6.94054 7.94219 7.05781L10 9.11641L12.0578 7.05781C12.1159 6.99974 12.1848 6.95368 12.2607 6.92225C12.3366 6.89083 12.4179 6.87465 12.5 6.87465C12.5821 6.87465 12.6634 6.89083 12.7393 6.92225C12.8152 6.95368 12.8841 6.99974 12.9422 7.05781C13.0003 7.11588 13.0463 7.18482 13.0777 7.26069C13.1092 7.33656 13.1254 7.41788 13.1254 7.5C13.1254 7.58212 13.1092 7.66344 13.0777 7.73931C13.0463 7.81518 13.0003 7.88412 12.9422 7.94219ZM18.125 10C18.125 11.607 17.6485 13.1779 16.7557 14.514C15.8629 15.8502 14.594 16.8916 13.1093 17.5065C11.6247 18.1215 9.99099 18.2824 8.4149 17.9689C6.8388 17.6554 5.39106 16.8815 4.25476 15.7452C3.11846 14.6089 2.34463 13.1612 2.03112 11.5851C1.71762 10.009 1.87852 8.37535 2.49348 6.8907C3.10844 5.40605 4.14985 4.1371 5.486 3.24431C6.82214 2.35152 8.39303 1.875 10 1.875C12.1542 1.87727 14.2195 2.73403 15.7427 4.25727C17.266 5.78051 18.1227 7.84581 18.125 10ZM16.875 10C16.875 8.64025 16.4718 7.31104 15.7164 6.18045C14.9609 5.04987 13.8872 4.16868 12.631 3.64833C11.3747 3.12798 9.99238 2.99183 8.65876 3.2571C7.32514 3.52237 6.10013 4.17716 5.13864 5.13864C4.17716 6.10013 3.52238 7.32513 3.2571 8.65875C2.99183 9.99237 3.12798 11.3747 3.64833 12.6309C4.16868 13.8872 5.04987 14.9609 6.18046 15.7164C7.31105 16.4718 8.64026 16.875 10 16.875C11.8227 16.8729 13.5702 16.1479 14.8591 14.8591C16.1479 13.5702 16.8729 11.8227 16.875 10Z" fill="#F93D3D" />
  </svg>
);

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useRegister();
  const [searchParams] = useSearchParams();
  const [registering, setRegistering] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [formData, setFormData] = useState({ name: '', password: '', confirmpassword: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const token = storage.getToken();
    if (token) {
      logoutUser().catch(() => {});
      localStorage.clear();
    }
  }, []);

  useEffect(() => {
    if (tokenInvalid) {
      toast.error('Register token not valid');
      navigate('/login');
    }
  }, [tokenInvalid]);

  const token = searchParams.get('token');
  let linkExpired = false;
  if (token && typeof token === 'string') {
    linkExpired = Date.now() >= new Date(jwtDecode(token).exp * 1000);
  } else if (!tokenInvalid) {
    setTokenInvalid(true);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => { fieldErrors[err.path[0]] = err.message; });
      setErrors(fieldErrors);
      return;
    }
    setRegistering(true);
    try {
      await register.mutateAsync({ inviteToken: token, name: formData.name, password: formData.password, confirmPassword: formData.confirmpassword });
      toast.success('Invitation accepted successfully');
      navigate('/login');
    } catch (error) {
      toast.error(error?.response?.data?.error?.message || 'Something went wrong');
      if (error?.response?.data?.error?.type === 'already-used-invitation-link') navigate('/login');
    } finally {
      setRegistering(false);
    }
  };

  const passwordsMatch = formData.password && formData.confirmpassword && formData.password === formData.confirmpassword;
  const passwordsMismatch = formData.password && formData.confirmpassword && formData.password !== formData.confirmpassword;

  return (
    <>
      <title>Welcome</title>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div style={{ boxShadow: '0px 8px 24px 0px rgba(105, 112, 149, 0.15)' }} className="mt-8 bg-white py-8 px-4 sm:rounded-xl sm:mx-auto sm:w-full sm:max-w-md">
          <div className="sm:mx-auto mb-4 sm:w-full sm:max-w-md">
            <div className="flex justify-center">
              <Link className="flex items-center text-white" to="/"><img className="h-8 w-auto" src="/petavue-logo.svg" alt="petavue logo" style={{ transform: 'scale(1.5)' }} /></Link>
            </div>
            <h2 style={{ lineHeight: '29px' }} className="mt-6 text-center text-lg font-medium text-gray-800 leading-8">Welcome</h2>
            <p className="mt-2 text-center leading-6 text-base text-gray-600">Sign up to your account</p>
          </div>
          <div className="px-4 sm:px-10 mt-6">
            {linkExpired && (
              <div className="mb-4 -mt-2 text-xs bg-red-50 text-red-500 px-3 py-2 rounded-lg border border-red-500">
                <div className="flex items-start gap-2"><WarningIcon /><p>Your invitation link has expired. Please ask your admin to resend the invite.</p></div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Name</label>
                <input type="text" placeholder="Full Name" className={`rounded-xl border border-gray-300 px-3 py-2 ${linkExpired ? 'bg-gray-100 border-none' : ''}`} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} disabled={linkExpired} />
                {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Password</label>
                <input type="password" placeholder="••••••••••••••" className={`rounded-xl border border-gray-300 px-3 py-2 ${linkExpired ? 'bg-gray-100 border-none' : ''}`} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} disabled={linkExpired} />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Re-enter Password</label>
                  <input type="password" placeholder="••••••••••••••" className={`rounded-xl border border-gray-300 px-3 py-2 ${linkExpired ? 'bg-gray-100 border-none' : ''}`} value={formData.confirmpassword} onChange={(e) => setFormData({ ...formData, confirmpassword: e.target.value })} disabled={linkExpired} />
                  {errors.confirmpassword && <span className="text-xs text-red-500">{errors.confirmpassword}</span>}
                </div>
                {passwordsMatch && <div className="flex items-center gap-1.5"><CheckIcon /><span className="text-xs font-normal text-green-500">Passwords match</span></div>}
                {passwordsMismatch && <div className="flex items-center gap-1.5"><XIcon /><span className="text-xs font-normal text-red-500">Passwords do not match</span></div>}
              </div>
              <div className="mt-8">
                <button type="submit" disabled={linkExpired || registering || !formData.password || !formData.confirmpassword || passwordsMismatch} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {registering ? <span className="flex items-center justify-center gap-2 py-1"><div className="animate-spin rounded-full border-2 border-blue-300 border-t-white w-5 h-5" /><span className="ml-2">Signing Up</span></span> : <span className="flex items-center justify-center gap-2 py-1"><span className="ml-2">Sign Up</span></span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
