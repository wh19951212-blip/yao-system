import { Link } from 'react-router-dom'
import { FileText, PartyPopper } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import CopyButton from '@/components/ui/CopyButton'

interface DealClosedModalProps {
  open: boolean
  investorId: string
  investorName: string
  congratulationNote: string
  onClose: () => void
}

export default function DealClosedModal({
  open,
  investorId,
  investorName,
  congratulationNote,
  onClose,
}: DealClosedModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="成交恭喜"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            稍后处理
          </Button>
          <Link to={`/contracts/new?investorId=${investorId}`}>
            <Button>
              <FileText size={16} />
              创建合同
            </Button>
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <PartyPopper size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-700">
              {investorName} 已进入成交阶段
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              已标记为「已成交客户」，转入售后跟进模式（每 30 天提醒一次）
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">成交祝贺笔记（可发微信）</p>
          <pre className="text-sm text-[#1A1A2A] whitespace-pre-wrap leading-relaxed font-sans p-4 rounded-xl bg-gray-50 border border-gray-200 max-h-64 overflow-y-auto">
            {congratulationNote}
          </pre>
        </div>

        <CopyButton text={congratulationNote} className="w-full" />
      </div>
    </Modal>
  )
}
