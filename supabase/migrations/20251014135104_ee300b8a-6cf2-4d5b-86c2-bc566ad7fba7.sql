-- Table 1: staff_quality_metrics
-- Stores calculated quality snapshots for historical tracking
CREATE TABLE staff_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  
  -- Core Metrics (calculated from real data)
  average_rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  task_completion_rate NUMERIC(5,2) DEFAULT 0,
  punctuality_score NUMERIC(5,2) DEFAULT 0,
  
  -- Detailed Quality Scores (1-5 scale)
  client_satisfaction_score NUMERIC(3,2) DEFAULT 0,
  documentation_quality_score NUMERIC(3,2) DEFAULT 0,
  communication_skills_score NUMERIC(3,2) DEFAULT 0,
  professionalism_score NUMERIC(3,2) DEFAULT 0,
  
  -- Performance Indicators
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  late_arrivals INTEGER DEFAULT 0,
  
  -- Incident Tracking
  incidents_reported INTEGER DEFAULT 0,
  incidents_resolved INTEGER DEFAULT 0,
  
  -- Metadata
  calculation_period TEXT NOT NULL,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  calculated_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(staff_id, calculation_period, period_start_date, period_end_date)
);

CREATE INDEX idx_quality_metrics_staff ON staff_quality_metrics(staff_id);
CREATE INDEX idx_quality_metrics_period ON staff_quality_metrics(period_start_date, period_end_date);

-- Table 2: staff_improvement_areas
-- Tracks specific areas where staff need improvement
CREATE TABLE staff_improvement_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  
  -- Improvement Details
  area_title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'communication',
    'punctuality',
    'documentation',
    'client_care',
    'professionalism',
    'technical_skills',
    'safety_compliance',
    'other'
  )),
  
  -- Severity and Priority
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Action Plan
  action_plan TEXT,
  target_completion_date DATE,
  support_required TEXT,
  training_recommended BOOLEAN DEFAULT false,
  
  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',
    'in_progress',
    'completed',
    'cancelled',
    'escalated'
  )),
  
  -- Progress Tracking
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  progress_notes TEXT,
  last_review_date DATE,
  next_review_date DATE,
  
  -- Source of Identification
  identified_by UUID REFERENCES auth.users(id),
  identified_at TIMESTAMPTZ DEFAULT now(),
  source_type TEXT CHECK (source_type IN (
    'review',
    'incident',
    'observation',
    'complaint',
    'audit',
    'self_assessment',
    'performance_review'
  )),
  source_reference_id UUID,
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_improvement_areas_staff ON staff_improvement_areas(staff_id);
CREATE INDEX idx_improvement_areas_status ON staff_improvement_areas(status);
CREATE INDEX idx_improvement_areas_severity ON staff_improvement_areas(severity);
CREATE INDEX idx_improvement_areas_category ON staff_improvement_areas(category);

-- Table 3: staff_performance_reviews
-- Formal performance review records
CREATE TABLE staff_performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  
  -- Review Details
  review_type TEXT NOT NULL CHECK (review_type IN (
    'probation',
    'quarterly',
    'annual',
    'ad_hoc',
    'improvement_plan'
  )),
  review_date DATE NOT NULL,
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  
  -- Reviewer Information
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  reviewer_name TEXT NOT NULL,
  
  -- Overall Assessment
  overall_rating NUMERIC(3,2) CHECK (overall_rating >= 1 AND overall_rating <= 5),
  performance_summary TEXT NOT NULL,
  
  -- Individual Ratings (1-5 scale)
  quality_of_work_rating NUMERIC(3,2),
  punctuality_rating NUMERIC(3,2),
  communication_rating NUMERIC(3,2),
  professionalism_rating NUMERIC(3,2),
  teamwork_rating NUMERIC(3,2),
  initiative_rating NUMERIC(3,2),
  
  -- Comments
  strengths TEXT,
  areas_for_improvement TEXT,
  development_goals TEXT,
  
  -- Action Items
  action_items JSONB DEFAULT '[]'::jsonb,
  follow_up_date DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'pending_signature',
    'completed',
    'archived'
  )),
  
  -- Staff Acknowledgment
  staff_acknowledged_at TIMESTAMPTZ,
  staff_comments TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_performance_reviews_staff ON staff_performance_reviews(staff_id);
CREATE INDEX idx_performance_reviews_date ON staff_performance_reviews(review_date);
CREATE INDEX idx_performance_reviews_status ON staff_performance_reviews(status);

-- Triggers for updated_at
CREATE TRIGGER set_quality_metrics_updated_at
  BEFORE UPDATE ON staff_quality_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_contacts_updated_at();

CREATE TRIGGER set_improvement_areas_updated_at
  BEFORE UPDATE ON staff_improvement_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_contacts_updated_at();

CREATE TRIGGER set_performance_reviews_updated_at
  BEFORE UPDATE ON staff_performance_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_contacts_updated_at();

-- RLS Policies for staff_quality_metrics
ALTER TABLE staff_quality_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own quality metrics"
ON staff_quality_metrics FOR SELECT
USING (
  staff_id IN (
    SELECT id FROM staff WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view quality metrics in their branch"
ON staff_quality_metrics FOR SELECT
USING (
  branch_id IN (
    SELECT branch_id FROM admin_branches WHERE admin_id = auth.uid()
  )
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins can manage quality metrics in their branch"
ON staff_quality_metrics FOR ALL
USING (
  branch_id IN (
    SELECT branch_id FROM admin_branches WHERE admin_id = auth.uid()
  )
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  branch_id IN (
    SELECT branch_id FROM admin_branches WHERE admin_id = auth.uid()
  )
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- RLS Policies for staff_improvement_areas
ALTER TABLE staff_improvement_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own improvement areas"
ON staff_improvement_areas FOR SELECT
USING (
  staff_id IN (
    SELECT id FROM staff WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view improvement areas in their branch"
ON staff_improvement_areas FOR SELECT
USING (
  branch_id IN (
    SELECT branch_id FROM admin_branches WHERE admin_id = auth.uid()
  )
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins can manage improvement areas in their branch"
ON staff_improvement_areas FOR ALL
USING (
  branch_id IN (
    SELECT branch_id FROM admin_branches WHERE admin_id = auth.uid()
  )
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  branch_id IN (
    SELECT branch_id FROM admin_branches WHERE admin_id = auth.uid()
  )
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- RLS Policies for staff_performance_reviews
ALTER TABLE staff_performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own performance reviews"
ON staff_performance_reviews FOR SELECT
USING (
  staff_id IN (
    SELECT id FROM staff WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view performance reviews in their branch"
ON staff_performance_reviews FOR SELECT
USING (
  branch_id IN (
    SELECT branch_id FROM admin_branches WHERE admin_id = auth.uid()
  )
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins can manage performance reviews in their branch"
ON staff_performance_reviews FOR ALL
USING (
  branch_id IN (
    SELECT branch_id FROM admin_branches WHERE admin_id = auth.uid()
  )
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  branch_id IN (
    SELECT branch_id FROM admin_branches WHERE admin_id = auth.uid()
  )
  OR has_role(auth.uid(), 'super_admin'::app_role)
);