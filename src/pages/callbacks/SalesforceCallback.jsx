import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useSalesforceCallback } from './api';
import spinner from '../../common-components/assets/spinner.gif';

export default function SalesforceCallback() {
  const location = useLocation();
  const salesforceCallback = useSalesforceCallback();
  const queryString = new URLSearchParams(location.search);
  const code = queryString.get('code');
  const state = queryString.get('state');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (state && code) {
      salesforceCallback.mutateAsync({ code, state }).then((response) => {
        if (response?.success === true) {
          toast.success('Salesforce Connection Successful');
          setIsConnected(true);
        }
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      {isLoading ? (
        <img src={spinner} alt="Loading" className="w-8 h-8" />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <img src="/petavue-logo.svg" className="w-6 h-7" alt="Logo" />
          <p>{isConnected ? 'Connected to Salesforce' : 'Connection unsuccessful'}</p>
        </div>
      )}
    </div>
  );
}
