import { Link } from 'react-router-dom'
import { CalendarClock, CheckCircle2, Users } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { DashboardData } from '@/types/database'

const DISMISS_KEY = 'daily_todo_dismissed'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function shouldShowDailyTodo() {
  return sessionStorage.getItem(DISMISS_KEY) !== todayKey()
}

export function dismissDailyTodoForToday() {
  sessionStorage.setItem(DISMISS_KEY, todayKey())
}

interface DailyTodoModalProps {
  open: boolean
  data: DashboardData
  onClose: () => void
}

export default function DailyTodoModal({
  open,
  data,
  onClose,
}: DailyTodoModalProps) {
  const followUpCount = data.overdueInvestors.length
  const deadlineCount = data.upcomingDeadlineInvestors.length
  const afterSalesCount = data.afterSalesOverdueInvestors.length
  const total = followUpCount + deadlineCount + afterSalesCount

  const handleClose = () => {
    dismissDailyTodoForToday()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="今日待办"
      footer={
        <Button variant="accent" onClick={handleClose}>
          知道了，开始工作
        </Button>
      }
    >
      {total === 0 ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
          <div>
            <p className="font-medium text-emerald-700">今日暂无紧急待办</p>
            <p className="text-sm text-emerald-600 mt-1">
              跟进与截止日期均在可控范围内，继续保持。
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            登录后已为您检查，以下事项建议今日处理：
          </p>
          {followUpCount > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-red-500" />
                <span className="text-sm text-[#1A1A2A]">需要跟进的投资人</span>
              </div>
              <span className="text-lg font-bold text-red-500">{followUpCount}</span>
            </div>
          )}
          {deadlineCount > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2">
                <CalendarClock size={18} className="text-amber-600" />
                <span className="text-sm text-[#1A1A2A]">截止日期临近</span>
              </div>
              <span className="text-lg font-bold text-amber-600">
                {deadlineCount}
              </span>
            </div>
          )}
          {afterSalesCount > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-blue-600" />
                <span className="text-sm text-[#1A1A2A]">售后回访待办</span>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {afterSalesCount}
              </span>
            </div>
          )}
          <div className="pt-2 flex flex-wrap gap-2">
            {followUpCount > 0 && (
              <Link to="/investors" onClick={handleClose}>
                <Button variant="secondary">查看投资人</Button>
              </Link>
            )}
            {deadlineCount > 0 && (
              <Link to="/dashboard" onClick={handleClose}>
                <Button variant="secondary">查看截止日期</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
