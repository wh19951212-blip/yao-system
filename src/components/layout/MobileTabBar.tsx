import { NavLink, useLocation } from 'react-router-dom'
import { Building2, ClipboardList, Home, Users } from 'lucide-react'
import { isNavItemActive, MAIN_NAV_ITEMS, type NavIcon } from '@/config/navigation'

const iconMap: Record<NavIcon, typeof Home> = {
  Home,
  Users,
  Building: Building2,
  Clipboard: ClipboardList,
  Settings: Home,
}

export default function MobileTabBar() {
  const location = useLocation()
  const pathname = location.pathname

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="grid grid-cols-4 h-14">
        {MAIN_NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon]
          const active = isNavItemActive(pathname, item)
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${
                active ? 'text-[#1B2B4B] font-medium' : 'text-gray-400'
              }`}
            >
              <span className="text-base leading-none" aria-hidden>
                {item.emoji}
              </span>
              <Icon size={18} strokeWidth={1.75} className={active ? 'text-[#C9A84C]' : undefined} />
              {item.label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
