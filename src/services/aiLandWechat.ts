import { callClaude } from '@/services/ai'
import { getAppSettings, getContactLine } from '@/services/settings'
import type { Land } from '@/types/database'
import {
  calculateLandRoi,
  DEFAULT_LAND_ROI_INPUTS,
  formatManYen,
  formatSqm,
  formatYield,
  type LandRoiInputs,
  type LandRoiResult,
} from '@/utils/landRoiCalculator'
import { formatPercent } from '@/services/lands'

export function buildLandRoiSnapshot(
  land: Land,
  inputs?: Partial<LandRoiInputs>,
): { inputs: LandRoiInputs; result: LandRoiResult | null } {
  const merged: LandRoiInputs = {
    ...DEFAULT_LAND_ROI_INPUTS,
    landAreaSqm: land.area_sqm || DEFAULT_LAND_ROI_INPUTS.landAreaSqm,
    landPriceMan: land.price_wan || DEFAULT_LAND_ROI_INPUTS.landPriceMan,
    ...inputs,
  }
  return { inputs: merged, result: calculateLandRoi(merged) }
}

export async function generateWechatLandNote(
  land: Land,
  roiInputs?: Partial<LandRoiInputs>,
): Promise<string> {
  const { inputs, result } = buildLandRoiSnapshot(land, roiInputs)

  const roiBlock = result
    ? `总开发成本：${formatManYen(result.totalDevelopmentCostMan, 0)}
表面回报率：${formatYield(result.grossYieldPercent)}
净回报率：${formatYield(result.netYieldPercent)}
年净收入：${formatManYen(result.netIncomeMan, 0)}`
    : `简单回报率：${formatPercent(land.roi_percent)}
（详细开发测算参数已提供，请基于合理假设补充收益分析）`

  const { companyName } = getAppSettings()
  const contactLine = getContactLine('联系方式：')

  const prompt = `你是一名${companyName || '日本高端房地产投资'}顾问。请根据以下土地数据，生成一篇适合微信发送的项目推介笔记（中文）。

【土地信息】
项目名称：${land.name}
位置：${land.location}
面积：${formatSqm(land.area_sqm)}
土地价格：${land.price_wan.toLocaleString('zh-CN')} 万
容积率：${inputs.floorAreaRatio}
建蔽率：${inputs.buildingCoverageRatio}%
预期租金/简单回报：${land.expected_rent_wan != null ? `${land.expected_rent_wan} 万/年` : '—'}
法律状态：${land.legal_status ?? '—'}
备注：${land.description ?? '无'}

【回报率测算】
${roiBlock}

【输出格式要求】
请严格使用以下结构（保留 emoji，不要添加多余章节）：

📍项目名称
（一行项目名）

🏗️基本信息
位置：...
面积：...
容积率：...

💰收益分析
总成本：...
回报率：...
（基于上方数据，不要编造）

⏱️开发周期
（根据项目规模估算，如 18-24 个月）

✅项目亮点
1. ...
2. ...
3. ...

${contactLine}

语气专业、简洁，适合高净值投资人群微信阅读。`

  return callClaude(prompt, 1200)
}
