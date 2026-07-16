import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  FileText,
  FolderOpen,
  Handshake,
  HardHat,
  Hotel,
  LayoutDashboard,
  Map,
  MoreHorizontal,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import {
  isMoreModuleActive,
  isNavItemActive,
  MORE_MODULE_ITEMS,
  MORE_PAGE_PATH,
  SIDEBAR_NAV_ITEMS,
  type NavIcon,
} from '@/config/navigation'
import { useAuth } from '@/contexts/AuthContext'

const MOBILE_BAR_PATHS = [
  '/dashboard',
  '/investors',
  '/properties',
  '/matching/demands',
] as const

const MOBILE_BAR = SIDEBAR_NAV_ITEMS.filter((item) =>
  MOBILE_BAR_PATHS.includes(item.path as (typeof MOBILE_BAR_PATHS)[number]),
)

const MOBILE_MORE = [
  ...SIDEBAR_NAV_ITEMS.filter(
    (item) => !MOBILE_BAR.some((bar) => bar.path === item.path),
  ),
  ...MORE_MODULE_ITEMS.filter((item) => item.path !== MORE_PAGE_PATH),
]

const ICONS: Record<NavIcon, typeof LayoutDashboard> = {
  LayoutDashboard,
  Users,
  Map,
  Building2,
  Handshake,
  Sparkles,
  MoreHorizontal,
  HardHat,
  Hotel,
  FileText,
  FolderOpen,
  Settings,
}

export default function MobileTabBar() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const isMoreActive =
    isMoreModuleActive(location.pathname) ||
    location.pathname === MORE_PAGE_PATH ||
    MOBILE_MORE.some((item) => isNavItemActive(location.pathname, item))

  return (
    <>
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="关闭菜单"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-16 left-0 right-0 bg-white border-t border-gray-200 rounded-t-2xl shadow-xl max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-[#1B2B4B]">更多功能</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-1 text-gray-400"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1 p-3">
              {MOBILE_MORE.map((item) => {
                const Icon = ICONS[item.icon]
                const active = isNavItemActive(location.pathname, item)
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => {
                      navigate(item.path)
                      setMoreOpen(false)
                    }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs ${
                      active
                        ? 'bg-[#1B2B4B]/5 text-[#1B2B4B]'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} strokeWidth={1.75} />
                    {item.label}
                  </button>
                )
              })}
            </div>
            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={() => {
                  signOut()
                  setMoreOpen(false)
                }}
                className="w-full py-2.5 text-sm text-red-500 rounded-lg hover:bg-red-50"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="grid grid-cols-5 h-14">
          {MOBILE_BAR.map((item) => {
            const Icon = ICONS[item.icon]
            const active = isNavItemActive(location.pathname, item)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${
                  active ? 'text-[#1B2B4B] font-medium' : 'text-gray-400'
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={1.75}
                  className={active ? 'text-[#C9A84C]' : undefined}
                />
                {item.path === '/dashboard'
                  ? '首页'
                  : item.path === '/investors'
                    ? '投资人'
                    : item.path === '/matching/demands'
                      ? '匹配'
                      : item.label}
              </NavLink>
            )
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${
              isMoreActive ? 'text-[#1B2B4B] font-medium' : 'text-gray-400'
            }`}
          >
            <MoreHorizontal
              size={20}
              strokeWidth={1.75}
              className={isMoreActive ? 'text-[#C9A84C]' : undefined}
            />
            更多
          </button>
        </div>
      </nav>
    </>
  )
}
