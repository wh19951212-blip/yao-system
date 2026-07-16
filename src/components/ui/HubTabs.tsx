export type HubTab = {
  id: string
  label: string
}

type HubTabsProps = {
  tabs: HubTab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export default function HubTabs({ tabs, active, onChange, className = '' }: HubTabsProps) {
  return (
    <div className={`flex items-center gap-1 card p-1 mb-6 w-fit ${className}`}>
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`px-4 py-2 rounded-md text-sm transition-all ${
            active === id
              ? 'bg-[#1B2B4B] text-white font-medium'
              : 'text-gray-500 hover:text-[#1B2B4B] hover:bg-gray-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
