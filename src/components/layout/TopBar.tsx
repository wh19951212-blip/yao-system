import GlobalSearch from '@/components/layout/GlobalSearch'
import { useAuth } from '@/contexts/AuthContext'

export default function TopBar() {
  const { profile } = useAuth()

  return (
    <header className="h-14 shrink-0 border-b border-gray-200 bg-white px-3 sm:px-6 flex items-center gap-2 sm:gap-4">
      <GlobalSearch />
      <div className="hidden sm:block text-xs text-gray-400 shrink-0">
        {profile?.name ?? '用户'}
      </div>
    </header>
  )
}
