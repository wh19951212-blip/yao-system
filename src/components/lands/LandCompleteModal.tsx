import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Hotel } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import {
  completeLandToHotel,
  completeLandToProperty,
} from '@/services/lands'
import type { Land } from '@/types/database'

interface LandCompleteModalProps {
  open: boolean
  land: Land
  operator?: string | null
  onClose: () => void
  onCompleted: (land: Land) => void
}

export default function LandCompleteModal({
  open,
  land,
  operator,
  onClose,
  onCompleted,
}: LandCompleteModalProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState<'property' | 'hotel' | null>(null)
  const [error, setError] = useState('')

  const handleToProperty = async () => {
    setLoading('property')
    setError('')
    try {
      const { land: updated, property } = await completeLandToProperty(
        land.id,
        operator,
      )
      onCompleted(updated)
      onClose()
      navigate(`/properties/${property.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '转化失败')
    } finally {
      setLoading(null)
    }
  }

  const handleToHotel = async () => {
    setLoading('hotel')
    setError('')
    try {
      const { land: updated, hotel } = await completeLandToHotel(
        land.id,
        operator,
      )
      onCompleted(updated)
      onClose()
      navigate(`/hotels/${hotel.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '转化失败')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="项目完工转化"
      footer={
        <Button variant="secondary" onClick={onClose}>
          取消
        </Button>
      }
    >
      <p className="text-sm text-gray-600 mb-4">
        选择「{land.name}」完工后的去向，土地状态将自动变为「已完工」。
      </p>

      {error && <div className="alert-error mb-4">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          disabled={loading !== null}
          onClick={handleToProperty}
          className="card p-5 text-left hover:shadow-md transition-all disabled:opacity-50"
        >
          <Building2 size={24} className="text-[#C9A84C] mb-3" />
          <p className="font-medium text-[#1A1A2A]">转入物件库上架出售</p>
          <p className="text-xs text-gray-500 mt-1">
            自动创建物件记录并关联原土地
          </p>
          {loading === 'property' && (
            <p className="text-xs text-[#C9A84C] mt-2">创建中...</p>
          )}
        </button>

        <button
          type="button"
          disabled={loading !== null}
          onClick={handleToHotel}
          className="card p-5 text-left hover:shadow-md transition-all disabled:opacity-50"
        >
          <Hotel size={24} className="text-[#1B2B4B] mb-3" />
          <p className="font-medium text-[#1A1A2A]">转入酒店代运营</p>
          <p className="text-xs text-gray-500 mt-1">
            自动创建酒店记录并关联原土地
          </p>
          {loading === 'hotel' && (
            <p className="text-xs text-[#C9A84C] mt-2">创建中...</p>
          )}
        </button>
      </div>
    </Modal>
  )
}
