import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'

export type NextStepAction = {
  label: string
  to?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'accent'
}

type NextStepBarProps = {
  actions: NextStepAction[]
}

export default function NextStepBar({ actions }: NextStepBarProps) {
  if (actions.length === 0) return null

  return (
    <div className="sticky bottom-0 z-10 -mx-4 sm:-mx-6 mt-8 px-4 sm:px-6 py-4 bg-white/95 backdrop-blur border-t border-gray-200">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
        下一步
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const variant = action.variant ?? 'primary'
          if (action.to) {
            return (
              <Link key={action.label} to={action.to}>
                <Button variant={variant}>{action.label}</Button>
              </Link>
            )
          }
          return (
            <Button key={action.label} variant={variant} onClick={action.onClick}>
              {action.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
