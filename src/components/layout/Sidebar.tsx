import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  Handshake,
  LayoutDashboard,
  LogOut,
  Map,
  Sparkles,
  Users,
} from 'lucide-react'
import { appConfig } from '@/config/app'
import {
  MORE_PAGE_PATH,
  SIDEBAR_NAV_ITEMS,
  isNavItemActive,
  type NavIcon,
} from '@/config/navigation'
import { useAuth } from '@/contexts/AuthContext'

const iconMap: Record<
  NavIcon,
  typeof LayoutDashboard
> = {
  LayoutDashboard,
  Users,
  Map,
  Building2,
  Handshake,
  Sparkles,
  MoreHorizontal: LayoutDashboard,
  HardHat: LayoutDashboard,
  Hotel: LayoutDashboard,
  FileText: LayoutDashboard,
  FolderOpen: LayoutDashboard,
  Settings: LayoutDashboard,
}

export default function Sidebar() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

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

      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {SIDEBAR_NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon]
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={() =>
                `flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm ${
                  isNavItemActive(location.pathname, item)
                    ? 'nav-item-active'
                    : 'nav-item'
                }`
              }
            >
              {() => {
                const isActive = isNavItemActive(location.pathname, item)
                return (
                  <>
                    <Icon
                      size={17}
                      strokeWidth={1.75}
                      className={isActive ? 'text-[#C9A84C]' : 'text-white/60'}
                    />
                    {item.label}
                  </>
                )
              }}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          to={MORE_PAGE_PATH}
          className="block px-3 py-2 text-xs text-white/45 hover:text-[#C9A84C] transition-colors"
        >
          更多功能（建筑商 · 酒店 · 合同…）→
        </Link>
        <p className="px-3 text-xs text-white/50 truncate">{user?.email}</p>
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
