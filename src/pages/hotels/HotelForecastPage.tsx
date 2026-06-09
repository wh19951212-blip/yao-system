import { useMemo, useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Input from '@/components/ui/Input'
import {
  calculateHotelForecast,
  DEFAULT_HOTEL_INPUTS,
  formatManFromYen,
  formatYen,
  type HotelForecastInputs,
} from '@/utils/hotelForecast'

export default function HotelForecastPage() {
  const [inputs, setInputs] = useState<HotelForecastInputs>(DEFAULT_HOTEL_INPUTS)
  const result = useMemo(() => calculateHotelForecast(inputs), [inputs])

  const set = (key: keyof HotelForecastInputs, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: Number(value) || 0 }))
  }

  return (
    <div className="page-shell">
      <PageHeader title="酒店收益试算" description="输入售价与运营参数，自动生成 12 个月收支预测" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-1 card p-6 space-y-4">
          <p className="section-label">输入参数</p>
          <Input id="sale_price" label="售价（万日元）" type="number" min="0" step="1" value={inputs.salePriceMan || ''} onChange={(e) => set('salePriceMan', e.target.value)} />
          <Input id="hotel_room_rate" label="客室单价（日元/晚）" type="number" min="0" step="100" value={inputs.roomRateYen || ''} onChange={(e) => set('roomRateYen', e.target.value)} />
          <Input id="hotel_room_count" label="客室数" type="number" min="0" step="1" value={inputs.roomCount || ''} onChange={(e) => set('roomCount', e.target.value)} />
          <Input id="hotel_occupancy" label="入住率（%）" type="number" min="0" max="100" step="0.1" value={inputs.occupancyRate || ''} onChange={(e) => set('occupancyRate', e.target.value)} />
          <p className="text-xs text-gray-500">运营成本按营业额 35% 估算（含运营、OTA、清扫、水电、杂费）</p>
        </div>

        {result && (
          <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: '年度总营业额', value: formatManFromYen(result.totalRevenueYen) },
              { label: '年度运营成本', value: formatManFromYen(result.totalOperatingCostYen) },
              { label: '年度 NOI', value: formatManFromYen(result.totalNoiYen), accent: true },
              { label: 'NOI 收益率', value: `${result.noiYieldPercent.toFixed(2)}%`, accent: true, span: true },
            ].map((item) => (
              <div
                key={item.label}
                className={`card p-5 ${item.span ? 'sm:col-span-3' : ''} ${item.accent ? 'border-[#C9A84C]/30 bg-[#C9A84C]/10' : ''}`}
              >
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className={`text-xl font-bold tracking-tight ${item.accent ? 'text-[#C9A84C]' : 'text-[#1B2B4B]'}`}>
                  {item.value}
                </p>
                {item.label === 'NOI 收益率' && (
                  <p className="text-xs text-gray-500 mt-1">年度 NOI ÷ 售价</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!result ? (
        <div className="card p-12 text-center text-gray-500 text-sm">请填写有效参数</div>
      ) : (
        <div className="table-wrap">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-[#1A1A2A]">12 个月收支预测</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-head">
                  <th className="text-left px-5 py-3">月份</th>
                  <th className="text-right px-4 py-3">天数</th>
                  <th className="text-right px-4 py-3">营业额（日元）</th>
                  <th className="text-right px-4 py-3">运营成本（日元）</th>
                  <th className="text-right px-4 py-3">NOI（日元）</th>
                  <th className="text-right px-5 py-3">累计 NOI（日元）</th>
                </tr>
              </thead>
              <tbody>
                {result.months.map((row) => (
                  <tr key={row.month} className="table-row">
                    <td className="px-5 py-4 text-[#1A1A2A]">{row.label}</td>
                    <td className="px-4 py-4 text-right text-gray-500">{row.days}</td>
                    <td className="px-4 py-4 text-right text-[#1A1A2A]">{formatYen(row.revenueYen)}</td>
                    <td className="px-4 py-4 text-right text-gray-500">{formatYen(row.operatingCostYen)}</td>
                    <td className="px-4 py-4 text-right text-emerald-500 font-medium">{formatYen(row.noiYen)}</td>
                    <td className="px-5 py-4 text-right text-[#1A1A2A] font-medium">{formatYen(row.cumulativeNoiYen)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-200 bg-[#F7F8FA] font-semibold">
                  <td className="px-5 py-4 text-[#1A1A2A]" colSpan={2}>合计</td>
                  <td className="px-4 py-4 text-right text-[#1A1A2A]">{formatYen(result.totalRevenueYen)}</td>
                  <td className="px-4 py-4 text-right text-gray-500">{formatYen(result.totalOperatingCostYen)}</td>
                  <td className="px-4 py-4 text-right text-emerald-500">{formatYen(result.totalNoiYen)}</td>
                  <td className="px-5 py-4 text-right text-[#1A1A2A]">{formatYen(result.totalNoiYen)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
