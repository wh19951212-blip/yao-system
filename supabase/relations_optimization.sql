-- 功能关联优化：合同绑定买家 + 买家物件匹配持久化
-- 在 Supabase SQL Editor 中执行

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES buyers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contracts_buyer_id ON contracts(buyer_id);

CREATE TABLE IF NOT EXISTS buyer_property_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  is_recommended BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (buyer_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_buyer_property_matches_buyer
  ON buyer_property_matches(buyer_id);

CREATE INDEX IF NOT EXISTS idx_buyer_property_matches_property
  ON buyer_property_matches(property_id);

-- investor_land_matches 写入（表通常已在 schema 中存在）
CREATE TABLE IF NOT EXISTS investor_land_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  land_id UUID NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (investor_id, land_id)
);
