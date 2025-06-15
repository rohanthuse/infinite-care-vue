
-- Create the 'body_map_points' table
CREATE TABLE public.body_map_points (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    letter CHAR(1) NOT NULL,
    title TEXT NOT NULL,
    color VARCHAR(7) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.body_map_points IS 'Stores different types of body map points for injury tracking.';

-- Add trigger for 'updated_at' on 'body_map_points'
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.body_map_points
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Enable RLS and set policies for 'body_map_points'
ALTER TABLE public.body_map_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to all body map points"
ON public.body_map_points FOR SELECT USING (true);

CREATE POLICY "Allow super_admins to manage body map points"
ON public.body_map_points FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Populate the table with initial data
INSERT INTO public.body_map_points (letter, title, color) VALUES
('A', 'Scalds, burns', '#ff00ff'),
('B', 'Bruising', '#00ff80'),
('C', 'Excoriation, red areas (not broken down)', '#ff0000'),
('D', 'Cuts, wounds', '#ff8000');
