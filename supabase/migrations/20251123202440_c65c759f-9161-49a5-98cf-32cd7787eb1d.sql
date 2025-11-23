-- Create booking_change_requests table
CREATE TABLE IF NOT EXISTS booking_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id),
  branch_id UUID REFERENCES branches(id),
  organization_id UUID REFERENCES organizations(id),
  
  -- Request details
  request_type TEXT NOT NULL CHECK (request_type IN ('cancellation', 'reschedule')),
  reason TEXT NOT NULL,
  notes TEXT,
  
  -- For reschedule requests only
  new_date DATE,
  new_time TIME,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Admin review
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_change_requests_booking ON booking_change_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_change_requests_client ON booking_change_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_booking_change_requests_status ON booking_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_change_requests_branch ON booking_change_requests(branch_id);

-- Add status fields to bookings table
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS cancellation_request_status TEXT 
    CHECK (cancellation_request_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS reschedule_request_status TEXT 
    CHECK (reschedule_request_status IN ('pending', 'approved', 'rejected'));

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_bookings_cancellation_request 
  ON bookings(cancellation_request_status) 
  WHERE cancellation_request_status IS NOT NULL;
  
CREATE INDEX IF NOT EXISTS idx_bookings_reschedule_request 
  ON bookings(reschedule_request_status) 
  WHERE reschedule_request_status IS NOT NULL;

-- Enable RLS
ALTER TABLE booking_change_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Clients can view their own requests
CREATE POLICY "Clients can view own change requests" ON booking_change_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = booking_change_requests.client_id 
      AND c.auth_user_id = auth.uid()
    )
  );

-- RLS Policy: Clients can create requests for their bookings
CREATE POLICY "Clients can create change requests" ON booking_change_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = booking_change_requests.client_id 
      AND c.auth_user_id = auth.uid()
    )
  );

-- RLS Policy: Admins can view all requests in their branches
CREATE POLICY "Admins can view branch change requests" ON booking_change_requests
  FOR SELECT USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM admin_branches ab
      WHERE ab.branch_id = booking_change_requests.branch_id 
      AND ab.admin_id = auth.uid()
    )
  );

-- RLS Policy: Admins can update requests in their branches
CREATE POLICY "Admins can update branch change requests" ON booking_change_requests
  FOR UPDATE USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM admin_branches ab
      WHERE ab.branch_id = booking_change_requests.branch_id 
      AND ab.admin_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_booking_change_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_booking_change_requests_updated_at
  BEFORE UPDATE ON booking_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_change_requests_updated_at();