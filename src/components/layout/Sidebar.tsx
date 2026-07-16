import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Handshake,
  LayoutDashboard,
  LogOut,
  Map,
  Sparkles,
  Users,
} from 'lucide-react'
import { appConfig } from '@/config/app'
import {
  ASSET_NAV_ITEMS,
  DAILY_NAV_ITEMS,
  isChildNavActive,
  isMoreModuleActive,
  isNavEmphasized,
  isNavItemActive,
  isParentNavActive,
  MORE_EMPHASIZE_FOR,
  MORE_NAV_ITEMS,
  NAV_SECTION_ASSETS,
  NAV_SECTION_DAILY,
  type NavIcon,
  type SidebarNavItem,
} from '@/config/navigation'
import { useBusinessLine } from '@/hooks/useBusinessLine'
import { useAuth } from '@/contexts/AuthContext'

const iconMap: Record<NavIcon, typeof LayoutDashboard> = {
  LayoutDashboard,
  Users,
  Map,
  Building2,
  Handshake,
  Sparkles,
  ListTodo: LayoutDashboard,
  Hammer: Map,
  MoreHorizontal: LayoutDashboard,
  HardHat: LayoutDashboard,
  Hotel: LayoutDashboard,
  FileText: LayoutDashboard,
  FolderOpen: LayoutDashboard,
  Settings: LayoutDashboard,
}

function NavSectionLabel({ children }: { children: string }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">
      {children}
    </p>
  )
}

function SidebarItem({
  item,
  pathname,
  businessLine,
  expanded,
  onToggle,
}: {
  item: SidebarNavItem
  pathname: string
  businessLine: ReturnType<typeof useBusinessLine>['businessLine']
  expanded: boolean
  onToggle: () => void
}) {
  const Icon = iconMap[item.icon]
  const active = isParentNavActive(pathname, item)
  const emphasized = isNavEmphasized(item.path, businessLine, item.emphasizeFor)
  const hasChildren = Boolean(item.children?.length)

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? 'nav-item-active'
        : emphasized
          ? 'nav-item ring-1 ring-[#C9A84C]/40 bg-[#C9A84C]/10 text-white'
          : 'nav-item'
    }`

  return (
    <div>
      {hasChildren ? (
        <button
          type="button"
          onClick={onToggle}
          className={`w-full ${linkClass(active)}`}
        >
          <Icon
            size={17}
            strokeWidth={1.75}
            className={active || emphasized ? 'text-[#C9A84C]' : 'text-white/60'}
          />
          <span className="flex-1 text-left">{item.label}</span>
          {expanded ? (
            <ChevronDown size={14} className="text-white/40" />
          ) : (
            <ChevronRight size={14} className="text-white/40" />
          )}
        </button>
      ) : (
        <Link to={item.path} className={linkClass(isNavItemActive(pathname, item))}>
          <Icon
            size={17}
            strokeWidth={1.75}
            className={
              isNavItemActive(pathname, item) || emphasized
                ? 'text-[#C9A84C]'
                : 'text-white/60'
            }
          />
          {item.label}
        </Link>
      )}

      {hasChildren && expanded && (
        <div className="ml-4 mt-0.5 pl-3 border-l border-white/10 space-y-0.5">
          {item.children!.map((child) => {
            const childActive = isChildNavActive(pathname, child)
            return (
              <Link
                key={child.path}
                to={child.path}
                className={`block px-3 py-1.5 rounded-lg text-xs ${
                  childActive
                    ? 'text-[#C9A84C] bg-white/5'
                    : 'text-white/55 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                {child.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { businessLine } = useBusinessLine()
  const pathname = location.pathname

  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({})
  const [moreOpen, setMoreOpen] = useState(() => isMoreModuleActive(pathname))

  useEffect(() => {
    const next: Record<string, boolean> = {}
    for (const item of [...DAILY_NAV_ITEMS, ...ASSET_NAV_ITEMS]) {
      if (item.children && isParentNavActive(pathname, item)) {
        next[item.path] = true
      }
    }
    setExpandedKeys((prev) => ({ ...prev, ...next }))
    if (isMoreModuleActive(pathname)) setMoreOpen(true)
  }, [pathname])

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const renderItems = (items: SidebarNavItem[]) =>
    items.map((item) => (
      <SidebarItem
        key={item.path}
        item={item}
        pathname={pathname}
        businessLine={businessLine}
        expanded={expandedKeys[item.path] ?? false}
        onToggle={() => toggleExpand(item.path)}
      />
    ))

  return (
    <aside className="hidden md:flex w-56 shrink-0 bg-[#1B2B4B] flex-col">
      <div className="h-16 flex items-center px-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-white/10 border border-[#C9A84C]/40 flex items-center justify-center mr-3">
          <span className="text-[#C9A84C] text-sm font-bold">Y</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">
            {appConfig.shortName}
          </p>
          <p className="text-[10px] text-white/50">{appConfig.copyright}</p>
        </div>
      </div>

      <nav className="flex-1 py-2 px-2 overflow-y-auto">
        <NavSectionLabel>{NAV_SECTION_DAILY}</NavSectionLabel>
        <div className="space-y-0.5">{renderItems(DAILY_NAV_ITEMS)}</div>

        <NavSectionLabel>{NAV_SECTION_ASSETS}</NavSectionLabel>
        <div className="space-y-0.5">{renderItems(ASSET_NAV_ITEMS)}</div>
      </nav>

      <div className="p-2 border-t border-white/10">
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-white/45 hover:text-white/70"
        >
          <span>更多</span>
          {moreOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {moreOpen && (
          <div className="space-y-0.5 pb-1">
            {MORE_NAV_ITEMS.map((item) => {
              const Icon = iconMap[item.icon]
              const active = isNavItemActive(pathname, item)
              const emphasized = isNavEmphasized(
                item.path,
                businessLine,
                MORE_EMPHASIZE_FOR[item.path],
              )
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${
                    active
                      ? 'nav-item-active'
                      : emphasized
                        ? 'text-[#C9A84C] bg-[#C9A84C]/10 ring-1 ring-[#C9A84C]/30'
                        : 'text-white/55 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <Icon size={15} strokeWidth={1.75} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        )}
        <p className="px-3 py-2 text-xs text-white/50 truncate">{user?.email}</p>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-red-400 hover:bg-white/5 transition-colors"
        >
          <LogOut size={17} strokeWidth={1.75} />
          退出登录
        </button>
      </div>
    </aside>
  )
}
