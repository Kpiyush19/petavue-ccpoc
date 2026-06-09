import { useLocation } from 'react-router-dom';
import { useRef, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { useClaudeLogin, useClaudeGoogleLogin } from './api';

export default function ClaudeAuthPage() {
  const popupRef = useRef(null);
  const gloginsuccess = useRef(false);
  const location = useLocation();
  const queryString = new URLSearchParams(location.search);

  const [loggingIn, setLoggingIn] = useState('inactive');
  const [gLoggingIn, setGLoggingIn] = useState('inactive');
  const [postAuth, setPostAuth] = useState({ show: false, type: '', message: '' });

  const claudeAuth = useClaudeLogin();
  const claudeGoogleAuth = useClaudeGoogleLogin();

  const authRequest = {
    client_id: queryString.get('client_id'),
    redirect_uri: queryString.get('redirect_uri'),
    scope: queryString.get('scope'),
    code_challenge: queryString.get('code_challenge'),
    code_challenge_method: queryString.get('code_challenge_method'),
    resource: queryString.get('resource'),
    response_type: queryString.get('response_type'),
    state: queryString.get('state'),
  };

  const googLogin = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      gloginsuccess.current = true;
      if (credentialResponse?.access_token) {
        try {
          const res = await claudeGoogleAuth.mutateAsync({ access_token: credentialResponse.access_token, authRequest });
          const redirectUrl = res?.data?.redirectUrl;
          if (redirectUrl) {
            setPostAuth({ show: true, type: 'success', message: 'Authentication successful, redirecting' });
            setGLoggingIn('success');
            window.location.href = redirectUrl;
          } else {
            setPostAuth({ show: true, type: 'error', message: 'Redirect URL not available' });
            setGLoggingIn('inactive');
          }
        } catch (e) {
          setPostAuth({ show: true, type: 'error', message: e?.response?.data?.message || e?.message || 'Petavue google authentication failed' });
          setGLoggingIn('inactive');
        }
      } else {
        setPostAuth({ show: true, type: 'error', message: 'Something went wrong while logging in with Google' });
        setGLoggingIn('inactive');
      }
    },
    onError: () => {
      setPostAuth({ show: true, type: 'error', message: 'Something went wrong while logging in with Google' });
      setGLoggingIn('inactive');
    },
  });

  const handleGoogLogin = () => {
    const originalOpenFunc = window.open;
    window.open = (...args) => {
      const newPopupFunc = originalOpenFunc(...args);
      popupRef.current = newPopupFunc;
      return newPopupFunc;
    };
    googLogin();
    window.open = originalOpenFunc;

    const interval = setInterval(() => {
      if (popupRef.current?.closed) {
        clearInterval(interval);
        if (!gloginsuccess.current) {
          toast.error('Google authentication process interrupted, please try again');
          setGLoggingIn(false);
        }
        popupRef.current = null;
        gloginsuccess.current = false;
      }
    }, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      setLoggingIn('active');
      const res = await claudeAuth.mutateAsync({
        username: formData.get('email'),
        password: formData.get('password'),
        authRequest,
      });
      const redirectUrl = res?.data?.redirectUrl;
      if (redirectUrl) {
        setPostAuth({ show: true, type: 'success', message: 'Authentication successful, redirecting' });
        setLoggingIn('success');
        window.location.href = redirectUrl;
      } else {
        setPostAuth({ show: true, type: 'error', message: 'Redirect URL not available' });
        setLoggingIn('inactive');
      }
    } catch (e) {
      setPostAuth({ show: true, type: 'error', message: e?.response?.data?.message || e?.message || 'Petavue authentication failed' });
      setLoggingIn('inactive');
    }
  };

  const isDisabled = ['active', 'success'].includes(loggingIn) || ['active', 'success'].includes(gLoggingIn);

  return (
    <>
      <title>MCP Authentication</title>
      <div className="flex w-full h-screen justify-center items-center bg-gray-50">
        <div className="flex flex-col h-fit w-[448px] bg-white py-8 px-14 rounded-xl relative" style={{ boxShadow: 'rgba(105, 112, 149, 0.15) 0px 8px 24px 0px' }}>
          <div className="flex flex-col items-center">
            <img className="h-8 w-auto" src="/petavue-logo.svg" alt="petavue logo" style={{ transform: 'scale(1.5)' }} />
            <p className="mt-4 mb-4 leading-6 text-base text-gray-600">Authenticate with Petavue MCP</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex flex-col w-full gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Email</label>
                <input type="email" name="email" placeholder="email@company.com" className="rounded-xl border border-gray-300 px-3 py-2" disabled={isDisabled} required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Password</label>
                <input type="password" name="password" placeholder="••••••••••••••" className="rounded-xl border border-gray-300 px-3 py-2" disabled={isDisabled} required />
              </div>
              <div className="mt-2">
                <button type="submit" disabled={isDisabled} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  <span className="flex items-center justify-center gap-2 py-1">
                    {loggingIn === 'active' ? (
                      <><div className="animate-spin rounded-full border-2 border-blue-300 border-t-white w-4 h-4" /><span>Logging in</span></>
                    ) : loggingIn === 'success' ? 'Login Success' : 'Login'}
                  </span>
                </button>
              </div>
            </div>
          </form>

          <div className="flex flex-col items-center w-full">
            <span className="my-2">or</span>
            <button onClick={() => { setGLoggingIn('active'); handleGoogLogin(); }} disabled={isDisabled} className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              <span className="flex items-center justify-center gap-2 py-1">
                {gLoggingIn === 'active' ? (
                  <><div className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 w-4 h-4" /><span className="ml-2">Logging in</span></>
                ) : (
                  <><img src="/google-logo.png" alt="" width="20" className="ml-0.5" /><span className="ml-2">Continue with Google</span></>
                )}
              </span>
            </button>
          </div>

          {['success', 'error'].includes(postAuth.type) && (
            <div className="absolute w-full top-[96%] left-0 px-[56px] pb-[32px] bg-white rounded-b-xl mt-2" style={{ boxShadow: 'rgba(105, 112, 149, 0.15) 0px 16px 22px 0px' }}>
              <div className={`flex items-center justify-center text-center w-full rounded-lg p-2.5 ${postAuth.type === 'error' ? 'bg-red-50 border border-red-500 text-red-500' : 'bg-green-50 border border-green-500 text-green-500'}`}>
                <span className="w-fit text-xs">{postAuth.message}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
