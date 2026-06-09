import {
  MessageCircle,
  MoreHorizontal,
  Phone,
  Users,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { FOLLOW_UP_TYPES, type FollowUpType } from '@/config/app'
import { formatDateTime } from '@/services/investors'
import type { FollowUp } from '@/types/database'
import type { LucideIcon } from 'lucide-react'

const TYPE_ICONS: Record<string, LucideIcon> = {
  微信: MessageCircle,
  电话: Phone,
  见面: Users,
  其他: MoreHorizontal,
}

const TYPE_COLORS: Record<string, string> = {
  微信: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  电话: 'bg-blue-50 text-blue-600 border-blue-200',
  见面: 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30',
  其他: 'bg-gray-50 text-gray-500 border-gray-200',
}

interface FollowUpTimelineProps {
  followUps: FollowUp[]
  contactType: FollowUpType
  newNote: string
  submitting: boolean
  onContactTypeChange: (type: FollowUpType) => void
  onNoteChange: (note: string) => void
  onSubmit: () => void
}

export default function FollowUpTimeline({
  followUps,
  contactType,
  newNote,
  submitting,
  onContactTypeChange,
  onNoteChange,
  onSubmit,
}: FollowUpTimelineProps) {
  return (
    <section className="card p-6 xl:sticky xl:top-6 xl:self-start">
      <h2 className="section-label mb-4">跟进记录</h2>

      <div className="mb-5 space-y-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
        <Select
          id="contact_type"
          label="跟进类型"
          value={contactType}
          onChange={(e) => onContactTypeChange(e.target.value as FollowUpType)}
          options={FOLLOW_UP_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <Textarea
          value={newNote}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="填写本次跟进内容..."
          rows={3}
        />
        <Button
          onClick={onSubmit}
          disabled={submitting || !newNote.trim()}
          className="w-full"
        >
          {submitting ? '保存中...' : '添加跟进记录'}
        </Button>
        <p className="text-[10px] text-gray-400">保存后自动记录当前时间</p>
      </div>

      {followUps.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">暂无跟进记录</p>
      ) : (
        <div className="relative pl-5 border-l-2 border-gray-200 space-y-5 max-h-[520px] overflow-y-auto">
          {followUps.map((item) => {
            const Icon = TYPE_ICONS[item.contact_type] ?? MoreHorizontal
            const colorClass =
              TYPE_COLORS[item.contact_type] ?? TYPE_COLORS['其他']

            return (
              <div key={item.id} className="relative">
                <div
                  className={`absolute -left-[29px] top-0 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${colorClass}`}
                >
                  <Icon size={14} />
                </div>
                <div className="pl-2">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}
                    >
                      {item.contact_type}
                    </span>
                    <time className="text-xs text-gray-500">
                      {formatDateTime(item.created_at)}
                    </time>
                  </div>
                  <p className="text-sm text-[#1A1A2A] leading-relaxed whitespace-pre-line">
                    {item.content}
                  </p>
                  {item.created_by && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      记录人：{item.created_by}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
