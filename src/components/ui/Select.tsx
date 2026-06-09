import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
  required?: boolean
}

function FieldLabel({
  id,
  label,
  required,
}: {
  id?: string
  label: string
  required?: boolean
}) {
  return (
    <label htmlFor={id} className="block text-sm font-medium text-gray-500">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

export default function Select({
  label,
  options,
  className = '',
  id,
  required,
  ...props
}: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <FieldLabel id={id} label={label} required={required} />}
      <div className="relative">
        <select
          id={id}
          required={required}
          className={`input-field appearance-none pr-10 cursor-pointer ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-white text-[#1A1A2A]"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>
    </div>
  )
}
