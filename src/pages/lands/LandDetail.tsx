import { useEffect, useState } from 'react'
import { CheckCircle2, Hammer, MessageSquare, Pencil } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import CopyButton from '@/components/ui/CopyButton'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import ListBackLink from '@/components/ui/ListBackLink'
import LandStatusBadge from '@/components/ui/LandStatusBadge'
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
import { useCanWrite } from '@/hooks/useCanWrite'
import {
  buildWechatLandNote,
  saveWechatNoteToMedia,
  WECHAT_TEMPLATE_OPTIONS,
  type WechatNoteTemplate,
} from '@/utils/wechatLandNote'
import { formatAmountWan } from '@/utils/formatDisplay'
import {
  fetchLandById,
  formatArea,
  formatPercent,
} from '@/services/lands'
import { formatDateTime } from '@/services/investors'
import LandInvestorMatchManager from '@/components/lands/LandInvestorMatchManager'
import AiAnalysisPanel from '@/components/ai/AiAnalysisPanel'
import { analyzeLand } from '@/services/aiAnalysis'
import RelatedLinksPanel from '@/components/ui/RelatedLinksPanel'
import {
  contractToLinkItem,
  fetchContractsByLand,
  fetchHotelsByLandId,
  fetchPropertiesByLandId,
} from '@/services/relations'
import { fetchProjectsByLandId } from '@/services/projects'
import type { Contract, Hotel, Land, MatchedInvestor, Project, Property } from '@/types/database'
import type { LandRoiInputs } from '@/utils/landRoiCalculator'

export default function LandDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const toast = useToast()
  const [land, setLand] = useState<Land | null>(null)
  const [matches, setMatches] = useState<MatchedInvestor[]>([])
  const [downstreamProperties, setDownstreamProperties] = useState<Property[]>([])
  const [downstreamHotels, setDownstreamHotels] = useState<Hotel[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [landProjects, setLandProjects] = useState<Project[]>([])
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
  const { canWrite } = useCanWrite()

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      fetchLandById(id),
      fetchPropertiesByLandId(id),
      fetchHotelsByLandId(id),
      fetchContractsByLand(id),
      fetchProjectsByLandId(id),
    ])
      .then(([landData, props, hotels, contractRows, projects]) => {
        setLand(landData)
        setDownstreamProperties(props)
        setDownstreamHotels(hotels)
        setContracts(contractRows)
        setLandProjects(projects)
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
          canWrite ? (
            <div className="flex flex-wrap items-center gap-3">
              <Link to={`/projects/new?landId=${land.id}`}>
                <Button variant="secondary">
                  <Hammer size={16} />
                  创建开发项目
                </Button>
              </Link>
              <Link to={`/lands/${land.id}/edit`}>
                <Button variant="secondary">
                  <Pencil size={16} />
                  编辑
                </Button>
              </Link>
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
          ) : undefined
        }
      />

      {canWrite ? (
        <div className="mb-6">
          <LandStatusManager
            land={land}
            operator={user?.email}
            onUpdated={setLand}
          />
        </div>
      ) : (
        <div className="mb-6">
          <LandStatusBadge status={land.status} />
        </div>
      )}

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

        <LandInvestorMatchManager
          landId={land.id}
          canWrite={canWrite}
          onMatchesChange={(next) => {
            setMatches(next)
            if (next.length > 0 && !wechatInvestorId) {
              setWechatInvestorId(next[0].investor.id)
            }
          }}
        />
      </div>

      <AiAnalysisPanel
        title="AI 土地分析"
        description="分析地块投资价值、开发路径及投资人匹配度"
        onAnalyze={() =>
          analyzeLand(land, {
            matchedInvestors: matches,
            downstreamCount:
              downstreamProperties.length + downstreamHotels.length,
          })
        }
        feedbackContext={{
          contextType: 'land_analysis',
          entityType: 'land',
          entityId: land.id,
          createdBy: user?.email ?? null,
        }}
        taskContext={{ relatedType: 'land', relatedId: land.id }}
        className="mt-6"
      />

      {landProjects.length > 0 && (
        <RelatedLinksPanel
          title="开发项目"
          description="由此地块发起的开发计划"
          items={landProjects.map((p) => ({
            id: p.id,
            label: p.name,
            path: `/projects/${p.id}`,
            subtitle: `${p.type} · ${p.status}`,
          }))}
          className="mt-6"
        />
      )}

      {(downstreamProperties.length > 0 || downstreamHotels.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {downstreamProperties.length > 0 && (
            <RelatedLinksPanel
              title="下游物件"
              description="由本地块开发转化"
              items={downstreamProperties.map((p) => ({
                id: p.id,
                label: p.name,
                path: `/properties/${p.id}`,
                subtitle: [p.type, p.status].filter(Boolean).join(' · '),
              }))}
            />
          )}
          {downstreamHotels.length > 0 && (
            <RelatedLinksPanel
              title="下游酒店"
              description="由本地块运营转化"
              items={downstreamHotels.map((h) => ({
                id: h.id,
                label: h.name,
                path: `/hotels/${h.id}`,
                subtitle: h.status,
              }))}
            />
          )}
        </div>
      )}

      {contracts.length > 0 && (
        <RelatedLinksPanel
          title="关联合同"
          items={contracts.map(contractToLinkItem)}
          className="mt-6"
        />
      )}

      <div className="mt-8">
        <LandRoiCalculator
          initialValues={{ landAreaSqm: land.area_sqm, landPriceMan: land.price_wan }}
          onInputsChange={(inputs) => setRoiInputs(inputs)}
        />
      </div>

      {canWrite && (
        <>
          <LandApprovalTracker landId={land.id} />
          <LandQuoteManager landId={land.id} />
        </>
      )}

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
