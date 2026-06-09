import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import ApprovalStatusBadge from '@/components/ui/ApprovalStatusBadge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useConfirm } from '@/contexts/ConfirmContext'
import { useToast } from '@/contexts/ToastContext'
import {
  createCustomApprovalNode,
  deleteApprovalNode,
  fetchLandApprovalNodes,
  formatDate,
  updateLandApprovalNode,
} from '@/services/landApprovals'
import { APPROVAL_STATUSES } from '@/config/app'
import type { LandApprovalNode } from '@/types/database'

interface LandApprovalTrackerProps {
  landId: string
}

export default function LandApprovalTracker({ landId }: LandApprovalTrackerProps) {
  const confirm = useConfirm()
  const toast = useToast()
  const [nodes, setNodes] = useState<LandApprovalNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [customName, setCustomName] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetchLandApprovalNodes(landId)
      .then(setNodes)
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [landId])

  const handleUpdate = async (
    node: LandApprovalNode,
    patch: {
      status?: string
      owner?: string
      deadline?: string
      notes?: string
    },
  ) => {
    setSavingId(node.id)
    setError('')
    try {
      const updated = await updateLandApprovalNode(node.id, {
        status: patch.status ?? node.status,
        owner: patch.owner ?? node.owner,
        deadline: patch.deadline || null,
        notes: patch.notes ?? node.notes,
      })
      setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSavingId(null)
    }
  }

  const handleAddCustom = async () => {
    if (!customName.trim()) {
      toast.error('请输入自定义节点名称')
      return
    }
    setError('')
    try {
      const node = await createCustomApprovalNode(
        landId,
        customName.trim(),
        nodes.length,
      )
      setNodes((prev) => [...prev, node])
      setCustomName('')
      toast.success('节点已添加')
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败')
    }
  }

  const handleDelete = async (node: LandApprovalNode) => {
    if (!node.is_custom) return
    const ok = await confirm({
      title: '删除审批节点',
      message: `确定删除节点「${node.node_name}」？此操作不可撤销。`,
      confirmLabel: '删除',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await deleteApprovalNode(node.id)
      setNodes((prev) => prev.filter((n) => n.id !== node.id))
      toast.success('节点已删除')
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const completedCount = nodes.filter((n) => n.status === '已通过').length
  const progress =
    nodes.length > 0 ? Math.round((completedCount / nodes.length) * 100) : 0

  return (
    <section className="card overflow-hidden mt-8">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-label">审批进度</h2>
            <p className="text-xs text-gray-500 mt-1">
              已完成 {completedCount}/{nodes.length} 个节点（{progress}%）
            </p>
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C9A84C] rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="p-6">
        {error && <div className="alert-error mb-4">{error}</div>}

        {loading ? (
          <LoadingSpinner label="加载审批节点..." />
        ) : nodes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">暂无审批节点</p>
        ) : (
          <div className="space-y-4">
            {nodes.map((node, index) => (
              <div
                key={node.id}
                className="p-4 rounded-lg border border-gray-200 bg-white"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#1B2B4B] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-[#1A1A2A]">
                        {node.node_name}
                      </p>
                      {node.is_custom && (
                        <span className="text-[10px] text-gray-400">自定义</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ApprovalStatusBadge status={node.status} />
                    {node.is_custom && (
                      <button
                        type="button"
                        onClick={() => handleDelete(node)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Select
                    id={`status-${node.id}`}
                    label="状态"
                    value={node.status}
                    onChange={(e) =>
                      handleUpdate(node, { status: e.target.value })
                    }
                    options={APPROVAL_STATUSES.map((s) => ({
                      value: s,
                      label: s,
                    }))}
                  />
                  <Input
                    id={`owner-${node.id}`}
                    label="负责人"
                    defaultValue={node.owner ?? ''}
                    onBlur={(e) =>
                      handleUpdate(node, { owner: e.target.value })
                    }
                  />
                  <Input
                    id={`deadline-${node.id}`}
                    label="截止日期"
                    type="date"
                    value={node.deadline ?? ''}
                    onChange={(e) =>
                      handleUpdate(node, { deadline: e.target.value })
                    }
                  />
                  <div className="flex items-end">
                    <p className="text-xs text-gray-500 pb-2">
                      {node.deadline ? formatDate(node.deadline) : '未设置截止'}
                      {savingId === node.id && (
                        <span className="ml-2 text-[#C9A84C]">保存中...</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <Textarea
                    id={`notes-${node.id}`}
                    label="备注"
                    defaultValue={node.notes ?? ''}
                    rows={2}
                    onBlur={(e) =>
                      handleUpdate(node, { notes: e.target.value })
                    }
                  />
                </div>
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="自定义节点名称..."
                className="input-field flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
              />
              <Button type="button" variant="secondary" onClick={handleAddCustom}>
                <Plus size={16} />
                添加节点
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
