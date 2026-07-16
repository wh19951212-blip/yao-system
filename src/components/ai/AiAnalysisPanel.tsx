import { useState } from 'react'
import { Bot } from 'lucide-react'
import Button from '@/components/ui/Button'
import CopyButton from '@/components/ui/CopyButton'
import AiFeedbackButtons from '@/components/ai/AiFeedbackButtons'
import AiTaskSuggestions from '@/components/ai/AiTaskSuggestions'
import type { TaskRelatedType } from '@/config/tasks'

type AiFeedbackContext = {
  contextType: string
  entityType?: string
  entityId?: string
  createdBy?: string | null
}

type AiTaskContext = {
  relatedType: TaskRelatedType
  relatedId: string
}

type AiAnalysisPanelProps = {
  title: string
  description: string
  buttonLabel?: string
  onAnalyze: () => Promise<string>
  feedbackContext?: AiFeedbackContext
  taskContext?: AiTaskContext
  className?: string
}

export default function AiAnalysisPanel({
  title,
  description,
  buttonLabel = 'AI 生成分析',
  onAnalyze,
  feedbackContext,
  taskContext,
  className = '',
}: AiAnalysisPanelProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    setLoading(true)
    setError('')
    setContent('')
    try {
      const result = await onAnalyze()
      setContent(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 分析失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={`card p-6 ${className}`}>
      <div className="mb-4">
        <h2 className="section-label flex items-center gap-2">
          <Bot size={16} className="text-[#C9A84C]" />
          {title}
        </h2>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>

      <Button
        variant="accent"
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full mb-4"
      >
        <Bot size={16} />
        {loading ? '分析中...' : buttonLabel}
      </Button>

      {error && <div className="alert-error mb-4">{error}</div>}

      {loading && (
        <div className="py-12 text-center text-sm text-gray-500">
          Claude 正在分析数据与匹配关系...
        </div>
      )}

      {!loading && content && (
        <>
          <div className="p-4 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 max-h-[420px] overflow-y-auto mb-4">
            <p className="text-sm text-[#1A1A2A] whitespace-pre-line leading-relaxed">
              {content}
            </p>
          </div>
          <CopyButton text={content} className="w-full mb-3" />
          {feedbackContext && (
            <AiFeedbackButtons
              contextType={feedbackContext.contextType}
              entityType={feedbackContext.entityType}
              entityId={feedbackContext.entityId}
              createdBy={feedbackContext.createdBy}
            />
          )}
          {taskContext && (
            <AiTaskSuggestions
              analysisText={content}
              relatedType={taskContext.relatedType}
              relatedId={taskContext.relatedId}
            />
          )}
        </>
      )}

      {!loading && !content && !error && (
        <p className="text-sm text-gray-500 text-center py-8">
          点击上方按钮，获取 AI 投资分析与匹配建议
        </p>
      )}
    </section>
  )
}
