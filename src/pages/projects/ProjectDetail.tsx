import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useCanWrite } from '@/hooks/useCanWrite'
import { fetchProjectById } from '@/services/projects'
import { formatAmountWan } from '@/utils/formatDisplay'
import { PROJECT_STATUS_COLORS } from '@/config/projects'
import type { Project } from '@/types/database'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { canWrite } = useCanWrite()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    fetchProjectById(id)
      .then(setProject)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="page-shell">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="page-shell">
        <div className="alert-error">{error || '项目不存在'}</div>
      </div>
    )
  }

  const rows = [
    { label: '项目类型', value: project.type },
    {
      label: '状态',
      value: (
        <span className={`text-xs px-2 py-0.5 rounded ${PROJECT_STATUS_COLORS[project.status]}`}>
          {project.status}
        </span>
      ),
    },
    {
      label: '关联土地',
      value: project.land_id ? (
        <Link to={`/lands/${project.land_id}`} className="text-[#C9A84C] hover:underline">
          {project.land?.name ?? project.land_id}
        </Link>
      ) : '—',
    },
    { label: '开工日期', value: project.start_date ?? '—' },
    { label: '预计竣工', value: project.expected_completion ?? '—' },
    { label: '实际竣工', value: project.actual_completion ?? '—' },
    {
      label: '总预算',
      value: project.total_budget != null ? formatAmountWan(project.total_budget) : '—',
    },
    { label: '备注', value: project.notes ?? '—' },
  ]

  return (
    <div className="page-shell">
      <Link to={project.land_id ? `/lands/${project.land_id}` : '/lands'} className="link-back">
        <ArrowLeft size={16} />
        返回
      </Link>
      <PageHeader
        title={project.name}
        description="开发项目"
        actions={
          canWrite ? (
            <Link to={`/projects/${project.id}/edit`}>
              <Button variant="secondary">
                <Pencil size={16} />
                编辑
              </Button>
            </Link>
          ) : undefined
        }
      />
      <section className="card p-6">
        <dl className="space-y-4">
          {rows.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="text-sm text-[#1A1A2A] mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
