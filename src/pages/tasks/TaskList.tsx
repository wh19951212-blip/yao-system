import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, ListTodo } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import { useAuth } from '@/contexts/AuthContext'
import { useDataScope } from '@/hooks/useDataScope'
import { useToast } from '@/contexts/ToastContext'
import {
  fetchUserTasks,
  getTaskRelatedPath,
  updateTaskStatus,
} from '@/services/tasks'
import { TASK_RELATED_LABELS, TASK_STATUS_LABELS, type TaskStatus } from '@/config/tasks'
import type { Task } from '@/types/database'

const STATUS_TABS: { id: 'open' | TaskStatus; label: string }[] = [
  { id: 'open', label: '待办' },
  { id: 'done', label: '已完成' },
  { id: 'cancelled', label: '已取消' },
]

export default function TaskList() {
  const { profile } = useAuth()
  const { userId } = useDataScope()
  const toast = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [tab, setTab] = useState<'open' | TaskStatus>('open')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const statuses =
      tab === 'open'
        ? (['pending', 'in_progress'] as TaskStatus[])
        : ([tab] as TaskStatus[])
    fetchUserTasks(userId ?? profile?.id ?? null, { statuses })
      .then(setTasks)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [userId, profile?.id, tab])

  const handleDone = async (task: Task) => {
    try {
      await updateTaskStatus(task.id, 'done')
      toast.success('任务已完成')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="我的任务"
        description="AI 建议与手动创建的任务，按截止日期排序"
      />

      <div className="flex gap-2 mb-4">
        {STATUS_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              tab === id
                ? 'bg-[#1B2B4B] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <LoadingSpinner />}

      {!loading && tasks.length === 0 && (
        <EmptyState
          icon={ListTodo}
          title="暂无任务"
          description="在 AI 分析面板生成建议后，可一键创建任务"
          actionLabel="返回工作台"
          actionTo="/dashboard"
        />
      )}

      {!loading && tasks.length > 0 && (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="card p-4 flex items-start gap-3"
            >
              {task.status !== 'done' && task.status !== 'cancelled' ? (
                <button
                  type="button"
                  onClick={() => handleDone(task)}
                  className="mt-0.5 text-gray-400 hover:text-emerald-600"
                  title="标记完成"
                >
                  <Circle size={20} />
                </button>
              ) : (
                <CheckCircle2 size={20} className="mt-0.5 text-emerald-500 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <Link
                  to={getTaskRelatedPath(task)}
                  className="font-medium text-[#1A1A2A] hover:text-[#C9A84C]"
                >
                  {task.title}
                </Link>
                <p className="text-xs text-gray-500 mt-1">
                  {TASK_RELATED_LABELS[task.related_type]} ·{' '}
                  {TASK_STATUS_LABELS[task.status]}
                  {task.due_date ? ` · 截止 ${task.due_date}` : ''}
                </p>
              </div>
              {task.status !== 'done' && task.status !== 'cancelled' && (
                <Button
                  variant="ghost"
                  className="text-xs shrink-0"
                  onClick={() => handleDone(task)}
                >
                  完成
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
