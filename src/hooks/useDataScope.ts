import { useAuth } from '@/contexts/AuthContext'

export function useDataScope() {
  const { user, profile, isAdmin, isGuest } = useAuth()
  const ownerEmail = isAdmin || isGuest ? null : (user?.email ?? null)
  const ownerId = isAdmin || isGuest ? null : (profile?.id ?? null)

  return {
    isAdmin,
    isGuest,
    ownerEmail,
    ownerId,
    userId: profile?.id ?? null,
  }
}
