import { useEffect, useState } from 'react'
import {
  formatThousandsInput,
  parseFormattedNumber,
} from '@/utils/formatDisplay'

interface AmountInputProps {
  id: string
  label?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  disabled?: boolean
  suffix?: string
}

export default function AmountInput({
  id,
  label,
  value,
  onChange,
  required,
  placeholder,
  disabled,
  suffix = '万',
}: AmountInputProps) {
  const [display, setDisplay] = useState(() => formatThousandsInput(value))

  useEffect(() => {
    setDisplay(formatThousandsInput(value))
  }, [value])

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-500">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          disabled={disabled}
          placeholder={placeholder}
          value={display}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d.,]/g, '')
            setDisplay(raw)
            onChange(String(parseFormattedNumber(raw)))
          }}
          onBlur={() => {
            const formatted = formatThousandsInput(value)
            setDisplay(formatted)
          }}
          className="input-field pr-10"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}
