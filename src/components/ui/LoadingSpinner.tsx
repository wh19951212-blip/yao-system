import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  label?: string
  className?: string
  size?: number
}

export default function LoadingSpinner({
  label = '加载中...',
  className = '',
  size = 20,
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 text-gray-500 ${className}`}
    >
      <Loader2 size={size} className="animate-spin text-[#C9A84C]" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
