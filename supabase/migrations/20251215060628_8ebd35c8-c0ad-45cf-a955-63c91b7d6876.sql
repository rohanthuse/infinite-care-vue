-- Backfill booked_time_minutes for existing booking-based invoices
-- Calculate from linked bookings via invoice_line_items

UPDATE client_billing cb
SET booked_time_minutes = subquery.total_booked_minutes
FROM (
  SELECT 
    ili.invoice_id,
    COALESCE(SUM(
      EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 60
    )::integer, 0) as total_booked_minutes
  FROM invoice_line_items ili
  INNER JOIN bookings b ON ili.booking_id = b.id
  GROUP BY ili.invoice_id
) AS subquery
WHERE cb.id = subquery.invoice_id
AND cb.generated_from_booking = true
AND (cb.booked_time_minutes IS NULL OR cb.booked_time_minutes = 0);

-- Also update invoices that have a direct booking_id reference
UPDATE client_billing cb
SET booked_time_minutes = EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 60
FROM bookings b
WHERE cb.booking_id = b.id
AND cb.generated_from_booking = true
AND (cb.booked_time_minutes IS NULL OR cb.booked_time_minutes = 0);