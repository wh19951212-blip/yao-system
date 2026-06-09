import { useState } from 'react'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import LandStatusBadge from '@/components/ui/LandStatusBadge'
import {
  LAND_ABANDON_REASONS,
  LAND_STATUSES,
  type LandAbandonReason,
} from '@/config/app'
import { abandonLand, updateLand } from '@/services/lands'
import type { Land } from '@/types/database'

interface LandStatusManagerProps {
  land: Land
  operator?: string | null
  onUpdated: (land: Land) => void
}

export default function LandStatusManager({
  land,
  operator,
  onUpdated,
}: LandStatusManagerProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [abandonOpen, setAbandonOpen] = useState(false)
  const [abandonReason, setAbandonReason] =
    useState<LandAbandonReason>('回报率不达标')
  const [abandonNote, setAbandonNote] = useState('')

  const handleStatusChange = async (status: string) => {
    if (status === '已放弃') {
      setAbandonOpen(true)
      return
    }
    if (status === land.status) return

    setSaving(true)
    setError('')
    try {
      const updated = await updateLand(
        land.id,
        { status, abandon_reason: null, abandon_reason_note: null },
        operator,
      )
      onUpdated(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败')
    } finally {
      setSaving(false)
    }
  }

  const handleAbandonConfirm = async () => {
    if (abandonReason === '其他' && !abandonNote.trim()) {
      setError('请填写放弃备注')
      return
    }
    setSaving(true)
    setError('')
    try {
      const updated = await abandonLand(
        land.id,
        abandonReason,
        abandonNote.trim() || null,
        operator,
      )
      onUpdated(updated)
      setAbandonOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '放弃失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <LandStatusBadge status={land.status} />
        {land.status !== '已完工' && (
          <div className="w-40">
            <Select
              id="land_status"
              label=""
              value={land.status}
              disabled={saving}
              onChange={(e) => handleStatusChange(e.target.value)}
              options={LAND_STATUSES.filter(
                (s) => s !== '已完工' || land.status === '已完工',
              ).map((s) => ({ value: s, label: s }))}
            />
          </div>
        )}
      </div>

      {land.abandon_reason && (
        <p className="text-xs text-gray-500 mt-2">
          放弃原因：{land.abandon_reason}
          {land.abandon_reason_note ? `（${land.abandon_reason_note}）` : ''}
        </p>
      )}

      {error && !abandonOpen && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}

      <Modal
        open={abandonOpen}
        onClose={() => setAbandonOpen(false)}
        title="填写放弃原因"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAbandonOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAbandonConfirm} disabled={saving}>
              {saving ? '保存中...' : '确认放弃'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <div className="alert-error">{error}</div>}
          <Select
            id="abandon_reason"
            label="放弃原因 *"
            value={abandonReason}
            onChange={(e) =>
              setAbandonReason(e.target.value as LandAbandonReason)
            }
            options={LAND_ABANDON_REASONS.map((r) => ({ value: r, label: r }))}
          />
          {abandonReason === '其他' && (
            <Textarea
              id="abandon_note"
              label="备注 *"
              value={abandonNote}
              onChange={(e) => setAbandonNote(e.target.value)}
              placeholder="请说明具体原因"
            />
          )}
        </div>
      </Modal>
    </>
  )
}
