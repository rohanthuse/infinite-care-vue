-- Add new columns to client_personal_care table for Incontinence and Sleep sections
ALTER TABLE public.client_personal_care 
ADD COLUMN IF NOT EXISTS incontinence_products_required boolean,
ADD COLUMN IF NOT EXISTS sleep_go_to_bed_time text,
ADD COLUMN IF NOT EXISTS sleep_wake_up_time text,
ADD COLUMN IF NOT EXISTS sleep_get_out_of_bed_time text,
ADD COLUMN IF NOT EXISTS sleep_prepare_duration text,
ADD COLUMN IF NOT EXISTS assist_going_to_bed boolean,
ADD COLUMN IF NOT EXISTS assist_getting_out_of_bed boolean,
ADD COLUMN IF NOT EXISTS panic_button_in_bed boolean,
ADD COLUMN IF NOT EXISTS assist_turn_to_sleep_position boolean;