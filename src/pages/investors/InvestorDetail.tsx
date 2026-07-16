import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Pencil, Sparkles } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import GradeBadge from '@/components/ui/GradeBadge'
import AiAnalysisPanel from '@/components/ai/AiAnalysisPanel'
import { analyzeInvestor } from '@/services/aiAnalysis'
import FollowUpTimeline from '@/components/investors/FollowUpTimeline'
import StageChangeTimeline from '@/components/investors/StageChangeTimeline'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { useToast } from '@/contexts/ToastContext'
import AccessDenied from '@/components/ui/AccessDenied'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useOwnerAccess } from '@/hooks/useOwnerAccess'
import { fetchStageLogs } from '@/services/investorStageLogs'
import {
  createFollowUp,
  fetchFollowUps,
  fetchInvestorById,
  formatCurrency,
  formatDate,
  formatDateTime,
  isOverdueContact,
} from '@/services/investors'
import { AFTER_SALES_REMINDER_DAYS, type FollowUpType } from '@/config/app'
import type { FollowUp, Investor, InvestorStageLog } from '@/types/database'
import { fetchDemandsByInvestor, formatDemandTitle } from '@/services/demands'
import { fetchChannelById } from '@/services/channels'
import {
  contractToLinkItem,
  fetchContractsByInvestor,
} from '@/services/relations'
import RelatedLinksPanel from '@/components/ui/RelatedLinksPanel'
import NextStepBar from '@/components/ui/NextStepBar'
import { DEMAND_STATUS_LABELS } from '@/config/matching'
import type { Channel, Contract, InvestorDemand } from '@/types/database'

export default function InvestorDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { settings } = useSettings()
  const toast = useToast()
  const [investor, setInvestor] = useState<Investor | null>(null)
  const { denied } = useOwnerAccess(investor?.owner)
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [stageLogs, setStageLogs] = useState<InvestorStageLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newNote, setNewNote] = useState('')
  const [contactType, setContactType] = useState<FollowUpType>('微信')
  const [submitting, setSubmitting] = useState(false)
  const [demands, setDemands] = useState<InvestorDemand[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [channel, setChannel] = useState<Channel | null>(null)

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [inv, follows, logs, demandRows, contractRows] = await Promise.all([
        fetchInvestorById(id),
        fetchFollowUps(id),
        fetchStageLogs(id),
        fetchDemandsByInvestor(id),
        fetchContractsByInvestor(id),
      ])
      setInvestor(inv)
      setFollowUps(follows)
      setStageLogs(logs)
      setDemands(demandRows)
      setContracts(contractRows)
      if (inv.channel_id) {
        fetchChannelById(inv.channel_id)
          .then(setChannel)
          .catch(() => setChannel(null))
      } else {
        setChannel(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  useEffect(() => {
    if (!loading && window.location.hash === '#follow-up') {
      document.getElementById('follow-up')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [loading])

  const handleAddFollowUp = async () => {
    if (!id || !newNote.trim()) {
      toast.error('请输入跟进内容')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await createFollowUp(
        id,
        newNote.trim(),
        contactType,
        user?.email ?? null,
      )
      setNewNote('')
      const [follows, inv] = await Promise.all([
        fetchFollowUps(id),
        fetchInvestorById(id),
      ])
      setFollowUps(follows)
      setInvestor(inv)
      toast.success('跟进记录已添加')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '添加失败'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <LoadingSpinner />
      </div>
    )
  }

  if (error && !investor) {
    return (
      <div className="page-shell">
        <div className="alert-error">{error}</div>
        <Link to="/clients" className="link-back mt-4">
          ← 返回列表
        </Link>
      </div>
    )
  }

  if (!investor) {
    return (
      <div className="page-shell">
        <div className="alert-error">投资人不存在</div>
        <Link to="/clients" className="link-back mt-4">
          ← 返回列表
        </Link>
      </div>
    )
  }

  if (denied) return <AccessDenied />

  const overdue = isOverdueContact(
    investor.last_contact_at,
    investor.after_sales_mode,
  )

  const profileFields = [
    { label: '等级', value: `${investor.grade} 级` },
    { label: '阶段', value: investor.stage },
    { label: '预算', value: formatCurrency(investor.budget) },
    { label: '已确认', value: formatCurrency(investor.confirmed_amount) },
    { label: '投资动机', value: investor.motivation },
    { label: '决策方式', value: investor.decision_type },
    { label: '来源', value: investor.source },
    {
      label: '引荐渠道',
      value: channel ? (
        <Link
          to={`/channels/${channel.id}`}
          className="text-[#C9A84C] hover:underline"
        >
          {channel.name}
        </Link>
      ) : (
        investor.channel_id ? '—' : '—'
      ),
    },
    { label: '负责人', value: investor.owner },
    { label: '下一步行动', value: investor.next_action },
    { label: '截止日期', value: formatDate(investor.deadline) },
    { label: '最后联系', value: formatDateTime(investor.last_contact_at) },
    { label: '备注', value: investor.notes },
  ]

  return (
    <div className="page-shell">
      <Link to="/investors" className="link-back">
        <ArrowLeft size={16} />
        返回列表
      </Link>

      <PageHeader
        title={investor.name}
        description={`${investor.stage} · 预算 ${formatCurrency(investor.budget)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={`/matching/demands/new?investorId=${investor.id}`}>
              <Button variant="accent">
                <Sparkles size={16} />
                创建需求单
              </Button>
            </Link>
            <Link to={`/investors/${investor.id}/edit`}>
              <Button variant="secondary">
                <Pencil size={16} />
                编辑
              </Button>
            </Link>
          </div>
        }
      />

      {overdue && (
        <div className="mb-6 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-500">
          <AlertTriangle size={16} className="shrink-0" />
          {investor.after_sales_mode
            ? `售后跟进：已超过 ${AFTER_SALES_REMINDER_DAYS} 天未联系，请安排回访`
            : `已超过 ${settings.followUpReminderDays} 天未联系，请优先跟进`}
        </div>
      )}

      {investor.is_closed_client && (
        <div className="mb-6 flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
          已成交客户
          {investor.after_sales_mode ? ' · 售后跟进模式' : ''}
        </div>
      )}

      {error && <div className="alert-error mb-4">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="card p-6 xl:col-span-1">
          <h2 className="section-label mb-4">投资人画像</h2>
          <div className="mb-4">
            <GradeBadge grade={investor.grade} />
          </div>
          <dl className="space-y-4">
            {profileFields.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-gray-500 mb-0.5">{label}</dt>
                <dd className="text-sm text-[#1A1A2A]">{value || '—'}</dd>
              </div>
            ))}
          </dl>
        </section>

        <AiAnalysisPanel
          title="AI 投资分析"
          description="分析投资人画像、适配资产类型（土地/物件/酒店）及匹配方向"
          onAnalyze={() =>
            analyzeInvestor(investor, {
              followUps,
              demands,
              contractCount: contracts.length,
            })
          }
          feedbackContext={{
            contextType: 'investor_analysis',
            entityType: 'investor',
            entityId: investor.id,
            createdBy: user?.email ?? null,
          }}
          taskContext={{ relatedType: 'investor', relatedId: investor.id }}
          className="xl:col-span-1"
        />

        <div id="follow-up">
        <FollowUpTimeline
          followUps={followUps}
          contactType={contactType}
          newNote={newNote}
          submitting={submitting}
          onContactTypeChange={setContactType}
          onNoteChange={setNewNote}
          onSubmit={handleAddFollowUp}
        />
        </div>
      </div>

      <section className="card p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-label flex items-center gap-2">
            <Sparkles size={16} className="text-[#C9A84C]" />
            投资需求与匹配
          </h2>
          <Link
            to={`/matching/demands/new?investorId=${investor.id}`}
            className="text-sm text-[#C9A84C] hover:underline"
          >
            + 新建需求
          </Link>
        </div>
        {demands.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            暂无需求单。创建后可自动匹配土地、物件、酒店及服务。
          </p>
        ) : (
          <div className="space-y-2">
            {demands.map((demand) => (
              <Link
                key={demand.id}
                to={`/matching/demands/${demand.id}`}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#C9A84C]/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-[#1A1A2A]">
                    {formatDemandTitle(demand)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {DEMAND_STATUS_LABELS[demand.status]} ·{' '}
                    {new Date(demand.updated_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <span className="text-sm text-[#C9A84C] shrink-0">匹配中心 →</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {contracts.length > 0 && (
        <RelatedLinksPanel
          title="关联合同"
          description="与该投资人相关的开发/运营/中介合同"
          items={contracts.map(contractToLinkItem)}
          className="mt-6"
        />
      )}

      <section className="card p-6 mt-6">
        <h2 className="section-label mb-4">阶段变化时间线</h2>
        <StageChangeTimeline logs={stageLogs} />
      </section>

      <NextStepBar
        actions={[
          {
            label: '创建需求单',
            to: `/matching/demands/new?investorId=${investor.id}`,
            variant: 'primary',
          },
          {
            label: '添加跟进',
            onClick: () =>
              document.getElementById('follow-up')?.scrollIntoView({ behavior: 'smooth' }),
            variant: 'secondary',
          },
        ]}
      />
    </div>
  )
}
