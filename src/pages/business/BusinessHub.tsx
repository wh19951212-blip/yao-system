import { useSearchParams } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import HubTabs from '@/components/ui/HubTabs'
import DemandList from '@/pages/matching/DemandList'
import ContractList from '@/pages/contracts/ContractList'
import ChannelList from '@/pages/channels/ChannelList'

const TABS = [
  { id: 'matching', label: '需求匹配' },
  { id: 'contracts', label: '合同' },
  { id: 'channels', label: '渠道' },
] as const

type BusinessTab = (typeof TABS)[number]['id']

export default function BusinessHub() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: BusinessTab =
    tabParam === 'contracts' || tabParam === 'channels' ? tabParam : 'matching'

  const setTab = (id: string) => {
    if (id === 'matching') {
      setSearchParams({})
    } else {
      setSearchParams({ tab: id })
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="业务"
        description="需求匹配、合同与渠道合作"
      />
      <HubTabs tabs={[...TABS]} active={tab} onChange={setTab} />
      {tab === 'matching' && <DemandList embedded />}
      {tab === 'contracts' && <ContractList embedded />}
      {tab === 'channels' && <ChannelList embedded />}
    </div>
  )
}
