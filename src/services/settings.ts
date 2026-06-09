import { supabase } from '@/lib/supabase'
import {
  DEFAULT_APP_SETTINGS,
  SETTINGS_STORAGE_KEY,
  type AppSettings,
} from '@/config/settingsDefaults'

let cachedSettings: AppSettings = { ...DEFAULT_APP_SETTINGS }

export function getAppSettings(): AppSettings {
  return cachedSettings
}

function loadFromStorage(): AppSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return null
    return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return null
  }
}

function saveToStorage(settings: AppSettings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

function normalizeRow(row: Record<string, unknown>): AppSettings {
  return {
    companyName: (row.company_name as string) ?? '',
    contactName: (row.contact_name as string) ?? DEFAULT_APP_SETTINGS.contactName,
    contactInfo: (row.contact_info as string) ?? '',
    followUpReminderDays:
      Number(row.follow_up_reminder_days) ||
      DEFAULT_APP_SETTINGS.followUpReminderDays,
    deadlineReminderDays:
      Number(row.deadline_reminder_days) ||
      DEFAULT_APP_SETTINGS.deadlineReminderDays,
  }
}

export async function fetchAppSettings(): Promise<AppSettings> {
  const stored = loadFromStorage()
  if (stored) cachedSettings = stored

  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  if (!error && data) {
    cachedSettings = normalizeRow(data as Record<string, unknown>)
    saveToStorage(cachedSettings)
    return cachedSettings
  }

  if (stored) return stored
  cachedSettings = { ...DEFAULT_APP_SETTINGS }
  return cachedSettings
}

export async function saveAppSettings(
  settings: AppSettings,
): Promise<AppSettings> {
  const payload = {
    id: 1,
    company_name: settings.companyName.trim(),
    contact_name: settings.contactName.trim() || DEFAULT_APP_SETTINGS.contactName,
    contact_info: settings.contactInfo.trim(),
    follow_up_reminder_days: settings.followUpReminderDays,
    deadline_reminder_days: settings.deadlineReminderDays,
    updated_at: new Date().toISOString(),
  }

  cachedSettings = settings
  saveToStorage(settings)

  const { data, error } = await supabase
    .from('app_settings')
    .upsert(payload)
    .select()
    .single()

  if (error) {
    if (error.code === '42P01') return settings
    throw error
  }

  cachedSettings = normalizeRow(data as Record<string, unknown>)
  saveToStorage(cachedSettings)
  return cachedSettings
}

export function getContactLine(prefix = '📞联系：') {
  const { contactName, contactInfo } = getAppSettings()
  const name = contactName || DEFAULT_APP_SETTINGS.contactName
  if (contactInfo) return `${prefix}${name} · ${contactInfo}`
  return `${prefix}${name}`
}
