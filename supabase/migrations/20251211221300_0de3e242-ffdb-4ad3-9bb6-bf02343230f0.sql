-- Add is_edited column to messages table for tracking edited messages
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_edited boolean NOT NULL DEFAULT false;