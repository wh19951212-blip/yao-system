import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import AmountInput from '@/components/ui/AmountInput'
import DateInput from '@/components/ui/DateInput'
import ListBackLink from '@/components/ui/ListBackLink'
import ImageRecognitionUpload from '@/components/forms/ImageRecognitionUpload'
import DealClosedModal from '@/components/investors/DealClosedModal'
import { useAuth } from '@/contexts/AuthContext'
import {
  createInvestor,
  fetchInvestorById,
  updateInvestor,
} from '@/services/investors'
import {
  DECISION_TYPES,
  INVESTOR_GRADES,
  INVESTOR_STAGES,
  type DecisionType,
  type InvestorGrade,
  type InvestorStage,
} from '@/config/app'
import { mergeRecognizedFields } from '@/utils/formRecognition'
import { buildDealCongratulationNote } from '@/utils/dealCongratulationNote'
import { useToast } from '@/contexts/ToastContext'
import AccessDenied from '@/components/ui/AccessDenied'
import { useOwnerAccess } from '@/hooks/useOwnerAccess'
import { useDemoReadOnly } from '@/hooks/useDemoReadOnly'
import {
  firstError,
  requirePositiveNumber,
  requireTrimmed,
} from '@/utils/validation'
import ChannelPicker from '@/components/channels/ChannelPicker'
import { resolveSourceWithChannel, fetchChannelById } from '@/services/channels'
import { getSaveErrorMessage } from '@/utils/supabaseError'

const emptyForm = {
  name: '',
  grade: 'B' as InvestorGrade,
  stage: '认知阶段' as InvestorStage,
  budget: '',
  confirmed_amount: '',
  motivation: '',
  decision_type: '独立' as DecisionType,
  source: '',
  channel_id: '',
  owner: '',
  next_action: '',
  deadline: '',
  notes: '',
}

export default function InvestorForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [dealModalOpen, setDealModalOpen] = useState(false)
  const [dealInvestor, setDealInvestor] = useState<{
    id: string
    name: string
    note: string
  } | null>(null)
  const [recordOwner, setRecordOwner] = useState<string | null>(null)
  const { denied } = useOwnerAccess(isEdit ? recordOwner : user?.email)
  const { readOnly: demoReadOnly } = useDemoReadOnly(id)

  useEffect(() => {
    if (!id) return
    fetchInvestorById(id)
      .then((inv) => {
        setForm({
          name: inv.name,
          grade: inv.grade,
          stage: inv.stage as InvestorStage,
          budget: String(inv.budget),
          confirmed_amount: String(inv.confirmed_amount),
          motivation: inv.motivation ?? '',
          decision_type: (inv.decision_type as DecisionType) ?? '独立',
          source: inv.source ?? '',
          channel_id: inv.channel_id ?? '',
          owner: inv.owner ?? '',
          next_action: inv.next_action ?? '',
          deadline: inv.deadline ?? '',
          notes: inv.notes ?? '',
        })
        setRecordOwner(inv.owner)
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : '加载失败'),
      )
      .finally(() => setLoading(false))
  }, [id])

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const validationError = firstError(
      requireTrimmed(form.name, '姓名'),
      requirePositiveNumber(form.budget, '预算'),
    )
    if (validationError) {
      setError(validationError)
      toast.error(validationError)
      setSubmitting(false)
      return
    }

    let source = form.source.trim() || null
    if (form.channel_id) {
      try {
        const channel = await fetchChannelById(form.channel_id)
        source = resolveSourceWithChannel(channel, source)
      } catch {
        /* keep manual source */
      }
    }

    const payload = {
      name: form.name.trim(),
      grade: form.grade,
      stage: form.stage,
      budget: Number(form.budget) || 0,
      confirmed_amount: Number(form.confirmed_amount) || 0,
      motivation: form.motivation.trim() || null,
      decision_type: form.decision_type || null,
      channel_id: form.channel_id || null,
      source,
      owner: form.owner.trim() || user?.email || null,
      next_action: form.next_action.trim() || null,
      deadline: form.deadline || null,
      notes: form.notes.trim() || null,
    }

    try {
      if (isEdit && id) {
        const { investor, dealClosedTriggered } = await updateInvestor(
          id,
          payload,
          user?.email ?? undefined,
        )
        if (dealClosedTriggered) {
          setDealInvestor({
            id: investor.id,
            name: investor.name,
            note: buildDealCongratulationNote(investor),
          })
          setDealModalOpen(true)
          toast.success('投资人信息已保存')
          return
        }
        toast.success('投资人信息已保存')
        navigate('/investors')
      } else {
        const created = await createInvestor(
          { ...payload, last_contact_at: null },
          user?.email ?? undefined,
        )
        if (created.stage === '成交阶段') {
          setDealInvestor({
            id: created.id,
            name: created.name,
            note: buildDealCongratulationNote(created),
          })
          setDealModalOpen(true)
          toast.success('投资人已创建')
          return
        }
        toast.success('投资人已创建')
        navigate('/investors')
      }
    } catch (err) {
      const msg = getSaveErrorMessage(err)
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="page-shell text-gray-500 text-sm">加载中...</div>
  }

  if (isEdit && denied) return <AccessDenied />

  return (
    <div className="page-shell max-w-2xl">
      <ListBackLink listKey="investors" basePath="/investors" />

      <PageHeader
        title={isEdit ? '编辑投资人' : '新增投资人'}
        description="填写投资人基本信息与画像"
      />

      {demoReadOnly && (
        <div className="alert-info mb-4">
          演示案例为只读，无法保存。运行 supabase/seed_demo.sql 后可写入真实数据。
        </div>
      )}

      {error && <div className="alert-error mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <ImageRecognitionUpload
          formType="investor"
          onRecognized={(data) =>
            setForm((prev) => mergeRecognizedFields(prev, data))
          }
        />
        <Input
          id="name"
          label="姓名"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Select
            id="grade"
            label="等级"
            value={form.grade}
            onChange={(e) => set('grade', e.target.value)}
            options={INVESTOR_GRADES.map((g) => ({ value: g, label: `${g} 级` }))}
            required
          />
          <Select
            id="stage"
            label="阶段"
            value={form.stage}
            onChange={(e) => set('stage', e.target.value)}
            options={INVESTOR_STAGES.map((s) => ({ value: s, label: s }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <AmountInput
            id="budget"
            label="预算"
            value={form.budget}
            onChange={(v) => set('budget', v)}
            required
          />
          <AmountInput
            id="confirmed_amount"
            label="已确认"
            value={form.confirmed_amount}
            onChange={(v) => set('confirmed_amount', v)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            id="motivation"
            label="投资动机"
            value={form.motivation}
            onChange={(e) => set('motivation', e.target.value)}
            placeholder="如：要收益、做资产管理"
          />
          <Select
            id="decision_type"
            label="决策方式"
            value={form.decision_type}
            onChange={(e) => set('decision_type', e.target.value)}
            options={DECISION_TYPES.map((d) => ({ value: d, label: d }))}
          />
        </div>

        <ChannelPicker
          channelId={form.channel_id}
          source={form.source}
          onChannelChange={(channelId) => set('channel_id', channelId)}
          onSourceChange={(source) => set('source', source)}
          disabled={demoReadOnly}
        />

        <Input
          id="owner"
          label="负责人"
          value={form.owner}
          onChange={(e) => set('owner', e.target.value)}
          placeholder="内部跟进负责人"
        />

        <Input
          id="next_action"
          label="下一步行动"
          value={form.next_action}
          onChange={(e) => set('next_action', e.target.value)}
          placeholder="如：安排贷款经理沟通"
        />

        <DateInput
          id="deadline"
          label="截止日期"
          value={form.deadline}
          onChange={(v) => set('deadline', v)}
        />

        <Textarea
          id="notes"
          label="备注"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting || demoReadOnly}>
            {submitting ? '保存中...' : isEdit ? '保存修改' : '创建投资人'}
          </Button>
          <Link to="/investors">
            <Button variant="secondary">取消</Button>
          </Link>
        </div>
      </form>

      {dealInvestor && (
        <DealClosedModal
          open={dealModalOpen}
          investorId={dealInvestor.id}
          investorName={dealInvestor.name}
          congratulationNote={dealInvestor.note}
          onClose={() => {
            setDealModalOpen(false)
            navigate('/investors')
          }}
        />
      )}
    </div>
  )
}
