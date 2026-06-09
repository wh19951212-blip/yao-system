import { ArrowRight, TrendingUp } from 'lucide-react'
import { formatDateTime } from '@/services/investors'
import type { InvestorStageLog } from '@/types/database'

interface StageChangeTimelineProps {
  logs: InvestorStageLog[]
}

export default function StageChangeTimeline({ logs }: StageChangeTimelineProps) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-6">暂无阶段变化记录</p>
    )
  }

  return (
    <div className="space-y-0">
      {logs.map((log, index) => (
        <div key={log.id} className="relative flex gap-4 pb-6 last:pb-0">
          {index < logs.length - 1 && (
            <span className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200" />
          )}
          <div className="shrink-0 w-8 h-8 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
            <TrendingUp size={14} className="text-[#C9A84C]" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-[#1A1A2A]">{log.from_stage}</span>
              <ArrowRight size={14} className="text-gray-400" />
              <span className="font-medium text-[#C9A84C]">{log.to_stage}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatDateTime(log.changed_at)}
              {log.changed_by ? ` · ${log.changed_by}` : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
