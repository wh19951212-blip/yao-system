import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import GradeBadge from '@/components/ui/GradeBadge'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency } from '@/services/investors'
import {
  addInvestorLandMatch,
  fetchMatchedInvestors,
  removeInvestorLandMatch,
} from '@/services/lands'
import { fetchInvestorsForPicker } from '@/services/relations'
import type { MatchedInvestor } from '@/types/database'

type LandInvestorMatchManagerProps = {
  landId: string
  canWrite: boolean
  onMatchesChange?: (matches: MatchedInvestor[]) => void
}

export default function LandInvestorMatchManager({
  landId,
  canWrite,
  onMatchesChange,
}: LandInvestorMatchManagerProps) {
  const toast = useToast()
  const [matches, setMatches] = useState<MatchedInvestor[]>([])
  const [investors, setInvestors] = useState<
    { id: string; name: string; grade?: string; level?: string; stage?: string }[]
  >([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [matchData, picker] = await Promise.all([
        fetchMatchedInvestors(landId),
        fetchInvestorsForPicker(),
      ])
      setMatches(matchData)
      setInvestors(picker)
      onMatchesChange?.(matchData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [landId])

  const matchedIds = new Set(matches.map((m) => m.investor.id))
  const available = investors.filter((i) => !matchedIds.has(i.id))

  const handleAdd = async () => {
    if (!selectedId) {
      toast.error('请选择投资人')
      return
    }
    setSubmitting(true)
    try {
      await addInvestorLandMatch(landId, selectedId)
      toast.success('已添加匹配投资人')
      setSelectedId('')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '添加失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async (matchId: string) => {
    setSubmitting(true)
    try {
      await removeInvestorLandMatch(matchId)
      toast.success('已移除')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '移除失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="section-label">匹配投资人</h2>
        <p className="text-xs text-gray-500 mt-1">与本地块关联的意向投资人</p>
      </div>

      {canWrite && available.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <Select
            id="add-investor-match"
            label=""
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            options={[
              { value: '', label: '选择投资人…' },
              ...available.map((i) => ({
                value: i.id,
                label: `${i.name}（${i.grade ?? i.level ?? '—'}级）`,
              })),
            ]}
            className="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleAdd}
            disabled={submitting || !selectedId}
            className="sm:self-end"
          >
            <Plus size={16} />
            添加
          </Button>
        </div>
      )}

      {loading ? (
        <p className="px-6 py-12 text-sm text-gray-500 text-center">加载中...</p>
      ) : matches.length === 0 ? (
        <p className="px-6 py-12 text-sm text-gray-500 text-center">
          暂无匹配投资人
        </p>
      ) : (
        <div className="divide-y divide-gray-200">
          {matches.map(({ matchId, investor }) => (
            <div
              key={matchId}
              className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    to={`/investors/${investor.id}`}
                    className="font-medium text-[#1A1A2A] hover:text-[#C9A84C]"
                  >
                    {investor.name}
                  </Link>
                  <GradeBadge grade={investor.grade} />
                </div>
                <div className="text-xs text-gray-500">
                  {investor.stage} · 预算 {formatCurrency(investor.budget)}
                </div>
              </div>
              {canWrite && (
                <button
                  type="button"
                  onClick={() => handleRemove(matchId)}
                  disabled={submitting}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                  title="移除匹配"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
