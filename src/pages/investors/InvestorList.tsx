import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Plus, Search } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import GradeBadge from '@/components/ui/GradeBadge'
import { useDataScope } from '@/hooks/useDataScope'
import { useSettings } from '@/contexts/SettingsContext'
import ExportButton from '@/components/ui/ExportButton'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'
import EmptyState, { LIST_EMPTY_STATES } from '@/components/ui/EmptyState'
import { useListFilters } from '@/hooks/useListFilters'
import { usePagination } from '@/hooks/usePagination'
import {
  fetchInvestors,
  formatCurrency,
  formatDateTime,
  isOverdueContact,
} from '@/services/investors'
import { exportToExcel } from '@/utils/exportExcel'
import { INVESTOR_GRADES, type InvestorGrade } from '@/config/app'
import type { Investor } from '@/types/database'

export default function InvestorList() {
  const { ownerEmail } = useDataScope()
  const { settings } = useSettings()
  const [investors, setInvestors] = useState<Investor[]>([])
  const [filters, setFilters] = useListFilters('investors', {
    grade: 'all',
    search: '',
  })
  const gradeFilter = filters.grade as InvestorGrade | 'all'
  const search = filters.search
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    fetchInvestors(gradeFilter, ownerEmail)
      .then(setInvestors)
      .catch((err) =>
        setError(err instanceof Error ? err.message : '加载失败'),
      )
      .finally(() => setLoading(false))
  }, [gradeFilter, ownerEmail])

  const filtered = investors.filter(
    (i) =>
      !search ||
      i.name.includes(search) ||
      i.source?.includes(search) ||
      i.owner?.includes(search),
  )

  const filterKey = `${gradeFilter}-${search}`
  const { paginated, page, setPage, totalPages, total, pageSize } =
    usePagination(filtered, undefined, filterKey)

  return (
    <div className="page-shell">
      <PageHeader
        title="投资人管理"
        description="管理投资人档案、跟进状态与等级分类"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ExportButton
              disabled={filtered.length === 0}
              onClick={() =>
                exportToExcel(
                  `投资人列表_${new Date().toISOString().slice(0, 10)}`,
                  [
                    '姓名',
                    '等级',
                    '阶段',
                    '预算(万)',
                    '已确认(万)',
                    '负责人',
                    '来源',
                    '最后联系',
                  ],
                  filtered.map((i) => [
                    i.name,
                    i.grade,
                    i.stage,
                    i.budget,
                    i.confirmed_amount,
                    i.owner ?? '',
                    i.source ?? '',
                    formatDateTime(i.last_contact_at),
                  ]),
                )
              }
            />
            <Link to="/investors/new">
              <Button>
                <Plus size={16} />
                新增投资人
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="搜索姓名、来源、负责人..."
            className="input-field pl-9"
          />
        </div>

        <div className="flex items-center gap-1 card p-1">
          {(['all', ...INVESTOR_GRADES] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() =>
                setFilters({ grade: g === 'all' ? 'all' : g })
              }
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                gradeFilter === g
                  ? 'bg-[#1B2B4B]/10 text-[#1B2B4B] font-medium'
                  : 'text-gray-500 hover:text-[#1B2B4B] hover:bg-gray-50'
              }`}
            >
              {g === 'all' ? '全部' : `${g} 级`}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : investors.length === 0 ? (
        <div className="card">
          <EmptyState {...LIST_EMPTY_STATES.investors} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="未找到匹配的投资人"
            description="试试调整搜索关键词或等级筛选"
          />
        </div>
      ) : (
        <>
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head">
                <th className="text-left px-5 py-3">姓名</th>
                <th className="text-left px-4 py-3">等级</th>
                <th className="text-left px-4 py-3">阶段</th>
                <th className="text-right px-4 py-3">预算（万）</th>
                <th className="text-left px-4 py-3">最后联系</th>
                <th className="text-right px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((investor) => {
                  const overdue = isOverdueContact(
                    investor.last_contact_at,
                    investor.after_sales_mode,
                  )
                  return (
                    <tr key={investor.id} className="table-row">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {overdue && (
                            <AlertTriangle
                              size={16}
                              className="text-red-500 shrink-0"
                              aria-label={`超过${settings.followUpReminderDays}天未联系`}
                            />
                          )}
                          <Link
                            to={`/investors/${investor.id}`}
                            className={`font-medium hover:text-[#C9A84C] transition-colors ${
                              overdue ? 'text-red-500' : 'text-[#1A1A2A]'
                            }`}
                          >
                            {investor.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <GradeBadge grade={investor.grade} />
                      </td>
                      <td className="px-4 py-4 text-[#1A1A2A]">
                        {investor.stage}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-[#1A1A2A]">
                        {formatCurrency(investor.budget)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={
                            overdue ? 'text-red-500' : 'text-gray-500'
                          }
                        >
                          {formatDateTime(investor.last_contact_at)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/investors/${investor.id}/edit`}
                          className="text-gray-500 hover:text-[#1A1A2A] text-sm mr-3"
                        >
                          编辑
                        </Link>
                        <Link
                          to={`/investors/${investor.id}`}
                          className="text-[#1A1A2A] hover:text-[#C9A84C] text-sm font-medium"
                        >
                          详情
                        </Link>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
        />
        </>
      )}
    </div>
  )
}
