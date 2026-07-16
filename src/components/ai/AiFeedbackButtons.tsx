import { useState } from 'react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { submitAiFeedback } from '@/services/aiLearning'
import type { AiFeedbackRating } from '@/types/database'

type AiFeedbackButtonsProps = {
  contextType: string
  entityType?: string
  entityId?: string
  createdBy?: string | null
  className?: string
}

export default function AiFeedbackButtons({
  contextType,
  entityType,
  entityId,
  createdBy,
  className = '',
}: AiFeedbackButtonsProps) {
  const [rating, setRating] = useState<AiFeedbackRating | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleRate = async (value: AiFeedbackRating) => {
    if (rating || submitting) return
    setSubmitting(true)
    try {
      await submitAiFeedback({
        context_type: contextType,
        entity_type: entityType ?? null,
        entity_id: entityId ?? null,
        rating: value,
        created_by: createdBy ?? null,
      })
      setRating(value)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-[11px] text-gray-400">这条 AI 解读有帮助吗？</span>
      <button
        type="button"
        disabled={Boolean(rating) || submitting}
        onClick={() => handleRate('helpful')}
        className={`p-1.5 rounded-lg transition-colors ${
          rating === 'helpful'
            ? 'bg-emerald-100 text-emerald-600'
            : 'bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'
        }`}
        title="有帮助"
      >
        <ThumbsUp size={14} />
      </button>
      <button
        type="button"
        disabled={Boolean(rating) || submitting}
        onClick={() => handleRate('not_helpful')}
        className={`p-1.5 rounded-lg transition-colors ${
          rating === 'not_helpful'
            ? 'bg-red-100 text-red-500'
            : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500'
        }`}
        title="没帮助"
      >
        <ThumbsDown size={14} />
      </button>
      {rating && (
        <span className="text-[11px] text-gray-400">感谢反馈，将用于优化后续分析</span>
      )}
    </div>
  )
}
