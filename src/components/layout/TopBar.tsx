import { Link, useLocation } from 'react-router-dom'
import { Settings } from 'lucide-react'
import GlobalSearch from '@/components/layout/GlobalSearch'
import { FOOTER_NAV_ITEM, isNavItemActive } from '@/config/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function TopBar() {
  const { profile } = useAuth()
  const location = useLocation()
  const settingsActive = isNavItemActive(location.pathname, FOOTER_NAV_ITEM)

  return (
    <header className="h-14 shrink-0 border-b border-gray-200 bg-white px-3 sm:px-6 flex items-center gap-3">
      <div className="hidden sm:block w-32 shrink-0" aria-hidden />
      <div className="flex-1 flex justify-center min-w-0 max-w-xl mx-auto">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-32 justify-end">
        <Link
          to={FOOTER_NAV_ITEM.path}
          className={`p-2 rounded-lg transition-colors ${
            settingsActive
              ? 'text-[#C9A84C] bg-[#C9A84C]/10'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
          title="设置"
        >
          <Settings size={18} strokeWidth={1.75} />
        </Link>
        <span className="hidden sm:block text-xs text-gray-400 truncate max-w-[100px]">
          {profile?.name ?? '用户'}
        </span>
      </div>
    </header>
  )
}
