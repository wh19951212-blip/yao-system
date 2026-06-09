import { useEffect, useMemo, useState } from 'react'
import { Calculator } from 'lucide-react'
import Input from '@/components/ui/Input'
import {
  calculateLandRoi,
  DEFAULT_LAND_ROI_INPUTS,
  formatManYen,
  formatSqm,
  formatYield,
  type LandRoiInputs,
} from '@/utils/landRoiCalculator'

interface LandRoiCalculatorProps {
  initialValues?: Partial<LandRoiInputs>
  onApplyNetYield?: (netYieldPercent: number, netIncomeMan: number) => void
  onInputsChange?: (inputs: LandRoiInputs) => void
  compact?: boolean
}

export default function LandRoiCalculator({
  initialValues,
  onApplyNetYield,
  onInputsChange,
  compact = false,
}: LandRoiCalculatorProps) {
  const [inputs, setInputs] = useState<LandRoiInputs>({
    ...DEFAULT_LAND_ROI_INPUTS,
    ...initialValues,
  })

  useEffect(() => {
    if (!initialValues) return
    setInputs((prev) => ({
      ...prev,
      ...(initialValues.landAreaSqm
        ? { landAreaSqm: initialValues.landAreaSqm }
        : {}),
      ...(initialValues.landPriceMan
        ? { landPriceMan: initialValues.landPriceMan }
        : {}),
    }))
  }, [initialValues?.landAreaSqm, initialValues?.landPriceMan])

  const result = useMemo(() => calculateLandRoi(inputs), [inputs])

  useEffect(() => {
    onInputsChange?.(inputs)
  }, [inputs, onInputsChange])

  const set = (key: keyof LandRoiInputs, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: Number(value) || 0 }))
  }

  const outputRows = result
    ? [
        { label: '建筑占地面积', value: formatSqm(result.buildingFootprintSqm), hint: '土地面积 × 建蔽率' },
        { label: '总延床面积', value: formatSqm(result.totalFloorAreaSqm), hint: '土地面积 × 容积率' },
        { label: '建筑总成本', value: formatManYen(result.constructionCostMan, 0), hint: '总延床面积 × 建筑成本单价' },
        { label: '项目管理费', value: formatManYen(result.projectManagementFeeMan, 0), hint: `建筑总成本 × ${inputs.projectManagementRate}%` },
        { label: '总开发成本', value: formatManYen(result.totalDevelopmentCostMan, 0), hint: '土地价格 + 建筑总成本 + 项目管理费', highlight: true },
        { label: '年收入营业额', value: formatManYen(result.annualRevenueMan, 0), hint: '客房单价 × 入住率 × 365 × 客室数' },
        { label: '运营成本', value: formatManYen(result.operatingCostMan, 0), hint: '年收入 × 35%' },
        { label: '年净收入', value: formatManYen(result.netIncomeMan, 0), hint: '年收入 − 运营成本' },
        { label: '表面回报率', value: formatYield(result.grossYieldPercent), hint: '年收入 ÷ 总开发成本', accent: true },
        { label: '净回报率', value: formatYield(result.netYieldPercent), hint: '年净收入 ÷ 总开发成本', accent: true },
      ]
    : []

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
        <Calculator size={18} className="text-[#C9A84C]" strokeWidth={1.75} />
        <h2 className="text-sm font-semibold text-[#1A1A2A]">回报率计算器</h2>
      </div>

      <div className={`p-6 grid gap-6 ${compact ? '' : 'lg:grid-cols-2'}`}>
        <div className="space-y-4">
          <p className="section-label">输入参数</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="calc_land_area" label="土地面积（㎡）" type="number" min="0" step="0.01" value={inputs.landAreaSqm || ''} onChange={(e) => set('landAreaSqm', e.target.value)} />
            <Input id="calc_far" label="容积率" type="number" min="0" step="0.01" value={inputs.floorAreaRatio || ''} onChange={(e) => set('floorAreaRatio', e.target.value)} />
            <Input id="calc_bcr" label="建蔽率（%）" type="number" min="0" max="100" step="0.1" value={inputs.buildingCoverageRatio || ''} onChange={(e) => set('buildingCoverageRatio', e.target.value)} />
            <Input id="calc_land_price" label="土地价格（万日元）" type="number" min="0" step="1" value={inputs.landPriceMan || ''} onChange={(e) => set('landPriceMan', e.target.value)} />
            <Input id="calc_construction" label="建筑成本（万/㎡）" type="number" min="0" step="0.1" value={inputs.constructionCostPerSqmMan || ''} onChange={(e) => set('constructionCostPerSqmMan', e.target.value)} />
            <Input id="calc_pm_rate" label="项目管理费率（%）" type="number" min="0" step="0.1" value={inputs.projectManagementRate || ''} onChange={(e) => set('projectManagementRate', e.target.value)} />
            <Input id="calc_room_rate" label="客房单价（日元/晚）" type="number" min="0" step="100" value={inputs.roomRateYen || ''} onChange={(e) => set('roomRateYen', e.target.value)} />
            <Input id="calc_occupancy" label="入住率（%）" type="number" min="0" max="100" step="0.1" value={inputs.occupancyRate || ''} onChange={(e) => set('occupancyRate', e.target.value)} />
            <Input id="calc_room_count" label="客室数（户）" type="number" min="0" step="1" value={inputs.roomCount || ''} onChange={(e) => set('roomCount', e.target.value)} />
          </div>
          <p className="text-xs text-gray-500">鉄骨造建筑成本参考：约 60–65 万/㎡</p>
        </div>

        <div>
          <p className="section-label mb-4">自动计算结果</p>
          {!result ? (
            <div className="text-sm text-gray-500 py-8 text-center">请填写有效参数后查看计算结果</div>
          ) : (
            <div className="space-y-3">
              {outputRows.map((row) => (
                <div
                  key={row.label}
                  className={`flex items-start justify-between gap-4 p-3 rounded-lg border ${
                    row.highlight
                      ? 'bg-[#C9A84C]/10 border-[#C9A84C]/30'
                      : row.accent
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-[#F7F8FA] border-gray-200'
                  }`}
                >
                  <div>
                    <p className="text-sm text-[#1A1A2A]">{row.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{row.hint}</p>
                  </div>
                  <p className={`text-sm font-semibold shrink-0 ${row.accent ? 'text-emerald-500' : 'text-[#1A1A2A]'}`}>
                    {row.value}
                  </p>
                </div>
              ))}

              {onApplyNetYield && (
                <button
                  type="button"
                  onClick={() => onApplyNetYield(result.netYieldPercent, result.netIncomeMan)}
                  className="w-full mt-2 btn-accent"
                >
                  应用净回报率到表单
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
