CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tools JSONB NOT NULL,
  summary TEXT,
  savings_monthly NUMERIC,
  savings_annual NUMERIC,
  share_slug TEXT UNIQUE
);

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES audits(id),
  email TEXT NOT NULL,
  company TEXT,
  role TEXT,
  team_size INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Audits: allow public read on non-identifying fields, allow public insert
CREATE POLICY "Public can insert audits" ON audits FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view audits by slug" ON audits FOR SELECT USING (true); -- Real implementation would restrict fields

-- Leads: allow public insert, no public select
CREATE POLICY "Public can insert leads" ON leads FOR INSERT WITH CHECK (true);
