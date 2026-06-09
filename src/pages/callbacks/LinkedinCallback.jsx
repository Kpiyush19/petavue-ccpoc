import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useLinkedinCallback } from './api';
import spinner from '../../common-components/assets/spinner.gif';

// Public, no-auth landing page LinkedIn redirects to after the user approves
// consent. By the time this renders, the code has been exchanged and the
// integration is fully connected server-side — so it's purely a confirmation
// screen. No "Configure" / "Later" actions (those live in the app); the user
// just closes the tab. Mirrors the Fivetran PostConnectScreen look (logo,
// popping status icon, rising text) for a consistent success signal.
export default function LinkedinCallback() {
  const location = useLocation();
  const linkedinCallback = useLinkedinCallback();
  const queryString = new URLSearchParams(location.search);
  const code = queryString.get('code');
  const state = queryString.get('state');
  // LinkedIn returns ?error=user_cancelled_login&error_description=... when the
  // user denies consent (no code/state). Treat anything without a code+state as
  // "not loading" up front so we never spin forever or setState synchronously.
  const error = queryString.get('error');
  const hasCode = Boolean(state && code && !error);
  const [isLoading, setIsLoading] = useState(hasCode);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error('LinkedIn connection was cancelled');
      return;
    }
    if (hasCode) {
      linkedinCallback.mutateAsync({ code, state }).then((response) => {
        if (response?.success === true) {
          toast.success('LinkedIn Connection Successful');
          setIsConnected(true);
        }
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }
  }, []);

  // Defer one tick so the entrance transition runs from the "from" state.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <img src={spinner} alt="Loading" className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div
      className={[
        'fixed inset-0 bg-white flex items-center justify-center px-4',
        'transition-opacity duration-300 ease-out',
        mounted ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      <style>{`
        @keyframes pv-pop {
          0%   { transform: scale(0.4); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pv-rise {
          0% { transform: translateY(12px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .pv-pop { animation: pv-pop 600ms cubic-bezier(.22,.61,.36,1) both; }
        .pv-rise-1 { animation: pv-rise 420ms ease-out 180ms both; }
        .pv-rise-2 { animation: pv-rise 420ms ease-out 320ms both; }
      `}</style>

      <div className="flex flex-col items-center text-center max-w-md w-full gap-6">
        <img src="/petavue-logo.svg" alt="Petavue" className="h-10 mb-2 pv-rise-1" />

        <div className="pv-pop">
          {isConnected ? (
            <CheckCircle size={56} weight="fill" color="var(--pv-success-text)" />
          ) : (
            <XCircle size={56} weight="fill" color="var(--pv-error-text, #b42318)" />
          )}
        </div>

        <div className="flex flex-col gap-2 pv-rise-2">
          <h1 className="text-xl font-medium text-[var(--pv-text-primary-text)]">
            {isConnected
              ? 'LinkedIn connected successfully'
              : 'LinkedIn connection unsuccessful'}
          </h1>
          <p className="text-sm text-[var(--pv-neutral-grey-500)]">
            {isConnected
              ? 'Your account is linked and ready. You can safely close this tab.'
              : 'Something went wrong while connecting. You can close this tab and try again.'}
          </p>
        </div>
      </div>
    </div>
  );
}
