import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
import { fetchBuyers } from '@/services/buyers'
import { exportToExcel } from '@/utils/exportExcel'
import { INVESTOR_GRADES, type InvestorGrade } from '@/config/app'
import { useCanWrite } from '@/hooks/useCanWrite'
import ListMobileCards from '@/components/ui/ListMobileCards'
import BuyerListPanel from '@/pages/investors/BuyerListPanel'
import type { Investor } from '@/types/database'
import type { Buyer } from '@/types/database'

type ClientTab = 'investors' | 'buyers'

type InvestorListProps = {
  embedded?: boolean
  hubMode?: boolean
}

export default function InvestorList({
  embedded = false,
  hubMode = false,
}: InvestorListProps = {}) {
  const { ownerEmail } = useDataScope()
  const { canWrite } = useCanWrite()
  const { settings } = useSettings()
  const [searchParams, setSearchParams] = useSearchParams()
  const clientTab: ClientTab =
    searchParams.get('tab') === 'buyers' ? 'buyers' : 'investors'

  const [investors, setInvestors] = useState<Investor[]>([])
  const [buyers, setBuyers] = useState<Buyer[]>([])
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
    setError('')
    if (clientTab === 'buyers') {
      fetchBuyers(ownerEmail)
        .then(setBuyers)
        .catch((err) =>
          setError(err instanceof Error ? err.message : '加载失败'),
        )
        .finally(() => setLoading(false))
    } else {
      fetchInvestors(gradeFilter, ownerEmail)
        .then(setInvestors)
        .catch((err) =>
          setError(err instanceof Error ? err.message : '加载失败'),
        )
        .finally(() => setLoading(false))
    }
  }, [gradeFilter, ownerEmail, clientTab])

  const setClientTab = (tab: ClientTab) => {
    if (tab === 'buyers') {
      setSearchParams({ tab: 'buyers' })
    } else {
      setSearchParams({})
    }
  }

  const filteredInvestors = investors.filter(
    (i) =>
      !search ||
      i.name.includes(search) ||
      i.source?.includes(search) ||
      i.owner?.includes(search),
  )

  const filteredBuyers = buyers.filter(
    (b) =>
      !search ||
      b.name.includes(search) ||
      b.preferred_type?.includes(search) ||
      b.owner?.includes(search),
  )

  const filterKey = `${clientTab}-${gradeFilter}-${search}`
  const investorPagination = usePagination(filteredInvestors, undefined, filterKey)
  const buyerPagination = usePagination(filteredBuyers, undefined, filterKey)

  return (
    <div className={embedded ? undefined : 'page-shell'}>
      {!embedded && (
        <PageHeader
          title="客户"
          description="投资人档案与买家客户"
          actions={
            clientTab === 'investors' ? (
              <div className="flex flex-wrap items-center gap-2">
                <ExportButton
                  disabled={filteredInvestors.length === 0}
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
                      filteredInvestors.map((i) => [
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
                {canWrite && (
                  <Link to="/investors/new">
                    <Button>
                      <Plus size={16} />
                      新增投资人
                    </Button>
                  </Link>
                )}
              </div>
            ) : undefined
          }
        />
      )}

      {embedded && canWrite && clientTab === 'investors' && (
        <div className="flex justify-end mb-4">
          <Link to="/investors/new">
            <Button>
              <Plus size={16} />
              新建客户
            </Button>
          </Link>
        </div>
      )}

      <div className="flex items-center gap-1 card p-1 mb-6 w-fit">
        {(
          [
            { id: 'investors' as const, label: '投资人' },
            { id: 'buyers' as const, label: '买家' },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setClientTab(id)}
            className={`px-4 py-2 rounded-md text-sm transition-all ${
              clientTab === id
                ? 'bg-[#1B2B4B] text-white font-medium'
                : 'text-gray-500 hover:text-[#1B2B4B] hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

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
            placeholder={
              clientTab === 'buyers'
                ? '搜索买家姓名、偏好类型...'
                : '搜索姓名、来源、负责人...'
            }
            className="input-field pl-9"
          />
        </div>

        {clientTab === 'investors' && !hubMode && (
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
        )}
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : clientTab === 'buyers' ? (
        <BuyerListPanel
          buyers={buyers}
          paginated={buyerPagination.paginated}
          page={buyerPagination.page}
          totalPages={buyerPagination.totalPages}
          total={buyerPagination.total}
          pageSize={buyerPagination.pageSize}
          onPageChange={buyerPagination.setPage}
          filteredEmpty={buyers.length > 0 && filteredBuyers.length === 0}
          hubMode={hubMode}
        />
      ) : investors.length === 0 ? (
        <div className="card">
          <EmptyState {...LIST_EMPTY_STATES.investors} />
        </div>
      ) : filteredInvestors.length === 0 ? (
        <div className="card">
          <EmptyState
            title="未找到匹配的投资人"
            description="试试调整搜索关键词或等级筛选"
          />
        </div>
      ) : (
        <>
          <ListMobileCards
            items={investorPagination.paginated.map((investor) => {
              const overdue = isOverdueContact(
                investor.last_contact_at,
                investor.after_sales_mode,
              )
              return {
                id: investor.id,
                href: `/investors/${investor.id}`,
                title: investor.name,
                subtitle: investor.owner ?? investor.source ?? undefined,
                badge: <GradeBadge grade={investor.grade} />,
                fields: [
                  { label: '阶段', value: investor.stage },
                  { label: '预算', value: formatCurrency(investor.budget) },
                  {
                    label: '最后联系',
                    value: (
                      <span className={overdue ? 'text-red-500' : undefined}>
                        {formatDateTime(investor.last_contact_at)}
                      </span>
                    ),
                  },
                ],
              }
            })}
          />
          <div className="table-wrap hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-head">
                  <th className="text-left px-5 py-3">姓名</th>
                  <th className="text-left px-4 py-3">等级</th>
                  {hubMode ? (
                    <>
                      <th className="text-left px-4 py-3">最近联系</th>
                      <th className="text-left px-4 py-3">下一步</th>
                    </>
                  ) : (
                    <>
                      <th className="text-left px-4 py-3">阶段</th>
                      <th className="text-right px-4 py-3">预算（万）</th>
                      <th className="text-left px-4 py-3">最后联系</th>
                    </>
                  )}
                  <th className="text-right px-5 py-3">{hubMode ? '操作' : '操作'}</th>
                </tr>
              </thead>
              <tbody>
                {investorPagination.paginated.map((investor) => {
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
                      {hubMode ? (
                        <>
                          <td className="px-4 py-4">
                            <span className={overdue ? 'text-red-500' : 'text-gray-500'}>
                              {formatDateTime(investor.last_contact_at)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-gray-600 max-w-[200px] truncate">
                            {investor.next_action || investor.stage || '—'}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-4 text-[#1A1A2A]">
                            {investor.stage}
                          </td>
                          <td className="px-4 py-4 text-right font-medium text-[#1A1A2A]">
                            {formatCurrency(investor.budget)}
                          </td>
                          <td className="px-4 py-4">
                            <span className={overdue ? 'text-red-500' : 'text-gray-500'}>
                              {formatDateTime(investor.last_contact_at)}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="px-5 py-4 text-right">
                        {hubMode ? (
                          <Link to={`/investors/${investor.id}#follow-up`}>
                            <Button variant="secondary" className="text-xs px-3 py-1.5">
                              跟进
                            </Button>
                          </Link>
                        ) : (
                          <>
                            {canWrite && (
                              <Link
                                to={`/investors/${investor.id}/edit`}
                                className="text-gray-500 hover:text-[#1A1A2A] text-sm mr-3"
                              >
                                编辑
                              </Link>
                            )}
                            <Link
                              to={`/investors/${investor.id}`}
                              className="text-[#1A1A2A] hover:text-[#C9A84C] text-sm font-medium"
                            >
                              详情
                            </Link>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={investorPagination.page}
            totalPages={investorPagination.totalPages}
            total={investorPagination.total}
            pageSize={investorPagination.pageSize}
            onPageChange={investorPagination.setPage}
          />
        </>
      )}
    </div>
  )
}
