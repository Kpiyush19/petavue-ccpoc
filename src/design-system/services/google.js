/**
 * Google OAuth configuration.
 *
 * Set VITE_GOOGLE_CLIENT_ID in your .env file to enable Google sign-in.
 * Example: VITE_GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
 *
 * When not set, the Google button is hidden and only email/password auth is shown.
 */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let scriptLoaded = false;
let scriptLoading = false;
const callbacks = [];

export function loadGoogleScript(onReady) {
  if (scriptLoaded) {
    onReady();
    return;
  }

  callbacks.push(onReady);

  if (scriptLoading) return;
  scriptLoading = true;

  const script = document.createElement('script');
  script.src = SCRIPT_SRC;
  script.async = true;
  script.defer = true;
  script.onload = () => {
    scriptLoaded = true;
    callbacks.forEach((cb) => cb());
    callbacks.length = 0;
  };
  document.head.appendChild(script);
}
