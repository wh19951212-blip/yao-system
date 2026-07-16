import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, ExternalLink, FileText, Play, Sparkles, X, Bot } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ListBackLink from '@/components/ui/ListBackLink'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useCanWrite } from '@/hooks/useCanWrite'
import { useDataScope } from '@/hooks/useDataScope'
import { fetchDemandById, formatDemandTitle } from '@/services/demands'
import { fetchChannelById } from '@/services/channels'
import { buildContractPrefillUrl } from '@/services/relations'
import NextStepBar from '@/components/ui/NextStepBar'
import type { Channel } from '@/types/database'
import {
  approveHighScoreResults,
  fetchMatchResults,
  fetchMatchRuns,
  getTargetPath,
  runMatch,
  saveMatchAiAnalysis,
  updateMatchResultReview,
} from '@/services/matching'
import { analyzeMatchResults } from '@/services/aiAnalysis'
import AiFeedbackButtons from '@/components/ai/AiFeedbackButtons'
import {
  DEMAND_INTENT_LABELS,
  DEMAND_STATUS_LABELS,
  MATCH_REVIEW_LABELS,
  MATCH_TARGET_LABELS,
} from '@/config/matching'
import type { InvestorDemand, MatchResult, MatchRun } from '@/types/database'

const REVIEW_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  approved: 'bg-emerald-50 text-emerald-600',
  rejected: 'bg-red-50 text-red-500',
  shown_to_investor: 'bg-blue-50 text-blue-600',
}

export default function DemandDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const toast = useToast()
  const { canWrite } = useCanWrite()
  const { ownerEmail } = useDataScope()

  const [demand, setDemand] = useState<InvestorDemand | null>(null)
  const [channel, setChannel] = useState<Channel | null>(null)
  const [runs, setRuns] = useState<MatchRun[]>([])
  const [results, setResults] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [matching, setMatching] = useState(false)
  const [aiMatching, setAiMatching] = useState(false)
  const [matchAiSummary, setMatchAiSummary] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [demandData, runData, resultData] = await Promise.all([
        fetchDemandById(id),
        fetchMatchRuns(id),
        fetchMatchResults(id),
      ])
      if (!demandData) {
        setError('需求单不存在')
        return
      }
      setDemand(demandData)
      setRuns(runData)
      setResults(resultData)
      if (demandData.channel_id) {
        fetchChannelById(demandData.channel_id)
          .then(setChannel)
          .catch(() => setChannel(null))
      } else {
        setChannel(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const handleRunMatch = async () => {
    if (!demand) return
    setMatching(true)
    setError('')
    try {
      const { run, results: newResults } = await runMatch(
        demand,
        ownerEmail,
        user?.email ?? null,
      )
      setRuns((prev) => [run, ...prev])
      setResults(newResults)
      setDemand((prev) =>
        prev ? { ...prev, status: newResults.length > 0 ? 'matched' : 'submitted' } : prev,
      )
      toast.success(`匹配完成，找到 ${newResults.length} 条结果`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '匹配失败'
      setError(msg)
      toast.error(msg)
    } finally {
      setMatching(false)
    }
  }

  const handleReview = async (
    resultId: string,
    reviewStatus: 'approved' | 'rejected',
  ) => {
    if (!canWrite) return
    try {
      await updateMatchResultReview(resultId, {
        review_status: reviewStatus,
        reviewed_by: user?.email ?? null,
      })
      setResults((prev) =>
        prev.map((r) =>
          r.id === resultId
            ? {
                ...r,
                review_status: reviewStatus,
                reviewed_by: user?.email ?? null,
                reviewed_at: new Date().toISOString(),
              }
            : r,
        ),
      )
      toast.success(reviewStatus === 'approved' ? '已通过' : '已拒绝')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    }
  }

  const handleBatchApprove = async () => {
    if (!id || !canWrite) return
    try {
      await approveHighScoreResults(id, user?.email ?? '', 80)
      await load()
      toast.success('已批量通过高分结果（≥80）')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '批量操作失败')
    }
  }

  const handleAiMatchAnalysis = async () => {
    if (!demand || results.length === 0) return
    setAiMatching(true)
    setError('')
    try {
      const { summary, items } = await analyzeMatchResults(demand, results)
      setMatchAiSummary(summary)
      setResults((prev) =>
        prev.map((r) => {
          const item = items.find((i) => i.resultId === r.id)
          return item ? { ...r, ai_explanation: item.explanation } : r
        }),
      )
      if (runs[0]?.id) {
        try {
          await saveMatchAiAnalysis(runs[0].id, items)
        } catch {
          // demo mode or missing table
        }
      }
      toast.success('AI 匹配解读已生成')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI 分析失败'
      setError(msg)
      toast.error(msg)
    } finally {
      setAiMatching(false)
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <LoadingSpinner label="加载匹配中心..." />
      </div>
    )
  }

  if (!demand) {
    return (
      <div className="page-shell">
        <div className="alert-error">{error || '需求单不存在'}</div>
        <ListBackLink listKey="demands" basePath="/matching/demands" />
      </div>
    )
  }

  const latestRun = runs[0]

  return (
    <div className="page-shell space-y-6">
      <ListBackLink listKey="demands" basePath="/matching/demands" />

      <PageHeader
        title={formatDemandTitle(demand)}
        description={`${DEMAND_INTENT_LABELS[demand.intent_type]} · ${DEMAND_STATUS_LABELS[demand.status]}`}
        actions={
          canWrite ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleRunMatch} disabled={matching}>
                <Play size={16} />
                {matching ? '匹配中...' : '运行匹配'}
              </Button>
              {results.some((r) => r.review_status === 'pending') && (
                <Button variant="secondary" onClick={handleBatchApprove}>
                  批量通过 ≥80 分
                </Button>
              )}
              {results.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={handleAiMatchAnalysis}
                  disabled={aiMatching}
                >
                  <Bot size={16} />
                  {aiMatching ? 'AI 解读中...' : 'AI 解读匹配'}
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      {error && <div className="alert-error">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="card p-5 lg:col-span-1 space-y-4">
          <h2 className="section-label">需求详情</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">关联客户</dt>
              <dd className="font-medium mt-0.5">
                {demand.investor ? (
                  <Link
                    to={`/investors/${demand.investor.id}`}
                    className="text-[#C9A84C] hover:underline"
                  >
                    {demand.investor.name}
                  </Link>
                ) : demand.buyer ? (
                  <Link
                    to={`/buyers/${demand.buyer.id}`}
                    className="text-[#C9A84C] hover:underline"
                  >
                    {demand.buyer.name}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">预算范围</dt>
              <dd className="mt-0.5">
                {demand.budget_min_wan != null || demand.budget_max_wan != null
                  ? `${demand.budget_min_wan ?? 0} - ${demand.budget_max_wan ?? '∞'} 万`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">偏好区域</dt>
              <dd className="mt-0.5">
                {demand.preferred_regions.length > 0
                  ? demand.preferred_regions.join('、')
                  : '不限'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">偏好类型</dt>
              <dd className="mt-0.5">
                {demand.preferred_types.length > 0
                  ? demand.preferred_types.join('、')
                  : '不限'}
              </dd>
            </div>
            {demand.min_roi_percent != null && (
              <div>
                <dt className="text-gray-500">最低 ROI</dt>
                <dd className="mt-0.5">{demand.min_roi_percent}%</dd>
              </div>
            )}
            {demand.risk_tolerance && (
              <div>
                <dt className="text-gray-500">风险偏好</dt>
                <dd className="mt-0.5">{demand.risk_tolerance}</dd>
              </div>
            )}
            {demand.timeline && (
              <div>
                <dt className="text-gray-500">时间计划</dt>
                <dd className="mt-0.5">{demand.timeline}</dd>
              </div>
            )}
            {demand.raw_description && (
              <div>
                <dt className="text-gray-500">需求描述</dt>
                <dd className="mt-0.5 text-gray-700">{demand.raw_description}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">提交渠道</dt>
              <dd className="font-medium mt-0.5">
                {channel ? (
                  <Link
                    to={`/channels/${channel.id}`}
                    className="text-[#C9A84C] hover:underline"
                  >
                    {channel.name}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">负责人</dt>
              <dd className="mt-0.5">{demand.owner ?? '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-label flex items-center gap-2">
              <Sparkles size={16} className="text-[#C9A84C]" />
              匹配结果
              {results.length > 0 && (
                <span className="text-gray-400 font-normal">
                  （{results.length} 条）
                </span>
              )}
            </h2>
            {latestRun && (
              <p className="text-xs text-gray-500">
                最近匹配：{new Date(latestRun.started_at).toLocaleString('zh-CN')}
                · 引擎 {latestRun.engine_version}
              </p>
            )}
          </div>

          {matchAiSummary && (
            <div className="card p-4 bg-[#C9A84C]/5 border border-[#C9A84C]/20">
              <p className="text-xs font-semibold text-[#1B2B4B] mb-1 flex items-center gap-1.5">
                <Bot size={14} className="text-[#C9A84C]" />
                AI 整体判断
              </p>
              <p className="text-sm text-gray-700">{matchAiSummary}</p>
              {demand && (
                <AiFeedbackButtons
                  contextType="match_summary"
                  entityType="demand"
                  entityId={demand.id}
                  createdBy={user?.email ?? null}
                  className="mt-3"
                />
              )}
            </div>
          )}

          {results.length === 0 ? (
            <div className="card p-12 text-center">
              <Sparkles size={32} className="mx-auto text-[#C9A84C]/40 mb-3" />
              <p className="text-gray-600 mb-1">尚未运行匹配</p>
              <p className="text-sm text-gray-500 mb-4">
                点击「运行匹配」，系统将从土地、物件、酒店、建筑商、渠道中筛选推荐
              </p>
              {canWrite && (
                <Button onClick={handleRunMatch} disabled={matching}>
                  <Play size={16} />
                  {matching ? '匹配中...' : '立即匹配'}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result) => (
                <div key={result.id} className="card p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="w-8 h-8 rounded-lg bg-[#1B2B4B] text-white text-sm font-bold flex items-center justify-center">
                        {result.rank}
                      </span>
                      <div>
                        <p className="text-2xl font-semibold text-[#C9A84C] leading-none">
                          {Math.round(result.score_total)}
                          <span className="text-xs text-gray-400 font-normal ml-0.5">
                            分
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-[#1B2B4B]/5 text-[#1B2B4B]">
                          {MATCH_TARGET_LABELS[result.target_type]}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${REVIEW_COLORS[result.review_status] ?? ''}`}
                        >
                          {MATCH_REVIEW_LABELS[result.review_status]}
                        </span>
                      </div>
                      <Link
                        to={getTargetPath(result)}
                        className="font-medium text-[#1A1A2A] hover:text-[#C9A84C] flex items-center gap-1"
                      >
                        {result.target_name ?? result.target_id}
                        <ExternalLink size={14} className="opacity-50" />
                      </Link>
                      {result.target_summary && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {result.target_summary}
                        </p>
                      )}
                      {result.match_reasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {result.match_reasons.map((reason) => (
                            <span
                              key={reason}
                              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}
                      {result.ai_explanation && (
                        <div className="mt-2 p-2 rounded bg-blue-50/80 border border-blue-100">
                          <p className="text-xs text-[#1B2B4B]/80">
                            <span className="font-medium text-[#C9A84C]">AI：</span>
                            {result.ai_explanation}
                          </p>
                          <AiFeedbackButtons
                            contextType="match_result"
                            entityType="match_result"
                            entityId={result.id}
                            createdBy={user?.email ?? null}
                            className="mt-2"
                          />
                        </div>
                      )}
                      {result.score_breakdown && (
                        <p className="text-[11px] text-gray-400 mt-2">
                          预算 {result.score_breakdown.budget ?? 0} · 区域{' '}
                          {result.score_breakdown.region ?? 0} · 类型{' '}
                          {result.score_breakdown.type ?? 0} · ROI{' '}
                          {result.score_breakdown.roi ?? 0} · 状态{' '}
                          {result.score_breakdown.status ?? 0}
                        </p>
                      )}
                    </div>

                    {canWrite && result.review_status === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReview(result.id, 'approved')}
                          className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          title="通过"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReview(result.id, 'rejected')}
                          className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                          title="拒绝"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                    {canWrite &&
                      (result.review_status === 'approved' ||
                        result.review_status === 'shown_to_investor') &&
                      (result.target_type === 'land' ||
                        result.target_type === 'property') && (
                        <Link
                          to={buildContractPrefillUrl(demand, result)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1B2B4B]/5 text-sm text-[#1B2B4B] hover:bg-[#1B2B4B]/10 shrink-0"
                        >
                          <FileText size={16} />
                          生成合同
                        </Link>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {runs.length > 1 && (
        <section className="card p-5">
          <h2 className="section-label mb-3">匹配历史</h2>
          <div className="space-y-2">
            {runs.slice(1, 6).map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between text-sm text-gray-600 py-2 border-b border-gray-100 last:border-0"
              >
                <span>
                  {new Date(run.started_at).toLocaleString('zh-CN')}
                </span>
                <span>{run.result_count} 条结果 · {run.engine_version}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {demand && canWrite && (
        <NextStepBar
          actions={[
            {
              label: '审核通过',
              onClick: handleBatchApprove,
              variant: 'primary',
            },
            ...(results.find(
              (r) =>
                (r.review_status === 'approved' ||
                  r.review_status === 'shown_to_investor') &&
                (r.target_type === 'land' || r.target_type === 'property'),
            )
              ? [
                  {
                    label: '生成合同',
                    to: buildContractPrefillUrl(
                      demand,
                      results.find(
                        (r) =>
                          r.review_status === 'approved' ||
                          r.review_status === 'shown_to_investor',
                      )!,
                    ),
                    variant: 'accent' as const,
                  },
                ]
              : []),
          ]}
        />
      )}
    </div>
  )
}
