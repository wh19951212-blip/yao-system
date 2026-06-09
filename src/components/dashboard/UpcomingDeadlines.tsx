import { Link } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import GradeBadge from '@/components/ui/GradeBadge'
import { useSettings } from '@/contexts/SettingsContext'
import {
  formatDate,
  getDeadlineDaysLeft,
  type DeadlineUrgency,
} from '@/services/investors'
import type { Investor } from '@/types/database'

function urgencyStyles(
  deadlineDays: number,
  followUpDays: number,
): Record<
  DeadlineUrgency,
  { row: string; badge: string; label: string }
> {
  return {
    expired: {
      row: 'bg-red-50 border-red-200',
      badge: 'bg-red-100 text-red-600 border-red-200',
      label: '已过期',
    },
    within3: {
      row: 'bg-amber-50 border-amber-200',
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
      label: `${deadlineDays}天内`,
    },
    within7: {
      row: 'bg-emerald-50 border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      label: `${followUpDays}天内`,
    },
  }
}

interface UpcomingDeadlinesProps {
  investors: Investor[]
}

export default function UpcomingDeadlines({ investors }: UpcomingDeadlinesProps) {
  const { settings } = useSettings()
  const styles = urgencyStyles(
    settings.deadlineReminderDays,
    settings.followUpReminderDays,
  )

  if (investors.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-sm text-gray-500">
          暂无 {settings.followUpReminderDays} 天内到期的跟进任务
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {investors.map((investor) => {
        const urgency = getDeadlineDaysLeft(investor.deadline)!.urgency
        const rowStyles = styles[urgency]
        const daysLeft = getDeadlineDaysLeft(investor.deadline)!.daysLeft

        return (
          <div
            key={investor.id}
            className={`card border ${rowStyles.row}`}
          >
            <div className="card-body flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center ${rowStyles.badge}`}
                >
                  <CalendarClock size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Link
                      to={`/investors/${investor.id}`}
                      className="font-medium text-[#1A1A2A] hover:text-[#C9A84C]"
                    >
                      {investor.name}
                    </Link>
                    <GradeBadge grade={investor.grade} />
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${rowStyles.badge}`}
                    >
                      {rowStyles.label}
                    </span>
                  </div>
                  <p className="text-sm text-[#1A1A2A]">
                    {investor.next_action || '未设置下一步行动'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    截止 {formatDate(investor.deadline)}
                    {urgency === 'expired'
                      ? ` · 已过期 ${Math.abs(daysLeft)} 天`
                      : ` · 剩余 ${daysLeft} 天`}
                  </p>
                </div>
              </div>
              <Link
                to={`/investors/${investor.id}`}
                className="text-sm text-[#C9A84C] hover:text-[#B8963F] font-medium shrink-0"
              >
                跟进 →
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
