import PageHeader from '@/components/ui/PageHeader'
import InvestorList from '@/pages/investors/InvestorList'

export default function ClientsHub() {
  return (
    <div className="page-shell">
      <PageHeader
        title="客户"
        description="投资人档案与买家客户，统一管理跟进与需求"
      />
      <InvestorList embedded hubMode />
    </div>
  )
}
