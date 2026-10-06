import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { queryClient } from '../lib/queryClient'

const WORKFLOWS_QUERY_KEYS = ['workflows', 'workflow', 'workflow-runs']

export default function WorkflowsLayout() {
  useEffect(() => {
    return () => {
      const isStayingInWorkflows = window.location.pathname.startsWith('/workflows')
      if (!isStayingInWorkflows) {
        WORKFLOWS_QUERY_KEYS.forEach((key) => {
          queryClient.removeQueries({ queryKey: [key] })
        })
      }
    }
  }, [])

  return <Outlet />
}
