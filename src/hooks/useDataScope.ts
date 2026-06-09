import { useAuth } from '@/contexts/AuthContext'

export function useDataScope() {
  const { user, isAdmin } = useAuth()
  const ownerEmail = isAdmin ? null : (user?.email ?? null)

  return {
    isAdmin,
    ownerEmail,
  }
}
