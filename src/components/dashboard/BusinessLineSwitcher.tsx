import {
  DASHBOARD_BUSINESS_LINES,
  type BusinessLine,
} from '@/config/navigation'
import { useBusinessLine } from '@/hooks/useBusinessLine'

export default function BusinessLineSwitcher() {
  const { businessLine, setBusinessLine } = useBusinessLine()

  const active: BusinessLine =
    businessLine === 'brokerage' ? 'brokerage' : 'development'

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-xs text-gray-500 mr-1">当前业务线</span>
      {DASHBOARD_BUSINESS_LINES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => setBusinessLine(id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            active === id
              ? 'bg-[#1B2B4B] text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
      <span className="text-[11px] text-gray-400 ml-1">
        切换后侧边栏将高亮对应模块
      </span>
    </div>
  )
}
