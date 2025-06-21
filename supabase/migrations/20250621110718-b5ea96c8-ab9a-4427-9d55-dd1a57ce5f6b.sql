
-- Create attendance_records table
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL,
  person_type TEXT NOT NULL CHECK (person_type IN ('staff', 'client')),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused', 'half_day')),
  check_in_time TIME,
  check_out_time TIME,
  hours_worked NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_attendance_records_person_id ON public.attendance_records(person_id);
CREATE INDEX idx_attendance_records_branch_id ON public.attendance_records(branch_id);
CREATE INDEX idx_attendance_records_date ON public.attendance_records(attendance_date);
CREATE INDEX idx_attendance_records_person_date ON public.attendance_records(person_id, attendance_date);

-- Enable Row Level Security
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.attendance_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.attendance_records FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.attendance_records FOR DELETE USING (true);

-- Create trigger to update updated_at column
CREATE OR REPLACE TRIGGER update_attendance_records_updated_at
    BEFORE UPDATE ON public.attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for attendance_records
ALTER TABLE public.attendance_records REPLICA IDENTITY FULL;
