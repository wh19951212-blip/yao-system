import type { ButtonHTMLAttributes } from 'react'

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-accent',
  danger:
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50',
  ghost:
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-[#1B2B4B] hover:bg-gray-100 transition-all disabled:opacity-50',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
}

export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
