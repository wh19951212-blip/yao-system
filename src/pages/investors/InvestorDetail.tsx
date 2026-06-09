import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Bot, Pencil } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import CopyButton from '@/components/ui/CopyButton'
import GradeBadge from '@/components/ui/GradeBadge'
import FollowUpTimeline from '@/components/investors/FollowUpTimeline'
import StageChangeTimeline from '@/components/investors/StageChangeTimeline'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { useToast } from '@/contexts/ToastContext'
import AccessDenied from '@/components/ui/AccessDenied'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useOwnerAccess } from '@/hooks/useOwnerAccess'
import { fetchStageLogs } from '@/services/investorStageLogs'
import { fetchAiFollowUpSuggestion } from '@/services/aiFollowUp'
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
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [inv, follows, logs] = await Promise.all([
        fetchInvestorById(id),
        fetchFollowUps(id),
        fetchStageLogs(id),
      ])
      setInvestor(inv)
      setFollowUps(follows)
      setStageLogs(logs)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

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

  const handleAiSuggest = async () => {
    if (!investor) return
    setAiLoading(true)
    setAiError('')
    setAiSuggestion('')
    try {
      const suggestion = await fetchAiFollowUpSuggestion(investor, followUps)
      setAiSuggestion(suggestion)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI 分析失败')
    } finally {
      setAiLoading(false)
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
        <Link to="/investors" className="link-back mt-4">
          ← 返回列表
        </Link>
      </div>
    )
  }

  if (!investor) {
    return (
      <div className="page-shell">
        <div className="alert-error">投资人不存在</div>
        <Link to="/investors" className="link-back mt-4">
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
          <Link to={`/investors/${investor.id}/edit`}>
            <Button variant="secondary">
              <Pencil size={16} />
              编辑
            </Button>
          </Link>
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

        <section className="card p-6 xl:col-span-1">
          <div className="mb-4">
            <h2 className="section-label">AI 跟进建议</h2>
            <p className="text-xs text-gray-500 mt-1">
              Claude 分析 · 沟通策略 · 微信话术 · 下一步行动
            </p>
          </div>

          <Button
            variant="accent"
            onClick={handleAiSuggest}
            disabled={aiLoading}
            className="w-full mb-4"
          >
            <Bot size={16} />
            {aiLoading ? '生成中...' : 'AI 生成跟进建议'}
          </Button>

          {aiError && <div className="alert-error mb-4">{aiError}</div>}

          {aiLoading && (
            <div className="py-12 text-center text-sm text-gray-500">
              Claude 正在分析投资人档案...
            </div>
          )}

          {!aiLoading && aiSuggestion && (
            <>
              <div className="p-4 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 max-h-[360px] overflow-y-auto mb-4">
                <p className="text-sm text-[#1A1A2A] whitespace-pre-line leading-relaxed">
                  {aiSuggestion}
                </p>
              </div>
              <CopyButton text={aiSuggestion} className="w-full" />
            </>
          )}

          {!aiLoading && !aiSuggestion && !aiError && (
            <p className="text-sm text-gray-500 text-center py-8">
              点击上方按钮，获取针对当前投资人的 AI 跟进建议
            </p>
          )}
        </section>

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

      <section className="card p-6 mt-6">
        <h2 className="section-label mb-4">阶段变化时间线</h2>
        <StageChangeTimeline logs={stageLogs} />
      </section>
    </div>
  )
}
