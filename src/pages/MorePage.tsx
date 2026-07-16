import { Link } from 'react-router-dom'
import {
  FileText,
  FolderOpen,
  HardHat,
  Hotel,
  Settings,
} from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

const MORE_MODULES = [
  {
    path: '/builders',
    label: '建筑商',
    description: '施工合作、报价与产能管理',
    icon: HardHat,
  },
  {
    path: '/hotels',
    label: '酒店',
    description: '运营项目、月度报表与收益预测',
    icon: Hotel,
  },
  {
    path: '/contracts',
    label: '合同',
    description: '开发/中介/运营合同与佣金',
    icon: FileText,
  },
  {
    path: '/media',
    label: '素材库',
    description: '小红书、微信等营销内容',
    icon: FolderOpen,
  },
  {
    path: '/settings',
    label: '系统设置',
    description: '提醒、权限与业务偏好',
    icon: Settings,
  },
] as const

export default function MorePage() {
  return (
    <div className="page-shell">
      <PageHeader
        title="更多功能"
        description="建筑商、酒店、合同、素材与系统设置"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MORE_MODULES.map(({ path, label, description, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className="card p-6 hover:border-[#C9A84C]/40 transition-colors flex gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-[#1B2B4B]/5 flex items-center justify-center shrink-0">
              <Icon size={22} className="text-[#C9A84C]" />
            </div>
            <div>
              <p className="font-medium text-[#1A1A2A]">{label}</p>
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
