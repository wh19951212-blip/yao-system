import { callClaude } from '@/services/ai'
import {
  buildSuccessCaseQueryFromDemand,
  buildSuccessCaseQueryFromInvestor,
  fetchSimilarSuccessCases,
  formatSuccessCasesForPrompt,
} from '@/services/aiLearning'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@/services/investors'
import { formatArea, formatPercent } from '@/services/lands'
import { formatPriceWan } from '@/services/properties'
import { formatAmountWan } from '@/utils/formatDisplay'
import {
  DEMAND_INTENT_LABELS,
  MATCH_TARGET_LABELS,
} from '@/config/matching'
import type {
  FollowUp,
  Investor,
  InvestorDemand,
  Land,
  MatchResult,
  MatchedInvestor,
  Property,
  PropertyInvestorMatch,
} from '@/types/database'

const ANALYSIS_FORMAT = `
请严格按以下格式输出（不要省略章节标题）：

## 一、核心判断
（2-3 句话概括关键结论）

## 二、优势与风险
（各 2-3 条要点）

## 三、匹配建议
（列出最适配的对象类型/方向，说明理由）

## 四、下一步行动
（2-3 条可执行建议）
`

export async function analyzeInvestor(
  investor: Investor,
  context?: {
    followUps?: FollowUp[]
    demands?: InvestorDemand[]
    contractCount?: number
  },
): Promise<string> {
  const recentLogs = (context?.followUps ?? [])
    .slice(0, 5)
    .map(
      (item) =>
        `- ${formatDateTime(item.created_at)} [${item.contact_type}] ${item.content}`,
    )
    .join('\n')

  const demandSummary = (context?.demands ?? [])
    .slice(0, 5)
    .map(
      (d) =>
        `- ${DEMAND_INTENT_LABELS[d.intent_type]} · 区域 ${d.preferred_regions.join('/') || '不限'} · 预算 ${d.budget_min_wan ?? 0}-${d.budget_max_wan ?? '∞'}万`,
    )
    .join('\n')

  const prompt = `你是日本高端房地产投资顾问。请分析以下投资人档案，重点评估其投资画像、适配资产类型（土地/物件/酒店）及匹配方向。不要写微信话术。

【类似历史成交案例】
${formatSuccessCasesForPrompt(await fetchSimilarSuccessCases(buildSuccessCaseQueryFromInvestor(investor, context?.demands)))}

【投资人】
姓名：${investor.name} · ${investor.grade}级 · 阶段：${investor.stage}
预算：${formatCurrency(investor.budget)} · 已确认：${formatCurrency(investor.confirmed_amount)}
动机：${investor.motivation ?? '—'} · 决策：${investor.decision_type ?? '—'}
来源：${investor.source ?? '—'} · 下一步：${investor.next_action ?? '—'}
截止：${formatDate(investor.deadline)} · 最后联系：${formatDateTime(investor.last_contact_at)}
备注：${investor.notes ?? '无'}
关联合同：${context?.contractCount ?? 0} 份

【需求单】
${demandSummary || '暂无'}

【近期跟进】
${recentLogs || '暂无'}
${ANALYSIS_FORMAT}`

  return callClaude(prompt, 1400)
}

export async function analyzeLand(
  land: Land,
  context?: {
    matchedInvestors?: MatchedInvestor[]
    quoteCount?: number
    downstreamCount?: number
  },
): Promise<string> {
  const investors = (context?.matchedInvestors ?? [])
    .slice(0, 6)
    .map(
      ({ investor }) =>
        `- ${investor.name}（${investor.grade}级 · ${investor.stage} · 预算 ${formatCurrency(investor.budget)}）`,
    )
    .join('\n')

  const prompt = `你是日本土地开发投资分析师。请分析以下地块的投资价值、开发路径及投资人匹配度。

【类似历史成交案例】
${formatSuccessCasesForPrompt(
  await fetchSimilarSuccessCases({
    regions: land.location ? [land.location] : [],
    target_type: 'land',
    budget_min_wan: land.price_wan ?? null,
    budget_max_wan: land.price_wan ?? null,
    limit: 3,
  }),
)}

【土地】
名称：${land.name}
位置：${land.location}
面积：${formatArea(land.area_sqm)} · 价格：${formatAmountWan(land.price_wan)}
预期租金：${land.expected_rent_wan != null ? `${formatAmountWan(land.expected_rent_wan)}/年` : '—'}
ROI：${formatPercent(land.roi_percent)} · 状态：${land.status}
法律：${land.legal_status ?? '—'}
说明：${land.description ?? '—'}

【意向投资人】${context?.matchedInvestors?.length ?? 0} 位
${investors || '暂无匹配'}

【项目链】建筑商报价 ${context?.quoteCount ?? 0} 条 · 下游资产 ${context?.downstreamCount ?? 0} 个
${ANALYSIS_FORMAT}`

  return callClaude(prompt, 1400)
}

export async function analyzeProperty(
  property: Property,
  context?: {
    investorMatches?: PropertyInvestorMatch[]
    landName?: string | null
    channelName?: string | null
  },
): Promise<string> {
  const investors = (context?.investorMatches ?? [])
    .slice(0, 6)
    .map(
      ({ investor, budgetMatch, isRecommended }) =>
        `- ${investor.name}（${investor.grade}级 · 预算 ${formatCurrency(investor.budget)}${budgetMatch ? ' · 预算匹配' : ''}${isRecommended ? ' · 已推荐' : ''}）`,
    )
    .join('\n')

  const prompt = `你是日本高端物件投资/销售分析师。请分析以下物件的价值定位、目标客群（投资人/买家）及匹配策略。

【类似历史成交案例】
${formatSuccessCasesForPrompt(
  await fetchSimilarSuccessCases({
    regions: property.location ? [property.location] : [],
    target_type: 'property',
    budget_min_wan: property.price_wan ?? null,
    budget_max_wan: property.price_wan ?? null,
    limit: 3,
  }),
)}

【物件】
名称：${property.name}
位置：${property.location ?? '—'} · 类型：${property.type}
来源：${property.source_type}${context?.landName ? ` · 上游土地：${context.landName}` : ''}${context?.channelName ? ` · 渠道：${context.channelName}` : ''}
价格：${formatPriceWan(property.price_wan)} · 佣金率：${property.commission_rate != null ? `${property.commission_rate}%` : '—'}
状态：${property.status}
描述：${property.description ?? '—'}

【匹配投资人】
${investors || '暂无'}
${ANALYSIS_FORMAT}`

  return callClaude(prompt, 1400)
}

export type MatchAnalysisItem = {
  resultId: string
  explanation: string
}

export async function analyzeMatchResults(
  demand: InvestorDemand,
  results: MatchResult[],
): Promise<{ summary: string; items: MatchAnalysisItem[] }> {
  const top = results.slice(0, 8)
  const resultLines = top
    .map(
      (r) =>
        `[${r.rank}] ${MATCH_TARGET_LABELS[r.target_type]} · ${r.target_name ?? r.target_id} · 得分 ${Math.round(r.score_total)} · 规则：${r.match_reasons.join('、') || '—'} · ${r.target_summary ?? ''}`,
    )
    .join('\n')

  const client =
    demand.investor?.name ?? demand.buyer?.name ?? '独立客户'

  const similarCases = formatSuccessCasesForPrompt(
    await fetchSimilarSuccessCases(buildSuccessCaseQueryFromDemand(demand)),
  )

  const prompt = `你是 YAO 投资系统的智能匹配分析师。需求单已通过规则引擎打分，请做 AI 二次解读。可参考历史成功案例，但不要照搬，需结合当前需求独立判断。

【类似历史成交案例】
${similarCases}

【需求】
客户：${client}
意图：${DEMAND_INTENT_LABELS[demand.intent_type]}
预算：${demand.budget_min_wan ?? 0} - ${demand.budget_max_wan ?? '∞'} 万
区域：${demand.preferred_regions.join('、') || '不限'}
类型：${demand.preferred_types.join('、') || '不限'}
ROI 要求：${demand.min_roi_percent != null ? `${demand.min_roi_percent}%` : '无'}
描述：${demand.raw_description ?? '—'}

【规则匹配结果 TOP${top.length}】
${resultLines || '无结果'}

请输出 JSON（仅 JSON，无 markdown）：
{
  "summary": "整体匹配判断，2-4 句话",
  "items": [
    { "rank": 1, "explanation": "该条结果的 AI 解读：为何适合/需注意什么，1-2 句话" }
  ]
}
items 数组需覆盖上述每条结果，rank 与结果序号一致。`

  const raw = await callClaude(prompt, 1800)
  const jsonText = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()

  try {
    const parsed = JSON.parse(jsonText) as {
      summary: string
      items: { rank: number; explanation: string }[]
    }
    const items: MatchAnalysisItem[] = top.map((r) => {
      const found = parsed.items.find((i) => i.rank === r.rank)
      return {
        resultId: r.id,
        explanation: found?.explanation ?? '暂无 AI 解读',
      }
    })
    return { summary: parsed.summary ?? '分析完成', items }
  } catch {
    return {
      summary: raw.slice(0, 500),
      items: top.map((r) => ({
        resultId: r.id,
        explanation: '解析失败，请重试',
      })),
    }
  }
}
