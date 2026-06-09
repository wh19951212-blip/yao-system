import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  FileText,
  FolderOpen,
  HardHat,
  Hotel,
  LayoutDashboard,
  Map,
  MoreHorizontal,
  Settings,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const MAIN_TABS = [
  { path: '/dashboard', label: '首页', icon: LayoutDashboard },
  { path: '/investors', label: '投资人', icon: Users },
  { path: '/lands', label: '土地', icon: Map },
  { path: '/properties', label: '物件', icon: Building2 },
] as const

const MORE_LINKS = [
  { path: '/buyers', label: '买家', icon: ShoppingBag },
  { path: '/builders', label: '建筑商', icon: HardHat },
  { path: '/hotels', label: '酒店', icon: Hotel },
  { path: '/contracts', label: '合同', icon: FileText },
  { path: '/media', label: '素材库', icon: FolderOpen },
  { path: '/settings', label: '设置', icon: Settings },
] as const

export default function MobileTabBar() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const isMoreActive = MORE_LINKS.some((item) =>
    location.pathname.startsWith(item.path),
  )

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
              {MORE_LINKS.map(({ path, label, icon: Icon }) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => {
                    navigate(path)
                    setMoreOpen(false)
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs ${
                    location.pathname.startsWith(path)
                      ? 'bg-[#1B2B4B]/5 text-[#1B2B4B]'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} strokeWidth={1.75} />
                  {label}
                </button>
              ))}
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
          {MAIN_TABS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 text-[10px] ${
                  isActive
                    ? 'text-[#1B2B4B] font-medium'
                    : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={20}
                    strokeWidth={1.75}
                    className={isActive ? 'text-[#C9A84C]' : undefined}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
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
