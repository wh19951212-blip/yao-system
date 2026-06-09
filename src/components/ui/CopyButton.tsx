import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import Button from '@/components/ui/Button'

interface CopyButtonProps {
  text: string
  label?: string
  className?: string
  disabled?: boolean
}

export default function CopyButton({
  text,
  label = '一键复制',
  className = '',
  disabled,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleCopy}
      disabled={disabled ?? !text}
      className={className}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? '已复制' : label}
    </Button>
  )
}
