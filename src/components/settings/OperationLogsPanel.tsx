import { useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'
import {
  fetchOperationLogs,
  formatOperationAction,
} from '@/services/operationLogs'
import { formatDateTime } from '@/services/investors'
import type { OperationLog } from '@/types/database'

export default function OperationLogsPanel() {
  const [logs, setLogs] = useState<OperationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchOperationLogs(150)
      .then(setLogs)
      .catch((err) =>
        setError(err instanceof Error ? err.message : '加载失败'),
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="card p-6 mt-6">
      <div className="flex items-center gap-3 mb-4">
        <ScrollText size={20} className="text-[#C9A84C]" />
        <h2 className="section-label">操作日志</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        记录投资人、土地、合同等关键操作，仅管理员可见
      </p>

      {error && <div className="alert-error mb-4">{error}</div>}

      {loading ? (
        <p className="text-sm text-gray-500">加载中...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-gray-500">暂无操作记录</p>
      ) : (
        <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
          {logs.map((log) => (
            <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
              <span className="text-xs text-gray-400 shrink-0 w-36">
                {formatDateTime(log.created_at)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {formatOperationAction(log.action)}
                  </span>
                  <span className="text-xs text-gray-500">{log.operator}</span>
                </div>
                <p className="text-sm text-[#1A1A2A]">{log.summary}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
