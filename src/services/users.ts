import { supabase } from '@/lib/supabase'

export type UserRole = 'admin' | 'staff'

export interface AppUser {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
}

function mapUser(row: Record<string, unknown>): AppUser {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    role: (row.role as UserRole) ?? 'staff',
    created_at: row.created_at as string,
  }
}

export async function fetchUserByEmail(email: string): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    if (error.code === 'PGRST116' || error.code === '42P01') return null
    throw error
  }
  return data ? mapUser(data as Record<string, unknown>) : null
}

export async function fetchAllUsers(): Promise<AppUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) => mapUser(row as Record<string, unknown>))
}

export async function ensureUserProfile(
  email: string,
  fallbackName?: string,
): Promise<AppUser> {
  const existing = await fetchUserByEmail(email)
  if (existing) return existing

  const allUsers = await fetchAllUsers().catch(() => [])
  const role: UserRole = allUsers.length === 0 ? 'admin' : 'staff'
  const name = fallbackName || email.split('@')[0]

  const { data, error } = await supabase
    .from('users')
    .insert({ email, name, role })
    .select()
    .single()

  if (error) throw error
  return mapUser(data as Record<string, unknown>)
}

export async function updateUserRole(userId: string, role: UserRole) {
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return mapUser(data as Record<string, unknown>)
}

export async function updateUserName(userId: string, name: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ name: name.trim() })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return mapUser(data as Record<string, unknown>)
}

export async function inviteUser(payload: {
  email: string
  name: string
  role: UserRole
  password: string
}) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: payload.email.trim(),
    password: payload.password,
  })

  if (authError) throw authError

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        email: payload.email.trim(),
        name: payload.name.trim(),
        role: payload.role,
      },
      { onConflict: 'email' },
    )
    .select()
    .single()

  if (error) throw error

  return {
    user: mapUser(data as Record<string, unknown>),
    authUser: authData.user,
  }
}
