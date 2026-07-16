import { useState } from 'react'
import { Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useDataScope } from '@/hooks/useDataScope'
import { useToast } from '@/contexts/ToastContext'
import {
  buildTaskDueDate,
  createTask,
  suggestTasksFromAnalysis,
  type SuggestedTask,
} from '@/services/tasks'
import type { TaskRelatedType } from '@/config/tasks'

type AiTaskSuggestionsProps = {
  analysisText: string
  relatedType: TaskRelatedType
  relatedId: string
}

export default function AiTaskSuggestions({
  analysisText,
  relatedType,
  relatedId,
}: AiTaskSuggestionsProps) {
  const { profile } = useAuth()
  const { userId } = useDataScope()
  const toast = useToast()
  const [suggestions, setSuggestions] = useState<SuggestedTask[]>([])
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState<Set<number>>(new Set())

  const loadSuggestions = async () => {
    setLoading(true)
    try {
      const items = await suggestTasksFromAnalysis(
        analysisText,
        relatedType,
        relatedId,
      )
      setSuggestions(items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '任务建议生成失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (item: SuggestedTask, index: number) => {
    try {
      await createTask({
        title: item.title,
        related_type: relatedType,
        related_id: relatedId,
        due_date: buildTaskDueDate(item.dueInDays),
        assigned_to: userId ?? profile?.id ?? null,
        created_by: userId ?? profile?.id ?? null,
        owner_id: userId ?? profile?.id ?? null,
      })
      setCreated((prev) => new Set(prev).add(index))
      toast.success('任务已创建')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '创建失败')
    }
  }

  if (!analysisText) return null

  return (
    <div className="mt-4 pt-4 border-t border-[#C9A84C]/20">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-[#1B2B4B]">AI 建议下一步任务</p>
        {suggestions.length === 0 && (
          <Button
            variant="ghost"
            className="text-xs px-2 py-1 h-auto"
            onClick={loadSuggestions}
            disabled={loading}
          >
            {loading ? '生成中...' : '生成任务建议'}
          </Button>
        )}
      </div>
      {suggestions.length > 0 && (
        <ul className="space-y-2">
          {suggestions.map((item, index) => (
            <li
              key={`${item.title}-${index}`}
              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/60 border border-gray-100"
            >
              <span className="text-sm text-gray-700">{item.title}</span>
              {created.has(index) ? (
                <span className="text-xs text-emerald-600">已创建</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCreate(item, index)}
                  className="flex items-center gap-1 text-xs text-[#C9A84C] hover:underline"
                >
                  <Plus size={14} />
                  创建任务
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
