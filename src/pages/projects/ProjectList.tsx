import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Hammer, Plus, Search } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import { useCanWrite } from '@/hooks/useCanWrite'
import { useDataScope } from '@/hooks/useDataScope'
import { fetchProjects } from '@/services/projects'
import { PROJECT_STATUS_COLORS } from '@/config/projects'
import { formatAmountWan } from '@/utils/formatDisplay'
import type { Project } from '@/types/database'

export default function ProjectList() {
  const { canWrite } = useCanWrite()
  const { ownerId } = useDataScope()
  const [projects, setProjects] = useState<Project[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProjects(ownerId)
      .then(setProjects)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [ownerId])

  const filtered = projects.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.land?.name?.toLowerCase().includes(q) ||
      p.type.includes(search)
    )
  })

  return (
    <div className="page-shell">
      <PageHeader
        title="开发项目"
        description="土地上的酒店/公寓/办公等开发计划"
        actions={
          canWrite ? (
            <Link to="/projects/new">
              <Button>
                <Plus size={16} />
                新建项目
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="搜索项目名称、土地…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm"
        />
      </div>

      {loading && <LoadingSpinner />}
      {error && <div className="alert-error">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={Hammer}
          title="暂无开发项目"
          description="可从土地详情页「创建开发项目」，或在此新建"
          actionLabel={canWrite ? '新建项目' : undefined}
          actionTo={canWrite ? '/projects/new' : undefined}
        />
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="card p-4 block hover:border-[#C9A84C]/40 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-[#1A1A2A]">{project.name}</p>
                  {project.land && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      土地：{project.land.name}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${PROJECT_STATUS_COLORS[project.status]}`}
                >
                  {project.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                <span>{project.type}</span>
                {project.total_budget != null && (
                  <span>预算 {formatAmountWan(project.total_budget)}</span>
                )}
                {project.expected_completion && (
                  <span>预计竣工 {project.expected_completion}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
