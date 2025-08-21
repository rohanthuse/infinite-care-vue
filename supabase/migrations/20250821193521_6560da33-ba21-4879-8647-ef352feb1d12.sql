
-- Create two example bookings for client 82245647-fc57-4e4e-a152-acc93588f8fd
-- Uses existing staff/service/branch from your environment

-- Variables (inlined)
-- client_id: 82245647-fc57-4e4e-a152-acc93588f8fd
-- branch_id: 876a6aab-13b3-48a5-b7ca-d5e44afc6dac
-- staff_id: 0fa0cbb6-4d01-4991-b958-1c15c174413a
-- service_id: 40668c06-731f-4103-bd74-6e7c9aafc111

-- Past completed appointment: 3 days ago, 10:00–11:00 UTC
INSERT INTO public.bookings (
  branch_id,
  client_id,
  staff_id,
  service_id,
  start_time,
  end_time,
  status,
  revenue,
  notes
) VALUES (
  '876a6aab-13b3-48a5-b7ca-d5e44afc6dac',
  '82245647-fc57-4e4e-a152-acc93588f8fd',
  '0fa0cbb6-4d01-4991-b958-1c15c174413a',
  '40668c06-731f-4103-bd74-6e7c9aafc111',
  date_trunc('day', now() AT TIME ZONE 'utc') - interval '3 days' + interval '10 hours',
  date_trunc('day', now() AT TIME ZONE 'utc') - interval '3 days' + interval '11 hours',
  'completed',
  100,
  'Completed appointment for testing visibility'
);

-- Upcoming assigned appointment: tomorrow, 09:00–10:00 UTC
INSERT INTO public.bookings (
  branch_id,
  client_id,
  staff_id,
  service_id,
  start_time,
  end_time,
  status,
  revenue,
  notes
) VALUES (
  '876a6aab-13b3-48a5-b7ca-d5e44afc6dac',
  '82245647-fc57-4e4e-a152-acc93588f8fd',
  '0fa0cbb6-4d01-4991-b958-1c15c174413a',
  '40668c06-731f-4103-bd74-6e7c9aafc111',
  date_trunc('day', now() AT TIME ZONE 'utc') + interval '1 day' + interval '9 hours',
  date_trunc('day', now() AT TIME ZONE 'utc') + interval '1 day' + interval '10 hours',
  'assigned',
  120,
  'Upcoming appointment for testing visibility'
);
