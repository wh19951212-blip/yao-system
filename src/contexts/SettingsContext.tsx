import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { DEFAULT_APP_SETTINGS, type AppSettings } from '@/config/settingsDefaults'
import { fetchAppSettings, saveAppSettings } from '@/services/settings'
import { useAuth } from '@/contexts/AuthContext'

interface SettingsContextValue {
  settings: AppSettings
  loading: boolean
  saveSettings: (next: AppSettings) => Promise<void>
  refreshSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS)
  const [loading, setLoading] = useState(true)

  const refreshSettings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAppSettings()
      setSettings(data)
    } catch {
      setSettings(DEFAULT_APP_SETTINGS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) refreshSettings()
    else setLoading(false)
  }, [user, refreshSettings])

  const saveSettings = async (next: AppSettings) => {
    const saved = await saveAppSettings(next)
    setSettings(saved)
  }

  return (
    <SettingsContext.Provider
      value={{ settings, loading, saveSettings, refreshSettings }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
