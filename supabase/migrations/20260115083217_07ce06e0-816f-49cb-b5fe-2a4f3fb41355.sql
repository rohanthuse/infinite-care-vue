-- Alter the letter column in body_map_points to support multi-character letters
-- This is needed because system body map points use letters like 'AA', 'BB', etc.
ALTER TABLE body_map_points 
ALTER COLUMN letter TYPE text;

-- Add a comment explaining the change
COMMENT ON COLUMN body_map_points.letter IS 'Letter identifier for the body map point (e.g., A, B, AA, BB)';