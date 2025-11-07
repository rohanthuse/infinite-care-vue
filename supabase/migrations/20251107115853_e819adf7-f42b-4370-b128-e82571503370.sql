-- Remove duplicate invoice creation triggers and functions
-- This prevents duplicate invoice creation (database trigger + React hook)

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_auto_create_invoice_for_booking ON bookings;
DROP TRIGGER IF EXISTS trigger_sync_invoice_status_with_booking ON bookings;

-- Drop functions
DROP FUNCTION IF EXISTS auto_create_invoice_for_booking();
DROP FUNCTION IF EXISTS sync_invoice_status_with_booking();
DROP FUNCTION IF EXISTS map_booking_status_to_invoice_status(TEXT);
DROP FUNCTION IF EXISTS generate_invoice_number();

-- Note: Invoice generation is now handled exclusively by the React hook (useGenerateBookingInvoice)
-- This provides better error handling, user feedback, and maintainability