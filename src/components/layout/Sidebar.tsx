import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Building2, ClipboardList, Home, LogOut, Settings, Users } from 'lucide-react'
import { appConfig } from '@/config/app'
import {
  FOOTER_NAV_ITEM,
  isNavItemActive,
  MAIN_NAV_ITEMS,
  type NavIcon,
} from '@/config/navigation'
import { useAuth } from '@/contexts/AuthContext'

const iconMap: Record<NavIcon, typeof Home> = {
  Home,
  Users,
  Building: Building2,
  Clipboard: ClipboardList,
  Settings,
}

export default function Sidebar() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="hidden md:flex w-52 shrink-0 bg-[#1B2B4B] flex-col">
      <div className="h-16 flex items-center px-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-white/10 border border-[#C9A84C]/40 flex items-center justify-center mr-3">
          <span className="text-[#C9A84C] text-sm font-bold">Y</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">
            {appConfig.shortName}
          </p>
        </div>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {MAIN_NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item)
          const Icon = iconMap[item.icon]
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active ? 'nav-item-active' : 'nav-item'
              }`}
            >
              <span className="text-base leading-none" aria-hidden>
                {item.emoji}
              </span>
              <Icon
                size={17}
                strokeWidth={1.75}
                className={active ? 'text-[#C9A84C]' : 'text-white/50'}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-2 border-t border-white/10">
        <Link
          to={FOOTER_NAV_ITEM.path}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
            isNavItemActive(pathname, FOOTER_NAV_ITEM)
              ? 'text-[#C9A84C] bg-white/5'
              : 'text-white/45 hover:text-white/70 hover:bg-white/5'
          }`}
          title="设置"
        >
          <span aria-hidden>{FOOTER_NAV_ITEM.emoji}</span>
          <Settings size={15} strokeWidth={1.75} />
        </Link>
        <p className="px-3 py-2 text-xs text-white/40 truncate">{user?.email}</p>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/55 hover:text-red-400 hover:bg-white/5 transition-colors"
        >
          <LogOut size={16} strokeWidth={1.75} />
          退出
        </button>
      </div>
    </aside>
  )
}
