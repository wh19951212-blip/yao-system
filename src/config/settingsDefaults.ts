export interface AppSettings {
  companyName: string
  contactName: string
  contactInfo: string
  followUpReminderDays: number
  deadlineReminderDays: number
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  companyName: '',
  contactName: 'YAO',
  contactInfo: '',
  followUpReminderDays: 7,
  deadlineReminderDays: 3,
}

export const SETTINGS_STORAGE_KEY = 'yao_app_settings_v1'
