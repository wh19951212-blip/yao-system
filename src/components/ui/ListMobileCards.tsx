import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

type MobileCardField = {
  label: string
  value: ReactNode
}

export type MobileCardItem = {
  id: string
  href: string
  title: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  fields?: MobileCardField[]
  actions?: ReactNode
}

export default function ListMobileCards({ items }: { items: MobileCardItem[] }) {
  return (
    <div className="md:hidden space-y-3 mb-4">
      {items.map((item) => (
        <Link
          key={item.id}
          to={item.href}
          className="card block p-4 hover:border-[#C9A84C]/40 transition-colors"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <p className="font-medium text-[#1A1A2A] truncate">{item.title}</p>
              {item.subtitle && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">{item.subtitle}</p>
              )}
            </div>
            {item.badge}
          </div>
          {item.fields && item.fields.length > 0 && (
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {item.fields.map((field) => (
                <div key={field.label}>
                  <dt className="text-xs text-gray-500">{field.label}</dt>
                  <dd className="text-[#1A1A2A] font-medium">{field.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {item.actions && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex gap-3">
              {item.actions}
            </div>
          )}
        </Link>
      ))}
    </div>
  )
}
