import { Link } from 'react-router-dom'
import {
  Building2,
  Calculator,
  FileText,
  Handshake,
  Hammer,
  ListTodo,
  Map,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { DEMO_IDS } from '@/data/demoFixtures'
import type { BusinessLine } from '@/config/navigation'
import { useBusinessLine } from '@/hooks/useBusinessLine'

const MODULES: {
  to: string
  label: string
  icon: typeof Users
  lines: BusinessLine[]
}[] = [
  { to: '/investors', label: '投资人', icon: Users, lines: ['development', 'brokerage', 'all'] },
  { to: '/matching/demands', label: '需求与匹配', icon: Sparkles, lines: ['development', 'brokerage', 'all'] },
  { to: '/lands', label: '土地', icon: Map, lines: ['development', 'all'] },
  { to: '/projects', label: '开发项目', icon: Hammer, lines: ['development', 'all'] },
  { to: '/properties', label: '物件', icon: Building2, lines: ['brokerage', 'all'] },
  { to: '/channels', label: '渠道', icon: Handshake, lines: ['brokerage', 'all'] },
  { to: '/tasks', label: '我的任务', icon: ListTodo, lines: ['development', 'brokerage', 'all'] },
]

const DEMO_CASES = [
  {
    to: `/investors/${DEMO_IDS.invWang}`,
    label: '王总 · S 级投资人',
    desc: '跟进、资金池、阶段管理',
  },
  {
    to: `/investors?tab=buyers`,
    label: '买家列表',
    desc: '购房偏好、预算与来源',
  },
  {
    to: `/lands/${DEMO_IDS.landShibuya}`,
    label: '涩谷区地块 A',
    desc: 'ROI 分析、审批流程',
  },
  {
    to: `/projects/${DEMO_IDS.projectShibuya}`,
    label: '涩谷酒店开发',
    desc: '开发项目进度',
  },
  {
    to: `/channels/${DEMO_IDS.channelTokyo}`,
    label: '东京渠道合作',
    desc: '引荐记录、佣金结算',
  },
  {
    to: `/contracts/${DEMO_IDS.contractBroker}`,
    label: '中介销售合同',
    desc: '买家成交、渠道佣金',
  },
  {
    to: '/lands/calculator',
    label: '土地 ROI 计算器',
    desc: '投资回报测算工具',
    icon: Calculator,
  },
  {
    to: '/hotels/forecast',
    label: '酒店收益预测',
    desc: '运营数据与现金流',
    icon: TrendingUp,
  },
] as const

export default function DashboardQuickNav() {
  const { businessLine } = useBusinessLine()
  const line = businessLine === 'all' ? null : businessLine

  return (
    <section className="space-y-6">
      <div>
        <h2 className="section-label mb-4">功能入口</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {MODULES.map(({ to, label, icon: Icon, lines }) => {
            const highlight = line && lines.includes(line)
            return (
              <Link
                key={to}
                to={to}
                className={`card p-4 transition-colors ${
                  highlight
                    ? 'border-[#C9A84C] bg-[#C9A84C]/5 ring-1 ring-[#C9A84C]/30'
                    : 'hover:border-[#C9A84C]/40'
                }`}
              >
                <Icon size={20} className="text-[#C9A84C] mb-2" />
                <p className="font-medium text-sm text-[#1A1A2A]">{label}</p>
              </Link>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="section-label mb-4">演示案例</h2>
        <p className="text-sm text-gray-500 mb-3">
          点击下方案例可直接查看完整业务流程演示
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DEMO_CASES.map((item) => {
            const Icon = 'icon' in item ? item.icon : FileText
            return (
              <Link
                key={item.to}
                to={item.to}
                className="card p-4 hover:border-[#C9A84C]/40 transition-colors flex gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-[#C9A84C]" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-[#1A1A2A]">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
