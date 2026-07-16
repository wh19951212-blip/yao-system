import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import EmptyState, { LIST_EMPTY_STATES } from '@/components/ui/EmptyState'
import { useCanWrite } from '@/hooks/useCanWrite'
import { formatBuyerBudget } from '@/services/buyers'
import type { Buyer } from '@/types/database'

type BuyerListPanelProps = {
  buyers: Buyer[]
  paginated: Buyer[]
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  filteredEmpty: boolean
}

export default function BuyerListPanel({
  buyers,
  paginated,
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  filteredEmpty,
}: BuyerListPanelProps) {
  const { canWrite } = useCanWrite()

  if (buyers.length === 0) {
    return (
      <div className="card">
        <EmptyState {...LIST_EMPTY_STATES.buyers} />
      </div>
    )
  }

  if (filteredEmpty) {
    return (
      <div className="card">
        <EmptyState
          title="未找到匹配的买家"
          description="试试调整搜索关键词"
        />
      </div>
    )
  }

  return (
    <>
      {canWrite && (
        <div className="flex justify-end mb-4">
          <Link to="/buyers/new">
            <Button>
              <Plus size={16} />
              新增买家
            </Button>
          </Link>
        </div>
      )}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>预算</th>
                <th>偏好类型</th>
                <th>负责人</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {paginated.map((buyer) => (
                <tr key={buyer.id}>
                  <td>
                    <Link
                      to={`/buyers/${buyer.id}`}
                      className="font-medium text-[#1A1A2A] hover:text-[#C9A84C]"
                    >
                      {buyer.name}
                    </Link>
                  </td>
                  <td className="text-gray-600">
                    {formatBuyerBudget(buyer.budget_wan)}
                  </td>
                  <td className="text-gray-600">
                    {buyer.preferred_type ?? '—'}
                  </td>
                  <td className="text-gray-500">{buyer.owner ?? '—'}</td>
                  <td>
                    <Link
                      to={`/buyers/${buyer.id}`}
                      className="text-sm text-[#C9A84C] hover:underline"
                    >
                      详情 →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </>
  )
}
