import { Construction } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

interface PlaceholderPageProps {
  title: string
  description?: string
}

export default function PlaceholderPage({
  title,
  description = '该模块正在开发中，敬请期待。',
}: PlaceholderPageProps) {
  return (
    <div className="page-shell">
      <PageHeader title={title} description={description} />
      <div className="card">
        <div className="card-body flex flex-col items-center justify-center py-24">
          <Construction size={48} className="text-gray-300 mb-4" strokeWidth={1.25} />
          <p className="text-gray-500 text-sm">功能开发中</p>
        </div>
      </div>
    </div>
  )
}
