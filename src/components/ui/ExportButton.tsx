import { Download } from 'lucide-react'
import Button from '@/components/ui/Button'

interface ExportButtonProps {
  onClick: () => void
  disabled?: boolean
  label?: string
}

export default function ExportButton({
  onClick,
  disabled,
  label = '导出 Excel',
}: ExportButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onClick}
      disabled={disabled}
      className="text-xs sm:text-sm"
    >
      <Download size={16} />
      {label}
    </Button>
  )
}
