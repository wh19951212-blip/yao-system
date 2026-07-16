import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export type RelatedLinkItem = {
  id: string
  label: string
  path: string
  subtitle?: string
  badge?: string
}

type RelatedLinksPanelProps = {
  title: string
  description?: string
  items: RelatedLinkItem[]
  emptyText?: string
  action?: React.ReactNode
  className?: string
}

export default function RelatedLinksPanel({
  title,
  description,
  items,
  emptyText = '暂无关联记录',
  action,
  className = '',
}: RelatedLinksPanelProps) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-start justify-between gap-3">
        <div>
          <h2 className="section-label">{title}</h2>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {action}
      </div>
      {items.length === 0 ? (
        <p className="px-6 py-10 text-sm text-gray-500 text-center">{emptyText}</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A1A2A] group-hover:text-[#C9A84C] truncate">
                  {item.label}
                </p>
                {item.subtitle && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {item.subtitle}
                  </p>
                )}
              </div>
              {item.badge && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#1B2B4B]/5 text-[#1B2B4B] shrink-0">
                  {item.badge}
                </span>
              )}
              <ChevronRight
                size={16}
                className="text-gray-300 group-hover:text-[#C9A84C] shrink-0"
              />
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
