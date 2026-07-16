import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { setGuestReadOnly } from '@/lib/writeGuard'
import {
  ensureUserProfile,
  type AppUser,
} from '@/services/users'

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: AppUser | null
  isAdmin: boolean
  isGuest: boolean
  canWrite: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInAsGuest: () => void
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const GUEST_STORAGE_KEY = 'yao_guest_session'

const guestProfile: AppUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'guest@yao.local',
  name: '访客',
  role: 'staff',
  created_at: new Date().toISOString(),
}

const guestUser = {
  id: guestProfile.id,
  email: guestProfile.email,
  app_metadata: {},
  user_metadata: { name: guestProfile.name },
  aud: 'authenticated',
  created_at: guestProfile.created_at,
} as User

const AuthContext = createContext<AuthContextValue | null>(null)

function activateGuestSession(setters: {
  setUser: (u: User) => void
  setProfile: (p: AppUser) => void
  setSession: (s: Session | null) => void
}) {
  sessionStorage.setItem(GUEST_STORAGE_KEY, '1')
  setGuestReadOnly(true)
  setters.setSession(null)
  setters.setUser(guestUser)
  setters.setProfile(guestProfile)
}

function clearGuestSession() {
  sessionStorage.removeItem(GUEST_STORAGE_KEY)
  setGuestReadOnly(false)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  const loadProfile = useCallback(async (authUser: User | null) => {
    if (!authUser?.email) {
      setProfile(null)
      return
    }
    try {
      const appUser = await ensureUserProfile(
        authUser.email,
        authUser.user_metadata?.name as string | undefined,
      )
      setProfile(appUser)
    } catch {
      setProfile(null)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    await loadProfile(user)
  }, [loadProfile, user])

  useEffect(() => {
    if (sessionStorage.getItem(GUEST_STORAGE_KEY) === '1') {
      setIsGuest(true)
      setGuestReadOnly(true)
      setUser(guestUser)
      setProfile(guestProfile)
      setLoading(false)
      return
    }

    setIsGuest(false)
    setGuestReadOnly(false)

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      loadProfile(session?.user ?? null).finally(() => setLoading(false))
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      loadProfile(session?.user ?? null).finally(() => setLoading(false))
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase()
    clearGuestSession()
    setIsGuest(false)

    let { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error?.message === 'Invalid login credentials') {
      const { error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      })
      if (
        signUpError &&
        !signUpError.message.toLowerCase().includes('already')
      ) {
        throw signUpError
      }
      const retry = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })
      error = retry.error
    }

    if (error) throw error
  }

  const signInAsGuest = () => {
    setIsGuest(true)
    activateGuestSession({ setUser, setProfile, setSession })
    setLoading(false)
  }

  const signOut = async () => {
    const wasGuest = sessionStorage.getItem(GUEST_STORAGE_KEY) === '1'
    clearGuestSession()
    setIsGuest(false)
    if (!wasGuest) {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    }
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  const isAdmin = !isGuest && profile?.role === 'admin'
  const canWrite = !isGuest && Boolean(user)

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isGuest,
        canWrite,
        loading,
        signIn,
        signInAsGuest,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
