import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const ROUTE_TITLES = {
  '/': 'Explore',
  '/home': 'Home',
  '/sessions': 'Sessions',
  '/dashboards': 'Dashboards',
  '/workflows': 'Workflows',
  '/skills': 'Skills',
  '/data-hub': 'Data Hub',
  '/data-hub/dictionary': 'Data Dictionary',
  '/data-hub/sync-activity': 'Sync Activity',
  '/settings': 'Settings',
  '/settings/integrations': 'Integrations',
  '/settings/users': 'User Management',
  '/my-profile': 'My Profile',
  '/schedules': 'Schedules',
}

function getTitleFromPath(pathname) {
  if (ROUTE_TITLES[pathname]) {
    return ROUTE_TITLES[pathname]
  }

  if (pathname.startsWith('/session/')) {
    return 'Session'
  }
  if (pathname.startsWith('/dashboards/')) {
    return 'Dashboard'
  }
  if (pathname.startsWith('/workflows/')) {
    return 'Workflow'
  }
  if (pathname.startsWith('/home/skill/')) {
    return 'Skill'
  }
  if (pathname.startsWith('/data-hub/dictionary/')) {
    return 'Data Source'
  }
  if (pathname.startsWith('/settings/integrations/')) {
    return 'Integration'
  }

  return null
}

export function useDocumentTitle(customTitle) {
  const location = useLocation()

  useEffect(() => {
    const pageTitle = customTitle || getTitleFromPath(location.pathname)
    document.title = pageTitle ? `${pageTitle} | Petavue` : 'Petavue'
  }, [location.pathname, customTitle])
}

export default useDocumentTitle
