/** 导航配置 — 4 个主入口 + 底部设置 */

export type NavIcon = 'Home' | 'Users' | 'Building' | 'Clipboard' | 'Settings'

export type NavItem = {
  path: string
  label: string
  icon: NavIcon
  emoji: string
  matchPaths: string[]
}

/** 主导航（仅 4 项） */
export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    path: '/dashboard',
    label: '工作台',
    icon: 'Home',
    emoji: '🏠',
    matchPaths: ['/dashboard', '/tasks'],
  },
  {
    path: '/clients',
    label: '客户',
    icon: 'Users',
    emoji: '👥',
    matchPaths: ['/clients', '/investors', '/buyers'],
  },
  {
    path: '/assets',
    label: '资产',
    icon: 'Building',
    emoji: '🏢',
    matchPaths: ['/assets', '/lands', '/properties', '/projects', '/hotels'],
  },
  {
    path: '/business',
    label: '业务',
    icon: 'Clipboard',
    emoji: '📋',
    matchPaths: ['/business', '/matching', '/contracts', '/channels'],
  },
]

/** 底部小入口 */
export const FOOTER_NAV_ITEM: NavItem = {
  path: '/settings',
  label: '设置',
  icon: 'Settings',
  emoji: '⚙️',
  matchPaths: ['/settings'],
}

export function isNavItemActive(pathname: string, item: { matchPaths: string[] }) {
  return item.matchPaths.some(
    (prefix) =>
      pathname === prefix ||
      (prefix !== '/dashboard' && pathname.startsWith(`${prefix}/`)),
  )
}

/** @deprecated 兼容旧引用 */
export const DAILY_NAV_ITEMS = MAIN_NAV_ITEMS
export const ASSET_NAV_ITEMS: NavItem[] = []
export const MORE_NAV_ITEMS: NavItem[] = []
export const SIDEBAR_NAV_ITEMS = MAIN_NAV_ITEMS
export const NAV_ITEMS = [...MAIN_NAV_ITEMS, FOOTER_NAV_ITEM]

export function isMoreModuleActive(_pathname: string) {
  return false
}

/** 设置页业务线偏好（不影响主导航） */
export type BusinessLine = 'development' | 'brokerage' | 'all'

export const BUSINESS_LINE_KEY = 'yao_business_line'

export const BUSINESS_LINE_OPTIONS = [
  { id: 'development' as const, label: '开发投资', description: '投资人 → 土地 → 开发项目' },
  { id: 'brokerage' as const, label: '中介销售', description: '渠道 → 物件 → 匹配 → 合同' },
  { id: 'all' as const, label: '两条线都做', description: '显示完整功能' },
] as const

export const DASHBOARD_BUSINESS_LINES = [
  { id: 'development' as const, label: '开发投资' },
  { id: 'brokerage' as const, label: '中介销售' },
] as const

export function getStoredBusinessLine(): BusinessLine | null {
  const raw = localStorage.getItem(BUSINESS_LINE_KEY)
  if (raw === 'development' || raw === 'brokerage' || raw === 'all') return raw
  return null
}

export function setStoredBusinessLine(line: BusinessLine) {
  localStorage.setItem(BUSINESS_LINE_KEY, line)
  window.dispatchEvent(new CustomEvent('yao-business-line-change', { detail: line }))
}
