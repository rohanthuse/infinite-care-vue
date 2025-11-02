-- Add AI recommendations column to news2_observations table
ALTER TABLE news2_observations 
ADD COLUMN ai_recommendations TEXT;

COMMENT ON COLUMN news2_observations.ai_recommendations IS 'JSON string containing Gemini AI-generated clinical recommendations based on NEWS2 assessment';