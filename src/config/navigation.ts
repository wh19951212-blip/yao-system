/** 导航配置 — 日常工作 / 资产管理 / 更多 */

export type BusinessLine = 'development' | 'brokerage' | 'all'

export const BUSINESS_LINE_KEY = 'yao_business_line'

export const BUSINESS_LINE_OPTIONS = [
  {
    id: 'development' as const,
    label: '开发投资',
    description: '投资人 → 土地 → 开发项目 → 酒店',
  },
  {
    id: 'brokerage' as const,
    label: '中介销售',
    description: '渠道 → 物件 → 需求匹配 → 合同',
  },
  {
    id: 'all' as const,
    label: '两条线都做',
    description: '显示完整导航',
  },
] as const

/** 工作台顶栏快速切换（仅两项） */
export const DASHBOARD_BUSINESS_LINES = [
  { id: 'development' as const, label: '开发投资' },
  { id: 'brokerage' as const, label: '中介销售' },
] as const

export type NavIcon =
  | 'LayoutDashboard'
  | 'Users'
  | 'Map'
  | 'Building2'
  | 'Handshake'
  | 'Sparkles'
  | 'ListTodo'
  | 'Hammer'
  | 'MoreHorizontal'
  | 'HardHat'
  | 'Hotel'
  | 'FileText'
  | 'FolderOpen'
  | 'Settings'

export type NavChild = {
  path: string
  label: string
  matchPaths: string[]
}

export type SidebarNavItem = {
  path: string
  label: string
  icon: NavIcon
  matchPaths: string[]
  children?: NavChild[]
  /** 该业务线下侧栏项显示强调样式 */
  emphasizeFor?: BusinessLine[]
}

export type NavItem = {
  path: string
  label: string
  icon: NavIcon
  matchPaths: string[]
}

export const NAV_SECTION_DAILY = '日常工作'
export const NAV_SECTION_ASSETS = '资产管理'

/** 【日常工作】 */
export const DAILY_NAV_ITEMS: SidebarNavItem[] = [
  {
    path: '/dashboard',
    label: '工作台',
    icon: 'LayoutDashboard',
    matchPaths: ['/dashboard'],
    children: [
      { path: '/dashboard', label: '概览', matchPaths: ['/dashboard'] },
      { path: '/tasks', label: '我的任务', matchPaths: ['/tasks'] },
    ],
  },
  {
    path: '/investors',
    label: '投资人',
    icon: 'Users',
    matchPaths: ['/investors', '/buyers'],
    emphasizeFor: ['development', 'brokerage'],
  },
  {
    path: '/matching/demands',
    label: '需求与匹配',
    icon: 'Sparkles',
    matchPaths: ['/matching'],
    emphasizeFor: ['brokerage', 'development'],
  },
]

/** 【资产管理】 */
export const ASSET_NAV_ITEMS: SidebarNavItem[] = [
  {
    path: '/lands',
    label: '土地',
    icon: 'Map',
    matchPaths: ['/lands'],
    emphasizeFor: ['development'],
    children: [
      { path: '/lands', label: '土地列表', matchPaths: ['/lands'] },
      { path: '/projects', label: '开发项目', matchPaths: ['/projects'] },
    ],
  },
  {
    path: '/properties',
    label: '物件',
    icon: 'Building2',
    matchPaths: ['/properties'],
    emphasizeFor: ['brokerage'],
  },
  {
    path: '/channels',
    label: '渠道',
    icon: 'Handshake',
    matchPaths: ['/channels'],
    emphasizeFor: ['brokerage'],
  },
]

/** 底部「更多」折叠项 */
export const MORE_NAV_ITEMS: NavItem[] = [
  {
    path: '/builders',
    label: '建筑商',
    icon: 'HardHat',
    matchPaths: ['/builders'],
  },
  {
    path: '/hotels',
    label: '酒店',
    icon: 'Hotel',
    matchPaths: ['/hotels'],
  },
  {
    path: '/contracts',
    label: '合同',
    icon: 'FileText',
    matchPaths: ['/contracts'],
  },
  {
    path: '/media',
    label: '素材库',
    icon: 'FolderOpen',
    matchPaths: ['/media'],
  },
  {
    path: '/settings',
    label: '设置',
    icon: 'Settings',
    matchPaths: ['/settings'],
  },
]

/** 更多区在业务线下的强调项 */
export const MORE_EMPHASIZE_FOR: Partial<Record<string, BusinessLine[]>> = {
  '/builders': ['development'],
  '/hotels': ['development'],
  '/contracts': ['brokerage'],
}

export const MORE_PAGE_PATH = '/more'

/** @deprecated 兼容旧引用 */
export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  ...DAILY_NAV_ITEMS.map(({ children: _c, emphasizeFor: _e, ...item }) => item),
  ...ASSET_NAV_ITEMS.map(({ children: _c, emphasizeFor: _e, ...item }) => item),
]

export const MORE_MODULE_ITEMS: NavItem[] = [
  ...MORE_NAV_ITEMS,
  {
    path: MORE_PAGE_PATH,
    label: '更多功能',
    icon: 'MoreHorizontal',
    matchPaths: [MORE_PAGE_PATH],
  },
]

export const NAV_ITEMS: NavItem[] = [
  ...SIDEBAR_NAV_ITEMS,
  ...MORE_NAV_ITEMS,
]

export function getStoredBusinessLine(): BusinessLine | null {
  const raw = localStorage.getItem(BUSINESS_LINE_KEY)
  if (raw === 'development' || raw === 'brokerage' || raw === 'all') return raw
  return null
}

export function setStoredBusinessLine(line: BusinessLine) {
  localStorage.setItem(BUSINESS_LINE_KEY, line)
  window.dispatchEvent(new CustomEvent('yao-business-line-change', { detail: line }))
}

export function isNavItemActive(pathname: string, item: { matchPaths: string[] }) {
  return item.matchPaths.some(
    (prefix) =>
      pathname === prefix ||
      (prefix !== '/dashboard' &&
        prefix !== '/lands' &&
        pathname.startsWith(`${prefix}/`)),
  )
}

/** 土地列表 /projects 等同前缀时避免 /lands 误高亮 */
export function isChildNavActive(pathname: string, child: NavChild): boolean {
  if (child.path === '/lands') {
    return (
      pathname === '/lands' ||
      pathname === '/lands/calculator' ||
      (pathname.startsWith('/lands/') &&
        !pathname.startsWith('/projects'))
    )
  }
  if (child.path === '/dashboard') {
    return pathname === '/dashboard'
  }
  return isNavItemActive(pathname, child)
}

export function isParentNavActive(pathname: string, item: SidebarNavItem): boolean {
  if (item.children?.length) {
    return item.children.some((c) => isChildNavActive(pathname, c))
  }
  return isNavItemActive(pathname, item)
}

export function isNavEmphasized(
  _path: string,
  line: BusinessLine | null,
  extra?: BusinessLine[],
): boolean {
  if (!line || line === 'all') return false
  const targets = extra ?? []
  return targets.includes(line)
}

export function isMoreModuleActive(pathname: string) {
  return MORE_NAV_ITEMS.some((item) => isNavItemActive(pathname, item))
}
