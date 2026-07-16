import { useAuth } from '@/contexts/AuthContext'

export default function GuestBanner() {
  const { isGuest } = useAuth()

  if (!isGuest) return null

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
      <span className="font-medium">访客只读模式</span>
      <span className="mx-2 text-amber-700/70">·</span>
      可浏览全部模块，无法创建或修改。请使用邮箱登录以获得完整权限。
    </div>
  )
}
