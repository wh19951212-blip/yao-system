import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  Handshake,
  HardHat,
  Hotel,
  LayoutDashboard,
  Map,
  MoreHorizontal,
  Sparkles,
  Users,
  X,
  FileText,
  FolderOpen,
  Settings,
} from 'lucide-react'
import {
  DAILY_NAV_ITEMS,
  ASSET_NAV_ITEMS,
  isMoreModuleActive,
  isNavItemActive,
  MORE_NAV_ITEMS,
  type NavIcon,
} from '@/config/navigation'
import { useAuth } from '@/contexts/AuthContext'

const MOBILE_BAR = [
  DAILY_NAV_ITEMS[0],
  DAILY_NAV_ITEMS[1],
  DAILY_NAV_ITEMS[2],
  ASSET_NAV_ITEMS[0],
]

const ICONS: Record<NavIcon, typeof LayoutDashboard> = {
  LayoutDashboard,
  Users,
  Map,
  Building2,
  Handshake,
  Sparkles,
  ListTodo: LayoutDashboard,
  Hammer: Map,
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

  const isMoreActive = isMoreModuleActive(location.pathname)

  const mobileMore = [
    ...ASSET_NAV_ITEMS.filter((i) => !MOBILE_BAR.some((b) => b.path === i.path)),
    ...MORE_NAV_ITEMS,
    { path: '/tasks', label: '我的任务', icon: 'ListTodo' as NavIcon, matchPaths: ['/tasks'] },
    { path: '/projects', label: '开发项目', icon: 'Hammer' as NavIcon, matchPaths: ['/projects'] },
  ]

  const barLabel = (path: string, label: string) => {
    if (path === '/dashboard') return '首页'
    if (path === '/matching/demands') return '需求'
    return label.length > 4 ? label.slice(0, 4) : label
  }

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
              <p className="text-sm font-semibold text-[#1B2B4B]">更多</p>
              <button type="button" onClick={() => setMoreOpen(false)} className="p-1 text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1 p-3">
              {mobileMore.map((item) => {
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
                      active ? 'bg-[#1B2B4B]/5 text-[#1B2B4B]' : 'text-gray-600 hover:bg-gray-50'
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
                <Icon size={20} strokeWidth={1.75} className={active ? 'text-[#C9A84C]' : undefined} />
                {barLabel(item.path, item.label)}
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
            <MoreHorizontal size={20} strokeWidth={1.75} className={isMoreActive ? 'text-[#C9A84C]' : undefined} />
            更多
          </button>
        </div>
      </nav>
    </>
  )
}
