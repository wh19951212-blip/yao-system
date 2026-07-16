/** 主导航（侧边栏 6 项）+ 更多页模块 */

export type BusinessLine = 'development' | 'brokerage' | 'all'

export const BUSINESS_LINE_KEY = 'yao_business_line'

export const BUSINESS_LINE_OPTIONS = [
  {
    id: 'development' as const,
    label: '开发投资为主',
    description: '投资人 → 土地 → 建筑商 → 酒店运营',
  },
  {
    id: 'brokerage' as const,
    label: '中介销售为主',
    description: '渠道 → 物件 → 买家 → 佣金结算',
  },
  {
    id: 'all' as const,
    label: '两条线都做',
    description: '显示完整导航与概览',
  },
] as const

export type NavIcon =
  | 'LayoutDashboard'
  | 'Users'
  | 'Map'
  | 'Building2'
  | 'Handshake'
  | 'Sparkles'
  | 'MoreHorizontal'
  | 'HardHat'
  | 'Hotel'
  | 'FileText'
  | 'FolderOpen'
  | 'Settings'

export type NavItem = {
  path: string
  label: string
  icon: NavIcon
  matchPaths: string[]
}

/** 左侧功能栏（6 项） */
export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  {
    path: '/dashboard',
    label: '工作台',
    icon: 'LayoutDashboard',
    matchPaths: ['/dashboard'],
  },
  {
    path: '/investors',
    label: '投资人',
    icon: 'Users',
    matchPaths: ['/investors', '/buyers'],
  },
  {
    path: '/lands',
    label: '土地',
    icon: 'Map',
    matchPaths: ['/lands'],
  },
  {
    path: '/properties',
    label: '物件',
    icon: 'Building2',
    matchPaths: ['/properties'],
  },
  {
    path: '/channels',
    label: '渠道中介',
    icon: 'Handshake',
    matchPaths: ['/channels'],
  },
  {
    path: '/matching/demands',
    label: '智能匹配',
    icon: 'Sparkles',
    matchPaths: ['/matching'],
  },
]

/** 「更多功能」页入口（不在侧边栏单独列出） */
export const MORE_PAGE_PATH = '/more'

export const MORE_MODULE_ITEMS: NavItem[] = [
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
  {
    path: MORE_PAGE_PATH,
    label: '更多功能',
    icon: 'MoreHorizontal',
    matchPaths: [MORE_PAGE_PATH],
  },
]

/** 移动端等使用的完整列表 */
export const NAV_ITEMS: NavItem[] = [
  ...SIDEBAR_NAV_ITEMS,
  ...MORE_MODULE_ITEMS.filter((item) => item.path !== MORE_PAGE_PATH),
]

export function getStoredBusinessLine(): BusinessLine | null {
  const raw = localStorage.getItem(BUSINESS_LINE_KEY)
  if (raw === 'development' || raw === 'brokerage' || raw === 'all') return raw
  return null
}

export function setStoredBusinessLine(line: BusinessLine) {
  localStorage.setItem(BUSINESS_LINE_KEY, line)
}

export function isNavItemActive(pathname: string, item: NavItem) {
  return item.matchPaths.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function isMoreModuleActive(pathname: string) {
  return MORE_MODULE_ITEMS.some((item) => isNavItemActive(pathname, item))
}
