-- AI 学习闭环：反馈 + 成功案例库
-- 在 Supabase SQL Editor 中执行

CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  rating TEXT NOT NULL CHECK (rating IN ('helpful', 'not_helpful')),
  comment TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_context
  ON ai_feedback (context_type, entity_type, entity_id);

CREATE TABLE IF NOT EXISTS success_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  case_type TEXT NOT NULL DEFAULT 'match',
  intent_type TEXT,
  client_type TEXT,
  regions TEXT[] NOT NULL DEFAULT '{}',
  budget_min_wan NUMERIC,
  budget_max_wan NUMERIC,
  target_type TEXT,
  target_name TEXT,
  target_id UUID,
  contract_id UUID,
  demand_id UUID,
  outcome TEXT DEFAULT 'closed',
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_success_cases_intent ON success_cases (intent_type);
CREATE INDEX IF NOT EXISTS idx_success_cases_regions ON success_cases USING GIN (regions);
