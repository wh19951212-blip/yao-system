import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import ContractStatusBadge from '@/components/ui/ContractStatusBadge'
import { useDataScope } from '@/hooks/useDataScope'
import { useCanWrite } from '@/hooks/useCanWrite'
import { fetchInvestors } from '@/services/investors'
import ExportButton from '@/components/ui/ExportButton'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'
import EmptyState, { LIST_EMPTY_STATES } from '@/components/ui/EmptyState'
import { usePagination } from '@/hooks/usePagination'
import {
  fetchContracts,
  formatAmount,
  formatDate,
} from '@/services/contracts'
import { exportToExcel } from '@/utils/exportExcel'

export default function ContractList() {
  const { ownerEmail, isAdmin, isGuest } = useDataScope()
  const { canWrite } = useCanWrite()
  const [contracts, setContracts] = useState<Awaited<ReturnType<typeof fetchContracts>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        if (isAdmin || isGuest) {
          setContracts(await fetchContracts())
          return
        }
        const investors = await fetchInvestors('all', ownerEmail)
        setContracts(await fetchContracts(investors.map((item) => item.id)))
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [ownerEmail, isAdmin, isGuest])

  const { paginated, page, setPage, totalPages, total, pageSize } =
    usePagination(contracts)

  return (
    <div className="page-shell">
      <PageHeader
        title="合同管理"
        description="开发、中介、运营合同档案"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ExportButton
              disabled={contracts.length === 0}
              onClick={() =>
                exportToExcel(
                  `合同列表_${new Date().toISOString().slice(0, 10)}`,
                  [
                    '类型',
                    '投资人',
                    '土地',
                    '物件',
                    '金额(万)',
                    '佣金(万)',
                    '签约日',
                    '状态',
                  ],
                  contracts.map((c) => [
                    c.type,
                    c.investor?.name ?? '',
                    c.land?.name ?? '',
                    c.property?.name ?? '',
                    c.amount_wan ?? '',
                    c.commission_wan ?? '',
                    formatDate(c.signed_date),
                    c.status,
                  ]),
                )
              }
            />
            {canWrite && (
              <Link to="/contracts/new">
                <Button>
                  <Plus size={16} />
                  新增合同
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {error && <div className="alert-error mb-4">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : contracts.length === 0 ? (
        <div className="card">
          <EmptyState {...LIST_EMPTY_STATES.contracts} />
        </div>
      ) : (
        <>
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head">
                <th className="text-left px-5 py-3">类型</th>
                <th className="text-left px-4 py-3">关联投资人</th>
                <th className="text-left px-4 py-3">关联标的</th>
                <th className="text-right px-4 py-3">合同金额</th>
                <th className="text-right px-4 py-3">佣金</th>
                <th className="text-left px-4 py-3">签约日期</th>
                <th className="text-left px-4 py-3">状态</th>
                <th className="text-right px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((contract) => (
                  <tr key={contract.id} className="table-row">
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#1A1A2A]">
                        <FileText size={14} className="text-[#1B2B4B]" />
                        {contract.type}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {contract.investor ? (
                        <Link
                          to={`/investors/${contract.investor.id}`}
                          className="text-[#1A1A2A] hover:text-[#C9A84C]"
                        >
                          {contract.investor.name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-500">
                      {contract.land?.name ??
                        contract.property?.name ??
                        '—'}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-[#1B2B4B]">
                      {formatAmount(contract.amount_wan)}
                    </td>
                    <td className="px-4 py-4 text-right text-[#C9A84C]">
                      {formatAmount(contract.commission_wan)}
                    </td>
                    <td className="px-4 py-4 text-gray-500">
                      {formatDate(contract.signed_date)}
                    </td>
                    <td className="px-4 py-4">
                      <ContractStatusBadge status={contract.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      {contract.file_url && (
                        <a
                          href={contract.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-500 hover:text-[#1B2B4B] text-sm mr-3"
                        >
                          PDF
                        </a>
                      )}
                      <Link
                        to={`/contracts/${contract.id}`}
                        className="text-gray-500 hover:text-[#1A1A2A] text-sm mr-3"
                      >
                        详情
                      </Link>
                      {canWrite && (
                        <Link
                          to={`/contracts/${contract.id}/edit`}
                          className="text-[#1A1A2A] hover:text-[#C9A84C] text-sm font-medium"
                        >
                          编辑
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
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
