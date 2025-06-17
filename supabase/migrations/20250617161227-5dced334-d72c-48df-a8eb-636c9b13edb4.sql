
-- Create a staff record first for the approved_by reference
INSERT INTO public.staff (
    id,
    first_name,
    last_name,
    branch_id
) VALUES (
    '550e8400-e29b-41d4-a716-446655440099'::uuid,
    'Sarah',
    'Johnson',
    '9c5613f3-2c87-4492-820d-143f634023bb'::uuid
) ON CONFLICT (id) DO NOTHING;

-- Now create the main care plan for John Michael
INSERT INTO public.client_care_plans (
    id,
    client_id,
    title,
    provider_name,
    start_date,
    end_date,
    review_date,
    status,
    care_plan_type,
    priority,
    notes,
    goals_progress,
    approved_by,
    approved_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    '76394b1f-d2e3-43f2-b0ae-4605dcb75551'::uuid,
    'Comprehensive Care Plan for John Michael',
    'Dr. Sarah Johnson',
    '2024-01-15',
    '2024-07-15',
    '2024-04-15',
    'approved',
    'comprehensive',
    'high',
    'Comprehensive care plan focusing on diabetes management, mobility improvement, and medication adherence.',
    75,
    '550e8400-e29b-41d4-a716-446655440099'::uuid,
    '2024-01-20 10:30:00'
);

-- Insert care plan goals
INSERT INTO public.client_care_plan_goals (
    id,
    care_plan_id,
    description,
    status,
    progress,
    notes
) VALUES 
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Improve mobility and reduce fall risk through regular physical therapy and strength training exercises',
    'in-progress',
    80,
    'Good progress with physical therapy. Patient showing improved balance and strength.'
),
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Maintain medication adherence above 95% through education and reminder systems',
    'in-progress',
    95,
    'Excellent medication compliance. Patient using pill organizer effectively.'
),
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Achieve target blood glucose levels (80-130 mg/dL) through diet and medication management',
    'in-progress',
    70,
    'Blood glucose levels improving but still need fine-tuning of medication timing.'
);

-- Insert medications
INSERT INTO public.client_medications (
    id,
    care_plan_id,
    name,
    dosage,
    frequency,
    start_date,
    status
) VALUES 
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Lisinopril',
    '10mg',
    'Once daily',
    '2024-01-15',
    'active'
),
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Metformin',
    '500mg',
    'Twice daily with meals',
    '2024-01-15',
    'active'
),
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Ibuprofen',
    '200mg',
    'As needed for pain',
    '2024-01-15',
    'active'
);

-- Insert activities
INSERT INTO public.client_activities (
    id,
    care_plan_id,
    name,
    description,
    frequency,
    status
) VALUES 
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Medication Review',
    'Comprehensive review of all medications with pharmacist',
    'Monthly',
    'active'
),
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Physical Assessment',
    'Complete physical examination and mobility assessment',
    'Quarterly',
    'active'
),
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Care Plan Update',
    'Review and update care plan based on progress and new needs',
    'Every 3 months',
    'active'
);

-- Insert clinical notes
INSERT INTO public.client_notes (
    id,
    client_id,
    title,
    content,
    author,
    created_at
) VALUES 
(
    gen_random_uuid(),
    '76394b1f-d2e3-43f2-b0ae-4605dcb75551'::uuid,
    'Initial Assessment',
    'Patient presents with well-controlled diabetes and hypertension. Mobility slightly limited due to arthritis. Requires assistance with some ADLs.',
    'Dr. Sarah Johnson',
    '2024-01-15 09:00:00'
),
(
    gen_random_uuid(),
    '76394b1f-d2e3-43f2-b0ae-4605dcb75551'::uuid,
    'Physical Therapy Evaluation',
    'Patient demonstrates good motivation for therapy. Balance and strength deficits noted. Recommend 2x weekly PT sessions.',
    'Mark Thompson, PT',
    '2024-01-20 14:30:00'
),
(
    gen_random_uuid(),
    '76394b1f-d2e3-43f2-b0ae-4605dcb75551'::uuid,
    'Medication Consultation',
    'Reviewed all medications with patient. Good understanding of dosing schedule. Added pill organizer to improve adherence.',
    'Lisa Chen, PharmD',
    '2024-01-25 11:15:00'
);

-- Insert documents
INSERT INTO public.client_documents (
    id,
    client_id,
    name,
    type,
    uploaded_by,
    upload_date
) VALUES 
(
    gen_random_uuid(),
    '76394b1f-d2e3-43f2-b0ae-4605dcb75551'::uuid,
    'Medical History Summary',
    'Medical Record',
    'Dr. Sarah Johnson',
    '2024-01-15'
),
(
    gen_random_uuid(),
    '76394b1f-d2e3-43f2-b0ae-4605dcb75551'::uuid,
    'Diabetes Management Plan',
    'Care Plan',
    'Dr. Sarah Johnson',
    '2024-01-16'
),
(
    gen_random_uuid(),
    '76394b1f-d2e3-43f2-b0ae-4605dcb75551'::uuid,
    'Physical Therapy Assessment',
    'Assessment',
    'Mark Thompson, PT',
    '2024-01-20'
);

-- Insert some event logs
INSERT INTO public.client_events_logs (
    id,
    client_id,
    title,
    description,
    event_type,
    severity,
    status,
    reporter,
    created_at
) VALUES 
(
    gen_random_uuid(),
    '76394b1f-d2e3-43f2-b0ae-4605dcb75551'::uuid,
    'Care Plan Approved',
    'Comprehensive care plan has been reviewed and approved by the care team',
    'Care Plan',
    'low',
    'resolved',
    'Dr. Sarah Johnson',
    '2024-01-20 10:30:00'
),
(
    gen_random_uuid(),
    '76394b1f-d2e3-43f2-b0ae-4605dcb75551'::uuid,
    'Medication Adherence Check',
    'Patient maintaining excellent medication compliance - 95% adherence rate',
    'Medication',
    'low',
    'resolved',
    'Lisa Chen, PharmD',
    '2024-02-15 09:00:00'
),
(
    gen_random_uuid(),
    '76394b1f-d2e3-43f2-b0ae-4605dcb75551'::uuid,
    'Physical Therapy Progress',
    'Patient showing significant improvement in balance and mobility',
    'Physical Therapy',
    'low',
    'resolved',
    'Mark Thompson, PT',
    '2024-03-01 15:30:00'
);
