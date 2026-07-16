import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, ListTodo } from 'lucide-react'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { useDataScope } from '@/hooks/useDataScope'
import { useToast } from '@/contexts/ToastContext'
import {
  fetchMyTasks,
  getTaskRelatedPath,
  updateTaskStatus,
} from '@/services/tasks'
import { TASK_STATUS_LABELS } from '@/config/tasks'
import type { Task } from '@/types/database'

export default function MyTasksPanel() {
  const { profile } = useAuth()
  const { userId } = useDataScope()
  const toast = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyTasks(userId ?? profile?.id ?? null)
      .then(setTasks)
      .finally(() => setLoading(false))
  }, [userId, profile?.id])

  const handleDone = async (task: Task) => {
    try {
      await updateTaskStatus(task.id, 'done')
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
      toast.success('任务已完成')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  if (loading) {
    return (
      <section className="card p-6">
        <LoadingSpinner label="加载任务..." />
      </section>
    )
  }

  return (
    <section className="card p-6">
      <h2 className="section-label flex items-center gap-2 mb-4">
        <ListTodo size={16} className="text-[#C9A84C]" />
        我的待办任务
        {tasks.length > 0 && (
          <span className="text-gray-400 font-normal text-xs">（{tasks.length}）</span>
        )}
      </h2>

      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">暂无待办，可在 AI 分析后一键创建任务</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
            >
              <button
                type="button"
                onClick={() => handleDone(task)}
                className="mt-0.5 text-gray-400 hover:text-emerald-600"
                title="标记完成"
              >
                <Circle size={18} />
              </button>
              <div className="flex-1 min-w-0">
                <Link
                  to={getTaskRelatedPath(task)}
                  className="text-sm font-medium text-[#1A1A2A] hover:text-[#C9A84C]"
                >
                  {task.title}
                </Link>
                <p className="text-xs text-gray-500 mt-0.5">
                  {TASK_STATUS_LABELS[task.status]}
                  {task.due_date ? ` · 截止 ${task.due_date}` : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                className="shrink-0 px-2 py-1 text-xs"
                onClick={() => handleDone(task)}
              >
                <CheckCircle2 size={14} />
                完成
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
