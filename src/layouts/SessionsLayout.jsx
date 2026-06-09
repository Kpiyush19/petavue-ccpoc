import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { queryClient } from '../lib/queryClient'

export default function SessionsLayout() {
  useEffect(() => {
    return () => {
      const path = window.location.pathname
      const isStayingInSessions = path === '/sessions' || path.startsWith('/session/')
      if (!isStayingInSessions) {
        queryClient.removeQueries({ queryKey: ['sessions-list'] })
      }
    }
  }, [])

  return <Outlet />
}
