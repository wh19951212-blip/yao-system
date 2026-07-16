import { useSearchParams } from 'react-router-dom'
import PageHeader from '@/components/ui/PageHeader'
import HubTabs from '@/components/ui/HubTabs'
import LandList from '@/pages/lands/LandList'
import PropertyList from '@/pages/properties/PropertyList'
import ProjectList from '@/pages/projects/ProjectList'

const TABS = [
  { id: 'lands', label: '土地' },
  { id: 'properties', label: '物件' },
  { id: 'projects', label: '开发项目' },
] as const

type AssetTab = (typeof TABS)[number]['id']

export default function AssetsHub() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: AssetTab =
    tabParam === 'properties' || tabParam === 'projects' ? tabParam : 'lands'

  const setTab = (id: string) => {
    if (id === 'lands') {
      setSearchParams({})
    } else {
      setSearchParams({ tab: id })
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="资产"
        description="土地、物件与开发项目；酒店从开发项目进入"
      />
      <HubTabs tabs={[...TABS]} active={tab} onChange={setTab} />
      {tab === 'lands' && <LandList embedded />}
      {tab === 'properties' && <PropertyList embedded />}
      {tab === 'projects' && <ProjectList embedded />}
    </div>
  )
}
