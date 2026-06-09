import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function GoogleAnalyticsRedirect() {
  const location = useLocation();
  const [valid, setValid] = useState('primed');
  const queryString = new URLSearchParams(location.search);
  const redirURI = queryString.get('redirect_uri');
  const auth = queryString.get('auth');

  useEffect(() => {
    if (Boolean(redirURI) && Boolean(auth)) {
      setValid('valid');
      window.location.replace(`https://fivetran.com/connect-card/setup?redirect_uri=${redirURI}&auth=${auth}`);
    } else {
      setValid('invalid');
    }
  }, [redirURI, auth]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-4">
        <img src="/petavue-logo.svg" className="w-7 h-7" alt="Logo" />
        <p>{valid === 'invalid' ? 'Wrong credentials. Please try again.' : 'Redirecting'}</p>
      </div>
    </div>
  );
}
