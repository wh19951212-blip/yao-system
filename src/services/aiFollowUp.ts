import type { FollowUp, Investor } from '@/types/database'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  isOverdueContact,
} from '@/services/investors'
import { getAppSettings } from '@/services/settings'
import { callClaude } from '@/services/ai'

function buildPrompt(investor: Investor, followUps: FollowUp[]) {
  const recentLogs = followUps
    .slice(0, 8)
    .map(
      (item) =>
        `- ${formatDateTime(item.created_at)} [${item.contact_type}] ${item.content}`,
    )
    .join('\n')

  const overdue = isOverdueContact(investor.last_contact_at)
  const followUpDays = getAppSettings().followUpReminderDays

  return `你是一名日本高端房地产投资管理公司的客户成功顾问。请根据以下投资人完整档案，生成专业、可执行的跟进建议（中文）。

【投资人档案】
姓名：${investor.name}
等级：${investor.grade} 级
阶段：${investor.stage}
预算：${formatCurrency(investor.budget)}
已确认：${formatCurrency(investor.confirmed_amount)}
投资动机：${investor.motivation ?? '未填写'}
决策方式：${investor.decision_type ?? '未填写'}
来源：${investor.source ?? '未填写'}
负责人：${investor.owner ?? '未填写'}
计划下一步：${investor.next_action ?? '未填写'}
截止日期：${formatDate(investor.deadline)}
最后联系：${formatDateTime(investor.last_contact_at)}${overdue ? `（⚠ 已超过${followUpDays}天未联系，需优先跟进）` : ''}
备注：${investor.notes ?? '无'}

【近期跟进记录】
${recentLogs || '暂无跟进记录'}

请严格按以下格式输出（不要省略任何章节标题）：

## 一、沟通策略
（根据当前阶段「${investor.stage}」，说明 2-3 条适合的沟通策略，每条一行）

## 二、跟进话术
（写一段可直接复制发送微信的完整话术，语气专业亲切，150字以内，不要用「您好我是XX」以外的过度寒暄）

## 三、下一步行动
（列出 2-3 条具体行动项，含时间节点建议）`
}

export async function fetchAiFollowUpSuggestion(
  investor: Investor,
  followUps: FollowUp[],
): Promise<string> {
  return callClaude(buildPrompt(investor, followUps), 1200)
}
