import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSlackCallback } from './api';
import spinner from '../../common-components/assets/spinner.gif';

export default function SlackCallback() {
  const navigate = useNavigate();
  const slackCallback = useSlackCallback();
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  const code = params.get('code');
  const state = params.get('state');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (code === null || state === null) {
      navigate('/');
      return;
    }
    slackCallback.mutateAsync({ code, state }).then((response) => {
      if (response?.success === true) {
        toast.success('Slack Connection Successful');
        setIsConnected(true);
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      {isLoading ? (
        <img src={spinner} alt="Loading" className="w-8 h-8" />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <img src="/petavue-logo.svg" className="w-6 h-7" alt="Logo" />
          <p>{isConnected ? 'Connected to Slack' : 'Connection unsuccessful'}</p>
        </div>
      )}
    </div>
  );
}
