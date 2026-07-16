import { Navigate, useLocation } from 'react-router-dom'

export function LegacyClientsRedirect() {
  const { search } = useLocation()
  return <Navigate to={`/clients${search}`} replace />
}
