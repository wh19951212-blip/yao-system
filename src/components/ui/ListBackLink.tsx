import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getListBackPath } from '@/hooks/useListFilters'

interface ListBackLinkProps {
  listKey: string
  basePath: string
  label?: string
}

export default function ListBackLink({
  listKey,
  basePath,
  label = '返回列表',
}: ListBackLinkProps) {
  return (
    <Link to={getListBackPath(listKey, basePath)} className="link-back">
      <ArrowLeft size={16} />
      {label}
    </Link>
  )
}
