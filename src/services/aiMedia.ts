import { callClaude } from '@/services/ai'
import { fetchLandById } from '@/services/lands'
import { fetchPropertyById } from '@/services/properties'

export interface XiaohongshuCopyResult {
  title: string
  body: string
  tags: string
  raw: string
}

interface GenerateXhsCopyParams {
  relatedType: '土地' | '项目' | '通用'
  relatedId?: string | null
  title?: string
}

function parseXhsResponse(raw: string): XiaohongshuCopyResult {
  const titleMatch = raw.match(/(?:标题[：:]\s*)(.+)/i)
  const tagsMatch = raw.match(/(?:话题[：:]\s*)([\s\S]+)$/i)

  let title = titleMatch?.[1]?.trim() ?? ''
  let tags = tagsMatch?.[1]?.trim() ?? ''

  if (!title) {
    const firstLine = raw.split('\n').find((l) => l.trim())
    title = firstLine?.replace(/^#+\s*/, '').trim() ?? '日本投资精选'
  }

  if (!tags) {
    const tagLine = raw.split('\n').find((l) => l.includes('#'))
    tags = tagLine?.trim() ?? '#日本投资 #东京房产 #高端置业 #资产配置 #酒店投资'
  }

  const bodyStart = raw.indexOf('\n', raw.indexOf(title))
  const bodyEnd = tagsMatch ? raw.indexOf(tagsMatch[0]) : raw.length
  let body = raw.slice(bodyStart, bodyEnd).trim()
  body = body.replace(/^正文[：:]\s*/i, '').trim()

  if (!body || body.length < 50) {
    body = raw
      .replace(/标题[：:].+/i, '')
      .replace(/话题[：:][\s\S]+$/i, '')
      .trim()
  }

  return { title, body, tags, raw }
}

export async function generateXiaohongshuCopy(
  params: GenerateXhsCopyParams,
): Promise<XiaohongshuCopyResult> {
  let context = ''

  if (params.relatedType === '土地' && params.relatedId) {
    const land = await fetchLandById(params.relatedId)
    context = `【关联土地】
名称：${land.name}
位置：${land.location}
面积：${land.area_sqm} ㎡
价格：${land.price_wan} 万
回报率：${land.roi_percent ?? '—'}%
状态：${land.status}
描述：${land.description ?? '无'}`
  } else if (params.relatedType === '项目' && params.relatedId) {
    const property = await fetchPropertyById(params.relatedId)
    context = `【关联项目/物件】
名称：${property.name}
位置：${property.location ?? '—'}
类型：${property.type}
价格：${property.price_wan ?? '—'} 万
描述：${property.description ?? '无'}`
  }

  const prompt = `你是一名日本高端房地产投资顾问，擅长撰写小红书（RED）种草文案。

请根据以下信息生成小红书文案（中文），要求：

1. 标题：带 1-2 个 emoji，吸引眼球，不超过 25 字
2. 正文：约 500 字，分段清晰，语气专业但有温度，适合高净值读者
3. 话题：恰好 5 个小红书话题标签（# 开头，空格分隔）
4. 不要编造不存在的数据，突出投资亮点与稀缺性

${params.title ? `素材标题参考：${params.title}\n` : ''}${context || '无具体关联项目，请生成日本高端房地产投资通用种草文案。'}

请严格按以下格式输出：

标题：（带emoji的标题）

正文：
（500字左右正文，可多段）

话题：（5个#标签，空格分隔）`

  const raw = await callClaude(prompt, 2000)
  return parseXhsResponse(raw)
}

export function formatXhsCopyForSave(result: XiaohongshuCopyResult) {
  return `【标题】\n${result.title}\n\n【正文】\n${result.body}\n\n【话题】\n${result.tags}`
}
