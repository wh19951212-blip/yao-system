import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import ChannelTierBadge from '@/components/ui/ChannelTierBadge'
import ChannelStatusBadge from '@/components/ui/ChannelStatusBadge'
import CommissionStatusBadge from '@/components/ui/CommissionStatusBadge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useCanWrite } from '@/hooks/useCanWrite'
import { useToast } from '@/contexts/ToastContext'
import {
  fetchChannelById,
  fetchChannelCommissions,
  fetchChannelReferrals,
  fetchChannelStats,
  formatCooperationTypes,
  formatCommission,
  formatDate,
  settleChannelCommission,
} from '@/services/channels'
import { resolveRelatedEntityPath } from '@/services/relations'
import type {
  Channel,
  ChannelCommission,
  ChannelReferrals,
  ChannelStats,
} from '@/types/database'

export default function ChannelDetail() {
  const { id } = useParams<{ id: string }>()
  const { canWrite } = useCanWrite()
  const toast = useToast()
  const [channel, setChannel] = useState<Channel | null>(null)
  const [stats, setStats] = useState<ChannelStats | null>(null)
  const [referrals, setReferrals] = useState<ChannelReferrals | null>(null)
  const [commissions, setCommissions] = useState<ChannelCommission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [settlingId, setSettlingId] = useState<string | null>(null)

  const load = async (channelId: string) => {
    const [ch, st, ref, comm] = await Promise.all([
      fetchChannelById(channelId),
      fetchChannelStats(channelId),
      fetchChannelReferrals(channelId),
      fetchChannelCommissions(channelId),
    ])
    setChannel(ch)
    setStats(st)
    setReferrals(ref)
    setCommissions(comm)
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    load(id)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSettle = async (commissionId: string) => {
    if (!id) return
    setSettlingId(commissionId)
    try {
      await settleChannelCommission(commissionId)
      toast.success('已标记为已结算')
      await load(id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setSettlingId(null)
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !channel || !stats || !referrals) {
    return (
      <div className="page-shell">
        <div className="alert-error">{error || '渠道不存在'}</div>
        <Link to="/channels" className="link-back mt-4">
          ← 返回列表
        </Link>
      </div>
    )
  }

  const infoRows = [
    { label: '主体类型', value: channel.entity_type },
    { label: '联系人', value: channel.contact_name },
    { label: '微信', value: channel.contact_wechat },
    { label: '电话', value: channel.contact_phone },
    { label: '区域', value: channel.region },
    {
      label: '合作范围',
      value: formatCooperationTypes(channel.cooperation_types),
    },
    {
      label: '默认佣金',
      value:
        channel.default_commission_rate != null
          ? `${channel.default_commission_rate}%`
          : null,
    },
    { label: '负责人', value: channel.owner },
    { label: '备注', value: channel.notes },
  ]

  const statCards = [
    { label: '引荐投资人', value: stats.investorCount },
    { label: '引荐买家', value: stats.buyerCount },
    { label: '代理物件', value: stats.propertyCount },
    { label: '关联合同', value: stats.contractCount },
    {
      label: '待结算佣金',
      value: formatCommission(stats.pendingCommissionWan),
      accent: true,
    },
    { label: '已结算佣金', value: formatCommission(stats.settledCommissionWan) },
  ]

  return (
    <div className="page-shell">
      <Link to="/channels" className="link-back">
        <ArrowLeft size={16} />
        返回列表
      </Link>

      <PageHeader
        title={channel.name}
        description={[channel.entity_type, channel.region]
          .filter(Boolean)
          .join(' · ')}
        actions={
          canWrite ? (
            <Link to={`/channels/${channel.id}/edit`}>
              <Button variant="secondary">
                <Pencil size={16} />
                编辑
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <ChannelTierBadge tier={channel.tier} />
        <ChannelStatusBadge status={channel.status} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="card p-4">
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p
              className={`text-lg font-semibold ${
                card.accent ? 'text-[#C9A84C]' : 'text-[#1A1A2A]'
              }`}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="card p-6 mb-8">
        <h2 className="section-label mb-4">基本信息</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {infoRows.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-gray-500 mb-0.5">{label}</dt>
              <dd className="text-sm text-[#1A1A2A]">{value || '—'}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="section-label">佣金结算</h2>
        </div>
        {commissions.length === 0 ? (
          <p className="px-6 py-10 text-sm text-gray-500 text-center">
            暂无佣金记录
          </p>
        ) : (
          <div className="table-wrap border-0 rounded-none">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-head">
                  <th className="text-left px-5 py-3">项目</th>
                  <th className="text-right px-4 py-3">合同金额</th>
                  <th className="text-right px-4 py-3">佣金</th>
                  <th className="text-left px-4 py-3">状态</th>
                  <th className="text-left px-4 py-3">结算日</th>
                  <th className="text-right px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((row) => {
                  const relatedPath = resolveRelatedEntityPath(
                    row.related_type,
                    row.related_id,
                  )
                  return (
                  <tr key={row.id} className="table-row">
                    <td className="px-5 py-4">
                      {relatedPath ? (
                        <Link
                          to={relatedPath}
                          className="text-[#1A1A2A] hover:text-[#C9A84C]"
                        >
                          {row.title ?? '—'}
                        </Link>
                      ) : (
                        row.title ?? '—'
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {formatCommission(row.amount_wan)}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-[#C9A84C]">
                      {formatCommission(row.commission_wan)}
                    </td>
                    <td className="px-4 py-4">
                      <CommissionStatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-4 text-gray-500">
                      {formatDate(row.settled_at)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {canWrite && row.status === '待结算' && (
                        <button
                          type="button"
                          onClick={() => handleSettle(row.id)}
                          disabled={settlingId === row.id}
                          className="text-sm text-[#1B2B4B] hover:text-[#C9A84C] font-medium"
                        >
                          {settlingId === row.id ? '处理中...' : '标记已结算'}
                        </button>
                      )}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReferralSection
          title="引荐投资人"
          empty="暂无关联投资人"
          items={referrals.investors.map((item) => ({
            id: item.id,
            href: `/investors/${item.id}`,
            label: item.name,
            sub: item.stage,
          }))}
        />
        <ReferralSection
          title="引荐买家"
          empty="暂无关联买家"
          items={referrals.buyers.map((item) => ({
            id: item.id,
            href: `/buyers/${item.id}`,
            label: item.name,
            sub: item.preferred_type ?? undefined,
          }))}
        />
        <ReferralSection
          title="代理物件"
          empty="暂无关联物件"
          items={referrals.properties.map((item) => ({
            id: item.id,
            href: `/properties/${item.id}`,
            label: item.name,
            sub: item.type,
          }))}
        />
        <ReferralSection
          title="关联合同"
          empty="暂无关联合同"
          items={referrals.contracts.map((item) => ({
            id: item.id,
            href: `/contracts/${item.id}`,
            label: `${item.type}合同`,
            sub: formatCommission(item.commission_wan),
          }))}
        />
      </div>
    </div>
  )
}

function ReferralSection({
  title,
  empty,
  items,
}: {
  title: string
  empty: string
  items: { id: string; href: string; label: string; sub?: string }[]
}) {
  return (
    <section className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="section-label">{title}</h2>
      </div>
      {items.length === 0 ? (
        <p className="px-6 py-8 text-sm text-gray-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={item.href}
                className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 text-sm"
              >
                <span className="font-medium text-[#1A1A2A]">{item.label}</span>
                {item.sub && (
                  <span className="text-gray-500 text-xs">{item.sub}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
