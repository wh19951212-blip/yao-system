import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Pencil } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import ContractStatusBadge from '@/components/ui/ContractStatusBadge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useCanWrite } from '@/hooks/useCanWrite'
import { CONTRACT_KIND_LABELS } from '@/config/app'
import { getSignedFileUrl } from '@/services/storage'
import {
  fetchContractById,
  formatAmount,
  formatDate,
} from '@/services/contracts'
import type { Contract } from '@/types/database'

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>()
  const { canWrite } = useCanWrite()
  const [contract, setContract] = useState<Contract | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    fetchContractById(id)
      .then(async (row) => {
        setContract(row)
        if (row?.file_url) {
          try {
            setFileUrl(await getSignedFileUrl(row.file_url))
          } catch {
            setFileUrl(row.file_url)
          }
        }
      })
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

  if (error || !contract) {
    return (
      <div className="page-shell">
        <div className="alert-error">{error || '合同不存在'}</div>
        <Link to="/contracts" className="link-back mt-4">
          ← 返回列表
        </Link>
      </div>
    )
  }

  const kind = contract.contract_type
  const infoRows = [
    {
      label: '合同分类',
      value: kind ? CONTRACT_KIND_LABELS[kind] : contract.type,
    },
    ...(kind === 'broker'
      ? [{ label: '佣金', value: formatAmount(contract.commission_wan) }]
      : []),
    { label: '合同金额', value: formatAmount(contract.amount_wan) },
    { label: '签约日期', value: formatDate(contract.signed_date) },
    { label: '状态', value: <ContractStatusBadge status={contract.status} /> },
    { label: '备注', value: contract.notes },
  ]

  return (
    <div className="page-shell">
      <Link to="/contracts" className="link-back">
        <ArrowLeft size={16} />
        返回列表
      </Link>

      <PageHeader
        title={`${contract.type}合同`}
        description={formatDate(contract.signed_date)}
        actions={
          canWrite ? (
            <Link to={`/contracts/${contract.id}/edit`}>
              <Button variant="secondary">
                <Pencil size={16} />
                编辑
              </Button>
            </Link>
          ) : undefined
        }
      />

      <section className="card p-6 mb-8">
        <h2 className="section-label mb-4 flex items-center gap-2">
          <FileText size={16} />
          合同信息
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {infoRows.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-gray-500 mb-0.5">{label}</dt>
              <dd className="text-sm text-[#1A1A2A]">{value || '—'}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="section-label">关联对象</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
          {kind !== 'construction' && (
          <div>
            <p className="text-xs text-gray-500 mb-1">投资人</p>
            {contract.investor ? (
              <Link
                to={`/investors/${contract.investor.id}`}
                className="text-[#C9A84C] hover:underline"
              >
                {contract.investor.name}
              </Link>
            ) : (
              '—'
            )}
          </div>
          )}
          {kind === 'broker' && (
          <div>
            <p className="text-xs text-gray-500 mb-1">买家</p>
            {contract.buyer ? (
              <Link
                to={`/buyers/${contract.buyer.id}`}
                className="text-[#C9A84C] hover:underline"
              >
                {contract.buyer.name}
              </Link>
            ) : (
              '—'
            )}
          </div>
          )}
          {(kind === 'development' || kind === 'construction') && (
          <div>
            <p className="text-xs text-gray-500 mb-1">土地</p>
            {contract.land ? (
              <Link
                to={`/lands/${contract.land.id}`}
                className="text-[#C9A84C] hover:underline"
              >
                {contract.land.name}
              </Link>
            ) : (
              '—'
            )}
          </div>
          )}
          {kind === 'broker' && (
          <div>
            <p className="text-xs text-gray-500 mb-1">物件</p>
            {contract.property ? (
              <Link
                to={`/properties/${contract.property.id}`}
                className="text-[#C9A84C] hover:underline"
              >
                {contract.property.name}
              </Link>
            ) : (
              '—'
            )}
          </div>
          )}
          {kind === 'broker' && (
          <div>
            <p className="text-xs text-gray-500 mb-1">渠道中介</p>
            {contract.channel ? (
              <Link
                to={`/channels/${contract.channel.id}`}
                className="text-[#C9A84C] hover:underline"
              >
                {contract.channel.name}
              </Link>
            ) : (
              '—'
            )}
          </div>
          )}
          {kind === 'construction' && contract.builder && (
          <div>
            <p className="text-xs text-gray-500 mb-1">建筑商</p>
            <Link
              to={`/builders/${contract.builder.id}`}
              className="text-[#C9A84C] hover:underline"
            >
              {contract.builder.name}
            </Link>
          </div>
          )}
        </div>
        {fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-sm text-[#1B2B4B] hover:text-[#C9A84C]"
          >
            查看合同 PDF →
          </a>
        )}
      </section>
    </div>
  )
}
