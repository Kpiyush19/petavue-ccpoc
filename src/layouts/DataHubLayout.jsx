import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { queryClient } from '../lib/queryClient'

const DATA_HUB_QUERY_KEYS = [
  'sync_summary',
  'sync_sessions',
  'source_integrations',
  'dictionariesList',
  'tableColumns',
  'dictionaryTableTags'
]

export default function DataHubLayout() {
  useEffect(() => {
    return () => {
      const isStayingInDataHub = window.location.pathname.startsWith('/data-hub')
      if (!isStayingInDataHub) {
        DATA_HUB_QUERY_KEYS.forEach((key) => {
          queryClient.removeQueries({ queryKey: [key] })
        })
      }
    }
  }, [])

  return <Outlet />
}
