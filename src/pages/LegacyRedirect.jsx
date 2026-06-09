import { Navigate, useSearchParams } from 'react-router-dom'

export default function LegacyRedirect() {
  const [params] = useSearchParams()
  const sessionId = params.get('session')

  if (sessionId) {
    return <Navigate to={`/session/${sessionId}`} replace />
  }

  return <Navigate to="/" replace />
}
