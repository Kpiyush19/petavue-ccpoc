import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function GoogleAnalyticsCallback() {
  const location = useLocation();
  const [success, setSuccess] = useState(false);
  const queryString = new URLSearchParams(location.search);
  const connUId = queryString.get('uuid');
  const fivetranId = queryString.get('id');

  useEffect(() => {
    if (Boolean(connUId) && Boolean(fivetranId)) {
      setSuccess(true);
    }
  }, [connUId, fivetranId]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-4">
        <img src="/petavue-logo.svg" className="w-7 h-7" alt="Logo" />
        <p>{success ? 'Your Google Analytics 4 account has been successfully connected to Petavue.' : 'Connection unsuccessful'}</p>
      </div>
    </div>
  );
}
