import { formatDisplayDate } from '@/utils/formatDisplay'

interface DateInputProps {
  id: string
  label?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
}

export default function DateInput({
  id,
  label,
  value,
  onChange,
  required,
  disabled,
}: DateInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-500">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={id}
        type="date"
        lang="zh-CN"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
      />
      {value && (
        <p className="text-xs text-gray-400">{formatDisplayDate(value)}</p>
      )}
    </div>
  )
}
