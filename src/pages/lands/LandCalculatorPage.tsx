import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import LandRoiCalculator from '@/components/lands/LandRoiCalculator'

export default function LandCalculatorPage() {
  return (
    <div className="page-shell">
      <Link to="/lands" className="link-back">
        <ArrowLeft size={16} />
        返回土地列表
      </Link>

      <PageHeader
        title="土地回报率计算器"
        description="基于容积率、建筑成本与酒店运营参数，测算开发回报率"
      />

      <LandRoiCalculator />
    </div>
  )
}
