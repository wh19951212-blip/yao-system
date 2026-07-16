import { useEffect, useState } from 'react'
import { subscribeDemoData } from '@/lib/demoData'

export default function DemoBanner() {
  const [active, setActive] = useState(false)

  useEffect(() => subscribeDemoData(setActive), [])

  if (!active) return null

  return (
    <div className="border-b border-[#C5D9F0] bg-[#EBF3FC] px-4 py-2.5 text-sm text-[#1B2B4B]">
      <span className="font-medium">演示案例数据 · 只读</span>
      <span className="mx-2 text-[#5A6B85]">·</span>
      当前为内置展示内容，不可保存修改。写入真实数据请在 Supabase SQL Editor 运行{' '}
      <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">supabase/seed_demo.sql</code>
      。
    </div>
  )
}
