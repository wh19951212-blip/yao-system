import { useDataScope } from '@/hooks/useDataScope'

/** 员工只能访问自己负责的数据 */
export function canAccessOwnerRecord(
  recordOwner: string | null | undefined,
  ownerEmail: string | null,
  isAdmin: boolean,
) {
  if (isAdmin) return true
  if (!ownerEmail) return true
  if (!recordOwner) return true
  return recordOwner === ownerEmail
}

export function useOwnerAccess(recordOwner: string | null | undefined) {
  const { isAdmin, ownerEmail } = useDataScope()
  const allowed = canAccessOwnerRecord(recordOwner, ownerEmail, isAdmin)
  return { allowed, isAdmin, ownerEmail, denied: !allowed }
}
