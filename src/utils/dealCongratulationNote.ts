import { getAppSettings, getContactLine } from '@/services/settings'
import { formatCurrency } from '@/services/investors'
import type { Investor } from '@/types/database'

export function buildDealCongratulationNote(investor: Investor) {
  const { companyName } = getAppSettings()
  const company = companyName || 'YAO Investment'

  return `🎉 恭喜 ${investor.name} 先生/女士！

非常荣幸与您携手完成本次投资合作。您的信任是我们最大的动力。

📋 合作概要
· 投资等级：${investor.grade} 级客户
· 确认金额：${formatCurrency(investor.confirmed_amount || investor.budget)}

${company} 团队将持续为您提供专业的售后跟进服务，确保您的资产稳健增值。

${getContactLine()}

期待与您开启更多优质投资机会！`
}
