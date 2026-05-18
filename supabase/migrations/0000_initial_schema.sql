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
