import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' })
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const close = (result: boolean) => {
    setOpen(false)
    resolverRef.current?.(result)
    resolverRef.current = null
  }

  const value = useMemo(() => ({ confirm }), [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal
        open={open}
        onClose={() => close(false)}
        title={options.title ?? '确认操作'}
        footer={
          <>
            <Button variant="secondary" onClick={() => close(false)}>
              {options.cancelLabel ?? '取消'}
            </Button>
            <Button
              variant={options.variant === 'danger' ? 'primary' : 'accent'}
              className={
                options.variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : undefined
              }
              onClick={() => close(true)}
            >
              {options.confirmLabel ?? '确认'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#1A1A2A] leading-relaxed">{options.message}</p>
      </Modal>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx.confirm
}
