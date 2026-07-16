import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import AmountInput from '@/components/ui/AmountInput'
import DateInput from '@/components/ui/DateInput'
import { useAuth } from '@/contexts/AuthContext'
import { useDataScope } from '@/hooks/useDataScope'
import { useToast } from '@/contexts/ToastContext'
import { fetchLandById } from '@/services/lands'
import { createProject, fetchProjectById, updateProject } from '@/services/projects'
import {
  PROJECT_STATUSES,
  PROJECT_TYPES,
  type ProjectStatus,
  type ProjectType,
} from '@/config/projects'

const emptyForm = {
  name: '',
  land_id: '',
  type: '酒店' as ProjectType,
  status: '规划' as ProjectStatus,
  start_date: '',
  expected_completion: '',
  actual_completion: '',
  total_budget: '',
  notes: '',
}

export default function ProjectForm() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { ownerId } = useDataScope()
  const toast = useToast()

  const [form, setForm] = useState(emptyForm)
  const [landName, setLandName] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit || !searchParams.get('landId')) return
    const landId = searchParams.get('landId')!
    setForm((prev) => ({ ...prev, land_id: landId }))
    fetchLandById(landId)
      .then((land) => {
        if (land) {
          setLandName(land.name)
          setForm((prev) => ({
            ...prev,
            name: prev.name || `${land.name} 开发项目`,
          }))
        }
      })
      .catch(() => {})
  }, [isEdit, searchParams])

  useEffect(() => {
    if (!id) return
    fetchProjectById(id)
      .then((project) => {
        if (!project) {
          setError('项目不存在')
          return
        }
        setForm({
          name: project.name,
          land_id: project.land_id ?? '',
          type: project.type,
          status: project.status,
          start_date: project.start_date ?? '',
          expected_completion: project.expected_completion ?? '',
          actual_completion: project.actual_completion ?? '',
          total_budget:
            project.total_budget != null ? String(project.total_budget) : '',
          notes: project.notes ?? '',
        })
        setLandName(project.land?.name ?? '')
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('请填写项目名称')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        land_id: form.land_id || null,
        type: form.type,
        status: form.status,
        start_date: form.start_date || null,
        expected_completion: form.expected_completion || null,
        actual_completion: form.actual_completion || null,
        total_budget: form.total_budget ? Number(form.total_budget) : null,
        notes: form.notes || null,
        owner_id: ownerId ?? profile?.id ?? null,
      }
      if (isEdit && id) {
        await updateProject(id, payload)
        toast.success('项目已更新')
        navigate(`/projects/${id}`)
      } else {
        const created = await createProject(payload)
        toast.success('开发项目已创建')
        navigate(`/projects/${created.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="page-shell text-gray-500">加载中...</div>
  }

  const backTo = form.land_id ? `/lands/${form.land_id}` : '/lands'

  return (
    <div className="page-shell max-w-2xl">
      <Link to={backTo} className="link-back">
        <ArrowLeft size={16} />
        返回
      </Link>
      <PageHeader
        title={isEdit ? '编辑开发项目' : '创建开发项目'}
        description={landName ? `关联土地：${landName}` : undefined}
      />
      {error && <div className="alert-error mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <Input label="项目名称" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        <Select
          id="project_type"
          label="项目类型"
          value={form.type}
          onChange={(e) => set('type', e.target.value)}
          options={PROJECT_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <Select
          id="project_status"
          label="项目状态"
          value={form.status}
          onChange={(e) => set('status', e.target.value)}
          options={PROJECT_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DateInput id="start_date" label="开工日期" value={form.start_date} onChange={(v) => set('start_date', v)} />
          <DateInput id="expected_completion" label="预计竣工" value={form.expected_completion} onChange={(v) => set('expected_completion', v)} />
        </div>
        <DateInput id="actual_completion" label="实际竣工" value={form.actual_completion} onChange={(v) => set('actual_completion', v)} />
        <AmountInput id="total_budget" label="总预算（万）" value={form.total_budget} onChange={(v) => set('total_budget', v)} />
        <Textarea label="备注" value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={4} />
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? '保存中...' : isEdit ? '保存' : '创建项目'}
          </Button>
          <Link to={isEdit && id ? `/projects/${id}` : backTo}>
            <Button variant="secondary" type="button">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
