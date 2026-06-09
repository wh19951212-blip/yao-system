import type { Investor } from '@/types/database'
import { buildLandRoiSnapshot } from '@/services/aiLandWechat'
import { createMediaAsset } from '@/services/media'
import { formatPercent } from '@/services/lands'
import { getAppSettings, getContactLine } from '@/services/settings'
import type { Land } from '@/types/database'
import {
  formatManYen,
  formatSqm,
  formatYield,
  type LandRoiInputs,
} from '@/utils/landRoiCalculator'

export type WechatNoteTemplate = 'standard' | 'simple' | 'investor'

function buildHighlights(land: Land, netYield: number | null): string[] {
  const highlights: string[] = []

  if (land.location) {
    highlights.push(`${land.location}核心地段，区位稀缺`)
  }
  if (land.area_sqm >= 200) {
    highlights.push(`总建面 ${formatSqm(land.area_sqm)}，规模适中便于开发`)
  } else if (land.area_sqm > 0) {
    highlights.push(`土地面积 ${formatSqm(land.area_sqm)}，开发灵活`)
  }
  if (netYield != null && netYield >= 5) {
    highlights.push(`净回报率 ${formatYield(netYield)}，收益表现稳健`)
  } else if (land.roi_percent != null && land.roi_percent >= 5) {
    highlights.push(`预期回报率 ${formatPercent(land.roi_percent)}，现金流清晰`)
  }
  if (land.legal_status) {
    highlights.push(`法律状态：${land.legal_status}`)
  }
  if (land.expected_rent_wan) {
    highlights.push(
      `预期年净收入 ${land.expected_rent_wan.toLocaleString('zh-CN')}万`,
    )
  }

  while (highlights.length < 3) {
    const fallbacks = [
      '日本高端酒店/旅馆开发赛道，资产保值性强',
      '全流程开发管理，适合高净值资产配置',
      '东京圈优质土地区位，长期增值潜力明确',
    ]
    for (const item of fallbacks) {
      if (highlights.length >= 3) break
      if (!highlights.includes(item)) highlights.push(item)
    }
    break
  }

  return highlights.slice(0, 3)
}

function buildStandardNote(
  land: Land,
  roiInputs?: Partial<LandRoiInputs>,
): string {
  const { inputs, result } = buildLandRoiSnapshot(land, roiInputs)

  const totalCost = result
    ? formatManYen(result.totalDevelopmentCostMan, 0)
    : `${land.price_wan.toLocaleString('zh-CN')}万`
  const grossYield = result
    ? formatYield(result.grossYieldPercent)
    : formatPercent(land.roi_percent)
  const netYield = result
    ? formatYield(result.netYieldPercent)
    : formatPercent(land.roi_percent)

  const highlights = buildHighlights(
    land,
    result?.netYieldPercent ?? land.roi_percent,
  )

  return `📍【${land.name}】

🏗️位置：${land.location || '—'}
面积：${formatSqm(land.area_sqm)}
容积率：${inputs.floorAreaRatio}
建蔽率：${inputs.buildingCoverageRatio}%

💰总开发成本：${totalCost}
表面回报率：${grossYield}
净回报率：${netYield}

⏱️开发周期：13-15个月

✅亮点
1. ${highlights[0]}
2. ${highlights[1]}
3. ${highlights[2]}

${getContactLine()}`
}

function buildSimpleNote(
  land: Land,
  roiInputs?: Partial<LandRoiInputs>,
): string {
  const { result } = buildLandRoiSnapshot(land, roiInputs)
  const netYield = result
    ? formatYield(result.netYieldPercent)
    : formatPercent(land.roi_percent)
  const price = `${land.price_wan.toLocaleString('zh-CN')}万`

  return `📍 ${land.name}
📌 ${land.location || '—'} · ${formatSqm(land.area_sqm)}
💰 ${price} · 净回报 ${netYield}

${getContactLine()}`
}

function buildInvestorNote(
  land: Land,
  investor: Investor,
  roiInputs?: Partial<LandRoiInputs>,
): string {
  const { result } = buildLandRoiSnapshot(land, roiInputs)
  const netYield = result
    ? formatYield(result.netYieldPercent)
    : formatPercent(land.roi_percent)
  const { companyName } = getAppSettings()
  const company = companyName || 'Simon Investment'

  const focus =
    investor.motivation ||
    (investor.grade === 'S' || investor.grade === 'A'
      ? '稳健增值与资产保值'
      : '清晰回报与开发透明')

  return `${investor.name} 您好，

根据您的投资偏好（${focus}），为您精选以下项目：

📍【${land.name}】${land.location || ''}
面积 ${formatSqm(land.area_sqm)} · 预算 ${land.price_wan.toLocaleString('zh-CN')}万
净回报率 ${netYield}

${company} 团队已为您完成初步尽调，欢迎进一步沟通。

${getContactLine()}`
}

export function buildWechatLandNote(
  land: Land,
  roiInputs?: Partial<LandRoiInputs>,
  template: WechatNoteTemplate = 'standard',
  investor?: Investor | null,
): string {
  if (template === 'simple') return buildSimpleNote(land, roiInputs)
  if (template === 'investor' && investor) {
    return buildInvestorNote(land, investor, roiInputs)
  }
  return buildStandardNote(land, roiInputs)
}

export async function saveWechatNoteToMedia(
  land: Land,
  content: string,
  createdBy?: string | null,
) {
  return createMediaAsset({
    title: `微信笔记 · ${land.name}`,
    type: '文案',
    platform: '微信',
    related_type: '土地',
    related_id: land.id,
    content,
    status: '草稿',
    created_by: createdBy ?? null,
  })
}

export const WECHAT_TEMPLATE_OPTIONS = [
  { value: 'standard' as const, label: '标准版（完整信息）' },
  { value: 'simple' as const, label: '简版（核心数据）' },
  { value: 'investor' as const, label: '投资人定制版' },
]
