import { useAuth } from '@/contexts/AuthContext'

export function useCanWrite() {
  const { canWrite, isGuest } = useAuth()
  return { canWrite, isGuest }
}
