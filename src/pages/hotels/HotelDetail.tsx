import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import HotelStatusBadge from '@/components/ui/HotelStatusBadge'
import MonthlyRevenueChart from '@/components/hotels/MonthlyRevenueChart'
import {
  calcNoi,
  fetchHotelById,
  fetchHotelMonthlyReports,
  formatDate,
  reportLabel,
  upsertHotelMonthlyReport,
} from '@/services/hotels'
import type { Hotel, HotelMonthlyReport } from '@/types/database'

const currentYear = new Date().getFullYear()

export default function HotelDetail() {
  const { id } = useParams<{ id: string }>()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [reports, setReports] = useState<HotelMonthlyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [reportForm, setReportForm] = useState({
    year: String(currentYear),
    month: String(new Date().getMonth() + 1),
    occupancy_rate: '',
    revenue_wan: '',
    expense_wan: '',
  })

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [h, r] = await Promise.all([
        fetchHotelById(id),
        fetchHotelMonthlyReports(id),
      ])
      setHotel(h)
      setReports(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSubmitting(true)
    setError('')
    try {
      await upsertHotelMonthlyReport({
        hotel_id: id,
        year: Number(reportForm.year),
        month: Number(reportForm.month),
        occupancy_rate: reportForm.occupancy_rate
          ? Number(reportForm.occupancy_rate)
          : null,
        revenue_wan: reportForm.revenue_wan
          ? Number(reportForm.revenue_wan)
          : null,
        expense_wan: reportForm.expense_wan
          ? Number(reportForm.expense_wan)
          : null,
      })
      const r = await fetchHotelMonthlyReports(id)
      setReports(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="page-shell text-gray-500 text-sm">加载中...</div>
  }

  if (error && !hotel) {
    return (
      <div className="page-shell">
        <div className="alert-error">{error}</div>
        <Link to="/hotels" className="link-back mt-4">
          ← 返回列表
        </Link>
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="page-shell">
        <div className="alert-error">酒店不存在</div>
        <Link to="/hotels" className="link-back mt-4">
          ← 返回列表
        </Link>
      </div>
    )
  }

  const infoRows = [
    { label: '位置', value: hotel.location },
    {
      label: '房间数',
      value: hotel.room_count?.toLocaleString('zh-CN') ?? null,
    },
    { label: '业主', value: hotel.owner_investor?.name },
    {
      label: '管理费率',
      value: hotel.management_fee_rate != null
        ? `${hotel.management_fee_rate}%`
        : null,
    },
    { label: '合同开始', value: formatDate(hotel.contract_start) },
    { label: '合同结束', value: formatDate(hotel.contract_end) },
    { label: '备注', value: hotel.notes },
  ]

  const previewNoi = calcNoi(
    reportForm.revenue_wan ? Number(reportForm.revenue_wan) : null,
    reportForm.expense_wan ? Number(reportForm.expense_wan) : null,
  )

  const totalRevenue = reports.reduce(
    (sum, r) => sum + (r.revenue_wan ?? 0),
    0,
  )
  const totalNoi = reports.reduce(
    (sum, r) => sum + (calcNoi(r.revenue_wan, r.expense_wan) ?? 0),
    0,
  )

  return (
    <div className="page-shell">
      <Link to="/hotels" className="link-back">
        <ArrowLeft size={16} />
        返回列表
      </Link>

      <PageHeader
        title={hotel.name}
        description={hotel.location ?? '酒店详情与月度收益'}
        actions={
          <Link to={`/hotels/${hotel.id}/edit`}>
            <Button variant="secondary">
              <Pencil size={16} />
              编辑
            </Button>
          </Link>
        }
      />

      <div className="flex items-center gap-3 mb-8">
        <HotelStatusBadge status={hotel.status} />
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <section className="card p-6 lg:col-span-1">
          <h2 className="section-label mb-4">基本信息</h2>
          <dl className="space-y-4">
            {infoRows.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-gray-500 mb-0.5">{label}</dt>
                <dd className="text-sm text-[#1A1A2A]">{value || '—'}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="card p-6 lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="section-label">月度收益趋势</h2>
              <p className="text-xs text-gray-500 mt-1">
                累计营业额 {totalRevenue.toLocaleString('zh-CN')} 万 · 累计 NOI{' '}
                {totalNoi.toLocaleString('zh-CN')} 万
              </p>
            </div>
          </div>
          <MonthlyRevenueChart reports={reports} />
        </section>
      </div>

      <section className="card p-6 mb-8">
        <h2 className="section-label mb-4">录入月度数据</h2>
        <form
          onSubmit={handleSaveReport}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end"
        >
          <Input
            id="year"
            label="年份"
            type="number"
            min="2020"
            max="2100"
            value={reportForm.year}
            onChange={(e) =>
              setReportForm((p) => ({ ...p, year: e.target.value }))
            }
            required
          />
          <Input
            id="month"
            label="月份"
            type="number"
            min="1"
            max="12"
            value={reportForm.month}
            onChange={(e) =>
              setReportForm((p) => ({ ...p, month: e.target.value }))
            }
            required
          />
          <Input
            id="occupancy_rate"
            label="入住率（%）"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={reportForm.occupancy_rate}
            onChange={(e) =>
              setReportForm((p) => ({ ...p, occupancy_rate: e.target.value }))
            }
          />
          <Input
            id="revenue_wan"
            label="营业额（万）"
            type="number"
            min="0"
            step="0.01"
            value={reportForm.revenue_wan}
            onChange={(e) =>
              setReportForm((p) => ({ ...p, revenue_wan: e.target.value }))
            }
          />
          <Input
            id="expense_wan"
            label="运营成本（万）"
            type="number"
            min="0"
            step="0.01"
            value={reportForm.expense_wan}
            onChange={(e) =>
              setReportForm((p) => ({ ...p, expense_wan: e.target.value }))
            }
          />
          <div>
            {previewNoi != null && (
              <p className="text-xs text-gray-500 mb-1">
                预估 NOI：<span className="text-[#C9A84C] font-semibold">{previewNoi} 万</span>
              </p>
            )}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </section>

      {reports.length > 0 && (
        <section className="table-wrap">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-[#1B2B4B]">月度明细</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-head">
                  <th className="text-left px-5 py-3">月份</th>
                  <th className="text-right px-4 py-3">入住率</th>
                  <th className="text-right px-4 py-3">营业额（万）</th>
                  <th className="text-right px-4 py-3">运营成本（万）</th>
                  <th className="text-right px-5 py-3">NOI（万）</th>
                </tr>
              </thead>
              <tbody>
                {[...reports]
                  .sort(
                    (a, b) =>
                      b.year * 12 + b.month - (a.year * 12 + a.month),
                  )
                  .map((report) => (
                    <tr key={report.id} className="table-row">
                      <td className="px-5 py-4 text-[#1A1A2A]">
                        {reportLabel(report)}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-500">
                        {report.occupancy_rate != null
                          ? `${report.occupancy_rate}%`
                          : '—'}
                      </td>
                      <td className="px-4 py-4 text-right text-[#1A1A2A]">
                        {report.revenue_wan?.toLocaleString('zh-CN') ?? '—'}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-500">
                        {report.expense_wan?.toLocaleString('zh-CN') ?? '—'}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-emerald-500">
                        {calcNoi(report.revenue_wan, report.expense_wan)?.toLocaleString(
                          'zh-CN',
                        ) ?? '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
