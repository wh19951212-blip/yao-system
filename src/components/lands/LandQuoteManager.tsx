import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import BuilderTierBadge from '@/components/ui/BuilderTierBadge'
import {
  computeLandQuoteStats,
  createLandQuote,
  fetchBuilders,
  fetchLandQuotes,
  formatDate,
  formatQuoteAmount,
} from '@/services/builders'
import type { Builder, BuilderQuote } from '@/types/database'

interface LandQuoteManagerProps {
  landId: string
}

const emptyForm = {
  builder_id: '',
  quote_amount_wan: '',
  quote_date: new Date().toISOString().slice(0, 10),
  notes: '',
}

export default function LandQuoteManager({ landId }: LandQuoteManagerProps) {
  const [quotes, setQuotes] = useState<BuilderQuote[]>([])
  const [builders, setBuilders] = useState<Builder[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([fetchLandQuotes(landId), fetchBuilders()])
      .then(([quoteList, builderList]) => {
        setQuotes(quoteList)
        setBuilders(builderList)
      })
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [landId])

  const stats = useMemo(() => computeLandQuoteStats(quotes), [quotes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.builder_id || !form.quote_amount_wan) return
    setSubmitting(true)
    setError('')
    try {
      await createLandQuote({
        builder_id: form.builder_id,
        land_id: landId,
        quote_amount_wan: Number(form.quote_amount_wan),
        quote_date: form.quote_date,
        notes: form.notes.trim() || null,
      })
      setForm(emptyForm)
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="card overflow-hidden mt-8">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-label">询价管理</h2>
          <p className="text-xs text-gray-500 mt-1">建筑商报价对比与最优选择</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus size={16} />
          发起询价
        </Button>
      </div>

      <div className="p-6">
        {error && <div className="alert-error mb-4">{error}</div>}

        {stats.min != null && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: '最低报价', value: formatQuoteAmount(stats.min) },
              { label: '最高报价', value: formatQuoteAmount(stats.max) },
              { label: '平均报价', value: formatQuoteAmount(stats.avg) },
              { label: '报价数量', value: `${quotes.length} 份` },
            ].map((item) => (
              <div
                key={item.label}
                className="p-3 rounded-lg bg-gray-50 border border-gray-200"
              >
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-sm font-semibold text-[#1A1A2A] mt-0.5">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-6 p-4 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/5 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="builder_id"
                label="选择建筑商 *"
                value={form.builder_id}
                onChange={(e) =>
                  setForm((p) => ({ ...p, builder_id: e.target.value }))
                }
                options={[
                  { value: '', label: '请选择建筑商' },
                  ...builders.map((b) => ({
                    value: b.id,
                    label: `${b.company_name}（${b.tier}级）`,
                  })),
                ]}
              />
              <Input
                id="quote_amount_wan"
                label="报价金额（万）*"
                type="number"
                min="0"
                step="0.01"
                value={form.quote_amount_wan}
                onChange={(e) =>
                  setForm((p) => ({ ...p, quote_amount_wan: e.target.value }))
                }
                required
              />
              <Input
                id="quote_date"
                label="报价日期 *"
                type="date"
                value={form.quote_date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, quote_date: e.target.value }))
                }
                required
              />
            </div>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="备注（可选）"
              rows={2}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? '提交中...' : '保存报价'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                取消
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">加载报价...</p>
        ) : quotes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            暂无报价，点击「发起询价」添加
          </p>
        ) : (
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-head">
                  <th className="text-left px-4 py-3">建筑商</th>
                  <th className="text-left px-4 py-3">等级</th>
                  <th className="text-right px-4 py-3">报价（万）</th>
                  <th className="text-left px-4 py-3">报价日期</th>
                  <th className="text-left px-4 py-3">备注</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => {
                  const isBest = quote.id === stats.bestId
                  return (
                    <tr
                      key={quote.id}
                      className={`table-row ${isBest ? 'bg-emerald-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={
                            isBest
                              ? 'font-semibold text-emerald-700'
                              : 'text-[#1A1A2A]'
                          }
                        >
                          {quote.builder?.company_name ?? '—'}
                        </span>
                        {isBest && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                            最优
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {quote.builder?.tier ? (
                          <BuilderTierBadge tier={quote.builder.tier} />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold ${
                          isBest ? 'text-emerald-700' : 'text-[#1B2B4B]'
                        }`}
                      >
                        {formatQuoteAmount(quote.quote_amount_wan)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(quote.quote_date)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {quote.notes || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
