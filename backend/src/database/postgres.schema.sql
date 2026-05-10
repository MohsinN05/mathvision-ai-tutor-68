-- PostgreSQL schema for MathVision backend
CREATE TABLE IF NOT EXISTS equation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  latex TEXT NOT NULL,
  equation_type TEXT,
  solver_used TEXT,
  result_latex TEXT,
  saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS solution_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equation_id UUID REFERENCES equation_history(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  symbolic_step TEXT,
  explanation TEXT
);

CREATE INDEX IF NOT EXISTS idx_history_user ON equation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_steps_equation ON solution_steps(equation_id);
