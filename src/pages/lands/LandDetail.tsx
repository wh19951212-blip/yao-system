import { useEffect, useState } from 'react'
import { CheckCircle2, MessageSquare } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import CopyButton from '@/components/ui/CopyButton'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import GradeBadge from '@/components/ui/GradeBadge'
import ListBackLink from '@/components/ui/ListBackLink'
import LandRoiCalculator from '@/components/lands/LandRoiCalculator'
import LandApprovalTracker from '@/components/lands/LandApprovalTracker'
import LandQuoteManager from '@/components/lands/LandQuoteManager'
import LandStatusManager from '@/components/lands/LandStatusManager'
import LandCompleteModal from '@/components/lands/LandCompleteModal'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import AccessDenied from '@/components/ui/AccessDenied'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useOwnerAccess } from '@/hooks/useOwnerAccess'
import {
  buildWechatLandNote,
  saveWechatNoteToMedia,
  WECHAT_TEMPLATE_OPTIONS,
  type WechatNoteTemplate,
} from '@/utils/wechatLandNote'
import { formatAmountWan } from '@/utils/formatDisplay'
import {
  fetchLandById,
  fetchMatchedInvestors,
  formatArea,
  formatPercent,
} from '@/services/lands'
import { formatCurrency, formatDateTime } from '@/services/investors'
import type { Land, MatchedInvestor } from '@/types/database'
import type { LandRoiInputs } from '@/utils/landRoiCalculator'

export default function LandDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const toast = useToast()
  const [land, setLand] = useState<Land | null>(null)
  const [matches, setMatches] = useState<MatchedInvestor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roiInputs, setRoiInputs] = useState<Partial<LandRoiInputs>>({})
  const [wechatNote, setWechatNote] = useState('')
  const [wechatOpen, setWechatOpen] = useState(false)
  const [wechatTemplate, setWechatTemplate] =
    useState<WechatNoteTemplate>('standard')
  const [wechatInvestorId, setWechatInvestorId] = useState('')
  const [wechatGenerating, setWechatGenerating] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const { denied } = useOwnerAccess(land?.owner)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([fetchLandById(id), fetchMatchedInvestors(id)])
      .then(([landData, matchData]) => {
        setLand(landData)
        setMatches(matchData)
        if (matchData.length > 0) {
          setWechatInvestorId(matchData[0].investor.id)
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  const handleGenerateWechat = async () => {
    if (!land) return

    const investor = matches.find(
      (m) => m.investor.id === wechatInvestorId,
    )?.investor

    if (wechatTemplate === 'investor' && !investor) {
      toast.error('请先选择投资人，或添加匹配投资人')
      return
    }

    setWechatGenerating(true)
    try {
      const note = buildWechatLandNote(
        land,
        roiInputs,
        wechatTemplate,
        investor,
      )
      setWechatNote(note)
      await saveWechatNoteToMedia(land, note, user?.email)
      toast.success('笔记已生成并保存到素材库')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '生成失败')
    } finally {
      setWechatGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !land) {
    return (
      <div className="page-shell">
        <div className="alert-error">{error || '土地不存在'}</div>
        <ListBackLink listKey="lands" basePath="/lands" />
      </div>
    )
  }

  if (denied) return <AccessDenied />

  const infoRows = [
    { label: '位置', value: land.location },
    { label: '面积', value: formatArea(land.area_sqm) },
    { label: '价格', value: formatAmountWan(land.price_wan) },
    {
      label: '预期租金',
      value:
        land.expected_rent_wan != null
          ? `${formatAmountWan(land.expected_rent_wan)}/年`
          : '—',
    },
    { label: '回报率', value: formatPercent(land.roi_percent) },
    { label: '法律状态', value: land.legal_status },
    { label: '备注', value: land.description },
    { label: '创建时间', value: formatDateTime(land.created_at) },
    { label: '更新时间', value: formatDateTime(land.updated_at) },
  ]

  return (
    <div className="page-shell">
      <ListBackLink listKey="lands" basePath="/lands" />

      <PageHeader
        title={land.name}
        description={land.location}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {land.status !== '已完工' && land.status !== '已放弃' && (
              <Button variant="secondary" onClick={() => setCompleteOpen(true)}>
                <CheckCircle2 size={16} />
                项目完工
              </Button>
            )}
            <Button variant="accent" onClick={() => setWechatOpen(true)}>
              <MessageSquare size={16} />
              生成微信笔记
            </Button>
          </div>
        }
      />

      <div className="mb-6">
        <LandStatusManager
          land={land}
          operator={user?.email}
          onUpdated={setLand}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card p-6">
          <h2 className="section-label mb-4">基本信息</h2>
          <dl className="space-y-4">
            {infoRows.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-gray-500 mb-0.5">{label}</dt>
                <dd className="text-sm text-[#1A1A2A] break-words line-clamp-3">
                  {value || '—'}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="section-label">匹配投资人</h2>
            <p className="text-xs text-gray-500 mt-1">与本地块关联的意向投资人</p>
          </div>

          {matches.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">
              暂无匹配投资人
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {matches.map(({ matchId, investor }) => (
                <div
                  key={matchId}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      to={`/investors/${investor.id}`}
                      className="font-medium text-[#1A1A2A] hover:text-[#C9A84C] transition-colors"
                    >
                      {investor.name}
                    </Link>
                    <GradeBadge grade={investor.grade} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <span>阶段：{investor.stage}</span>
                    <span>预算：{formatCurrency(investor.budget)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-8">
        <LandRoiCalculator
          initialValues={{ landAreaSqm: land.area_sqm, landPriceMan: land.price_wan }}
          onInputsChange={(inputs) => setRoiInputs(inputs)}
        />
      </div>

      <LandApprovalTracker landId={land.id} />

      <LandQuoteManager landId={land.id} />

      <LandCompleteModal
        open={completeOpen}
        land={land}
        operator={user?.email}
        onClose={() => setCompleteOpen(false)}
        onCompleted={setLand}
      />

      <Modal
        open={wechatOpen}
        onClose={() => setWechatOpen(false)}
        title="微信项目笔记"
        footer={
          <>
            <Button variant="secondary" onClick={() => setWechatOpen(false)}>
              关闭
            </Button>
            <Button
              variant="accent"
              onClick={handleGenerateWechat}
              disabled={wechatGenerating}
            >
              {wechatGenerating ? '生成中...' : '生成并保存'}
            </Button>
            <CopyButton text={wechatNote} disabled={!wechatNote} />
          </>
        }
      >
        <div className="space-y-4 mb-4">
          <Select
            id="wechatTemplate"
            label="笔记模板"
            value={wechatTemplate}
            onChange={(e) =>
              setWechatTemplate(e.target.value as WechatNoteTemplate)
            }
            options={[...WECHAT_TEMPLATE_OPTIONS]}
          />
          {wechatTemplate === 'investor' && (
            <Select
              id="wechatInvestor"
              label="目标投资人"
              value={wechatInvestorId}
              onChange={(e) => setWechatInvestorId(e.target.value)}
              options={
                matches.length > 0
                  ? matches.map(({ investor }) => ({
                      value: investor.id,
                      label: `${investor.name}（${investor.grade}级）`,
                    }))
                  : [{ value: '', label: '暂无匹配投资人' }]
              }
            />
          )}
        </div>
        {wechatNote ? (
          <pre className="text-sm text-[#1A1A2A] whitespace-pre-wrap leading-relaxed font-sans bg-gray-50 rounded-lg p-4 border border-gray-100">
            {wechatNote}
          </pre>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            选择模板后点击「生成并保存」，笔记将自动存入素材库
          </p>
        )}
      </Modal>
    </div>
  )
}
