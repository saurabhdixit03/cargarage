import { Navigate, Outlet, useLocation } from 'react-router'
import type { Role } from '../api/types'
import { useSession } from './session'

// Guards the pages inside it.
// Not logged in: go to the login page, remembering this page to come back to.
// Logged in with another role (e.g. staff on a customer page): go home.
export function RequireRole({ role }: { role: Role }) {
  const session = useSession()
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (session.role !== role) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}