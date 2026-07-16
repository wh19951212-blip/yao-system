import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  FileText,
  Handshake,
  Map,
  Search,
  ShoppingBag,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { useDataScope } from '@/hooks/useDataScope'
import { globalSearch } from '@/services/search'
import type { SearchResults } from '@/types/database'

const emptyResults: SearchResults = {
  investors: [],
  lands: [],
  properties: [],
  buyers: [],
  channels: [],
  contracts: [],
  demands: [],
}

export default function GlobalSearch() {
  const { ownerEmail } = useDataScope()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>(emptyResults)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults(emptyResults)
      return
    }

    const timer = setTimeout(() => {
      setLoading(true)
      globalSearch(query, ownerEmail)
        .then(setResults)
        .catch(() => setResults(emptyResults))
        .finally(() => setLoading(false))
    }, 250)

    return () => clearTimeout(timer)
  }, [query, ownerEmail])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const total =
    results.investors.length +
    results.lands.length +
    results.properties.length +
    results.buyers.length +
    results.channels.length +
    results.contracts.length +
    results.demands.length

  const go = (path: string) => {
    navigate(path)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xl">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="搜索投资人、买家、土地、物件、渠道、合同…"
          className="w-full h-10 pl-9 pr-9 rounded-lg border border-gray-200 bg-white text-sm text-[#1A1A2A] placeholder:text-gray-400 focus:outline-none focus:border-[#1B2B4B]/40 focus:ring-2 focus:ring-[#1B2B4B]/10"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setResults(emptyResults)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg z-50 max-h-[480px] overflow-y-auto">
          {loading ? (
            <p className="px-4 py-6 text-sm text-gray-500 text-center">
              搜索中...
            </p>
          ) : total === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500 text-center">
              未找到「{query}」相关结果
            </p>
          ) : (
            <div className="py-2">
              <ResultGroup
                title="投资人"
                icon={Users}
                items={results.investors.map((item) => ({
                  ...item,
                  onClick: () => go(`/investors/${item.id}`),
                }))}
              />
              <ResultGroup
                title="买家"
                icon={ShoppingBag}
                items={results.buyers.map((item) => ({
                  ...item,
                  onClick: () => go(`/buyers/${item.id}`),
                }))}
              />
              <ResultGroup
                title="土地"
                icon={Map}
                items={results.lands.map((item) => ({
                  ...item,
                  onClick: () => go(`/lands/${item.id}`),
                }))}
              />
              <ResultGroup
                title="物件"
                icon={Building2}
                items={results.properties.map((item) => ({
                  ...item,
                  onClick: () => go(`/properties/${item.id}`),
                }))}
              />
              <ResultGroup
                title="渠道中介"
                icon={Handshake}
                items={results.channels.map((item) => ({
                  ...item,
                  onClick: () => go(`/channels/${item.id}`),
                }))}
              />
              <ResultGroup
                title="合同"
                icon={FileText}
                items={results.contracts.map((item) => ({
                  ...item,
                  onClick: () => go(`/contracts/${item.id}`),
                }))}
              />
              <ResultGroup
                title="需求单"
                icon={Sparkles}
                items={results.demands.map((item) => ({
                  ...item,
                  onClick: () => go(`/matching/demands/${item.id}`),
                }))}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ResultGroup({
  title,
  icon: Icon,
  items,
}: {
  title: string
  icon: typeof Users
  items: {
    id: string
    name: string
    subtitle: string
    onClick: () => void
  }[]
}) {
  if (items.length === 0) return null
  return (
    <div className="px-2 py-1">
      <p className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
        <Icon size={12} />
        {title}
      </p>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={item.onClick}
          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <p className="text-sm font-medium text-[#1A1A2A]">{item.name}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{item.subtitle}</p>
        </button>
      ))}
    </div>
  )
}
