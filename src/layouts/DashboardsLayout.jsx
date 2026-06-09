import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { queryClient } from '../lib/queryClient'

const DASHBOARDS_QUERY_KEYS = [
  'cc-published-dashboards',
  'cc-dashboard-explanation',
  'dashboards',
  'dashboard'
]

export default function DashboardsLayout() {
  useEffect(() => {
    return () => {
      const isStayingInDashboards = window.location.pathname.startsWith('/dashboards')
      if (!isStayingInDashboards) {
        DASHBOARDS_QUERY_KEYS.forEach((key) => {
          queryClient.removeQueries({ queryKey: [key] })
        })
      }
    }
  }, [])

  return <Outlet />
}
