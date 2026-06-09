import { Navigate, Outlet } from 'react-router-dom'
import { getCurrentUser } from '../api'

export default function PetavueGuard() {
  const currentUser = getCurrentUser()
  const isPetavueUser = (currentUser?.email || '').includes('@petavue.com')

  if (!isPetavueUser) {
    return <Navigate to="/dashboards" replace />
  }

  return <Outlet />
}
