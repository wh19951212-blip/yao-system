import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  FileText,
  FolderOpen,
  HardHat,
  Hotel,
  Map,
  ShoppingBag,
  Users,
} from 'lucide-react'
import Button from '@/components/ui/Button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  actionTo?: string
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
}: EmptyStateProps) {
  return (
    <div className="py-16 px-6 text-center">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-[#1B2B4B]/5 border border-[#1B2B4B]/10 flex items-center justify-center mb-4">
        {Icon ? (
          <Icon size={28} className="text-[#C9A84C]" strokeWidth={1.5} />
        ) : (
          <span className="text-2xl text-[#C9A84C]">—</span>
        )}
      </div>
      <p className="text-base font-medium text-[#1A1A2A] mb-1">{title}</p>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mx-auto">{description}</p>
      )}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="inline-block mt-6">
          <Button>{actionLabel}</Button>
        </Link>
      )}
    </div>
  )
}

export const LIST_EMPTY_STATES = {
  investors: {
    icon: Users,
    title: '还没有投资人',
    description: '点击新增，开始管理您的投资人档案与跟进记录',
    actionLabel: '新增投资人',
    actionTo: '/investors/new',
  },
  lands: {
    icon: Map,
    title: '还没有土地项目',
    description: '录入第一块土地，开始跟踪审批与回报分析',
    actionLabel: '新增土地',
    actionTo: '/lands/new',
  },
  properties: {
    icon: Building2,
    title: '还没有物件',
    description: '添加待售物件，开启中介业务管理',
    actionLabel: '新增物件',
    actionTo: '/properties/new',
  },
  contracts: {
    icon: FileText,
    title: '还没有合同',
    description: '创建第一份合同，记录开发与中介业务',
    actionLabel: '新增合同',
    actionTo: '/contracts/new',
  },
  buyers: {
    icon: ShoppingBag,
    title: '还没有买家',
    description: '录入买家信息，匹配合适物件',
    actionLabel: '新增买家',
    actionTo: '/buyers/new',
  },
  hotels: {
    icon: Hotel,
    title: '还没有酒店项目',
    description: '添加酒店代运营项目，跟踪月度经营数据',
    actionLabel: '新增酒店',
    actionTo: '/hotels/new',
  },
  builders: {
    icon: HardHat,
    title: '还没有建筑商',
    description: '录入建筑商档案，管理报价与产能',
    actionLabel: '新增建筑商',
    actionTo: '/builders/new',
  },
  media: {
    icon: FolderOpen,
    title: '还没有素材',
    description: '保存微信笔记与小红书文案，统一管理营销内容',
    actionLabel: '新增素材',
    actionTo: '/media/new',
  },
} as const
