
-- First, update the care plan assignment from Dr. Emily Smith to Jane Smith
UPDATE client_care_plans 
SET 
  provider_name = 'Jane Smith',
  staff_id = '4aff0c04-3a58-4c45-96bc-2ffed62d9467',
  updated_at = now()
WHERE id = 'aba7debb-233d-436c-9f6a-3900f79df14b';

-- Add personal information for Peter Jones
INSERT INTO client_personal_info (
  client_id, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
  preferred_communication, cultural_preferences, language_preferences, religion, marital_status,
  next_of_kin_name, next_of_kin_phone, next_of_kin_relationship,
  gp_name, gp_practice, gp_phone
) VALUES (
  '9706fa5b-cd8f-4b23-96e4-6f9d903c4246',
  'Sarah Jones', '+44 7800 123456', 'Daughter',
  'phone', 'British', 'English', 'Christian', 'Widowed',
  'Sarah Jones', '+44 7800 123456', 'Daughter',
  'Dr. Michael Brown', 'Greenwood Medical Centre', '+44 20 7946 0958'
);

-- Add medical information for Peter Jones
INSERT INTO client_medical_info (
  client_id, allergies, current_medications, medical_conditions, medical_history,
  mental_health_status, sensory_impairments, communication_needs, cognitive_status, mobility_status
) VALUES (
  '9706fa5b-cd8f-4b23-96e4-6f9d903c4246',
  ARRAY['Penicillin', 'Shellfish'],
  ARRAY['Metformin 500mg', 'Ramipril 5mg', 'Aspirin 75mg'],
  ARRAY['Type 2 Diabetes', 'Hypertension', 'Mild Arthritis'],
  'Previous history of minor stroke in 2019. Recovered well with physiotherapy.',
  'Generally stable, occasional mild anxiety',
  ARRAY['Hearing aid required'],
  'Speaks clearly, may need hearing aid for conversations',
  'Mild memory concerns, generally alert and oriented',
  'Uses walking stick for stability, can walk short distances'
);

-- Add personal care information for Peter Jones
INSERT INTO client_personal_care (
  client_id, personal_hygiene_needs, bathing_preferences, dressing_assistance_level,
  toileting_assistance_level, continence_status, sleep_patterns, behavioral_notes,
  comfort_measures, pain_management, skin_care_needs
) VALUES (
  '9706fa5b-cd8f-4b23-96e4-6f9d903c4246',
  'Requires assistance with washing back and feet',
  'Prefers morning baths, shower chair recommended',
  'Minimal assistance needed, help with socks and shoes',
  'Independent with supervision',
  'Continent, occasional urgency',
  'Sleeps 7-8 hours, early riser, afternoon nap',
  'Generally pleasant, becomes anxious about new routines',
  'Enjoys classical music, warm blankets, family photos nearby',
  'Paracetamol as needed for arthritis pain',
  'Dry skin on legs, requires daily moisturizing'
);

-- Add dietary requirements for Peter Jones
INSERT INTO client_dietary_requirements (
  client_id, dietary_restrictions, food_allergies, food_preferences,
  nutritional_needs, supplements, feeding_assistance_required, weight_monitoring,
  special_equipment_needed, texture_modifications, fluid_restrictions,
  meal_schedule
) VALUES (
  '9706fa5b-cd8f-4b23-96e4-6f9d903c4246',
  ARRAY['Low sodium', 'Diabetic diet'],
  ARRAY['Shellfish'],
  ARRAY['Traditional British food', 'Tea with meals', 'Fish and chips'],
  'Regular monitoring of blood glucose levels',
  ARRAY['Vitamin D', 'Omega-3'],
  false,
  true,
  'None required',
  'Normal texture, soft foods preferred',
  'None specific',
  '{"breakfast": "8:00 AM", "lunch": "12:30 PM", "dinner": "6:00 PM", "snacks": "3:00 PM, 8:00 PM"}'::jsonb
);

-- Add clinical notes for Peter Jones
INSERT INTO client_notes (client_id, title, content, author) VALUES 
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'Initial Assessment', 
 'Peter is settling in well to his new care routine. He is cooperative and friendly. Blood pressure stable at 140/85. Blood glucose levels within target range. He enjoys watching cricket and talking about his grandchildren.', 
 'Jane Smith'),
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'Medication Review', 
 'Reviewed current medications with GP. Metformin dosage remains appropriate. Patient reports no side effects. Compliance is good with daily pill organizer.', 
 'Dr. Michael Brown'),
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'Mobility Assessment', 
 'Peter can walk approximately 50 meters with his walking stick. Balance is stable but requires supervision on stairs. Physiotherapy recommended to maintain current mobility levels.', 
 'Jane Smith'),
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'Family Visit', 
 'Daughter Sarah visited today. Peter was delighted and animated during the visit. Discussed care plan progress. Sarah is very supportive and will visit weekly.', 
 'Care Assistant'),
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'Dietary Review', 
 'Working with Peter to adjust meal preferences. He particularly enjoys traditional Sunday roast. Blood sugar levels remain stable with current meal plan. Hydration adequate.', 
 'Nutritionist');

-- Add risk assessments for Peter Jones
INSERT INTO client_risk_assessments (
  client_id, risk_type, risk_level, assessment_date, assessed_by,
  risk_factors, mitigation_strategies, review_date
) VALUES 
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'Falls Risk', 'Medium', CURRENT_DATE, 'Jane Smith',
 ARRAY['Uses walking stick', 'Mild balance issues', 'History of minor stroke'],
 ARRAY['Regular mobility assessments', 'Clear pathways', 'Good lighting', 'Supervision on stairs'],
 CURRENT_DATE + INTERVAL '3 months'),
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'Medication Management', 'Low', CURRENT_DATE, 'Jane Smith',
 ARRAY['Multiple medications', 'Mild memory concerns'],
 ARRAY['Daily pill organizer', 'Regular medication reviews', 'Family support'],
 CURRENT_DATE + INTERVAL '6 months'),
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'Social Isolation', 'Low', CURRENT_DATE, 'Social Worker',
 ARRAY['Recently widowed', 'Limited mobility'],
 ARRAY['Regular family visits', 'Community activities', 'Peer support groups'],
 CURRENT_DATE + INTERVAL '3 months');

-- Add equipment records for Peter Jones
INSERT INTO client_equipment (
  client_id, equipment_name, equipment_type, manufacturer, model_number,
  installation_date, status, location, notes
) VALUES 
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'Walking Stick', 'Mobility Aid', 'Comfort Plus', 'WS-100',
 '2024-01-15', 'active', 'Personal possession', 'Height adjusted for optimal support'),
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'Shower Chair', 'Bathroom Aid', 'Safety First', 'SC-250',
 '2024-01-20', 'active', 'Bathroom', 'Non-slip feet, adjustable height'),
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'Blood Glucose Monitor', 'Medical Device', 'OneTouch', 'Ultra2',
 '2024-01-10', 'active', 'Bedroom', 'Daily monitoring, sufficient test strips available'),
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'Hearing Aid', 'Assistive Device', 'ReSound', 'HA-5000',
 '2023-12-01', 'active', 'Personal possession', 'Behind-the-ear model, battery changed weekly');

-- Add service actions for Peter Jones
INSERT INTO client_service_actions (
  client_id, care_plan_id, service_name, service_category, provider_name,
  start_date, frequency, duration, goals, progress_status, notes
) VALUES 
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'aba7debb-233d-436c-9f6a-3900f79df14b',
 'Personal Care Assistance', 'Daily Living Support', 'Jane Smith',
 '2024-01-01', 'Daily', '2 hours',
 ARRAY['Maintain independence', 'Ensure safety', 'Monitor health'],
 'active', 'Morning and evening care visits'),
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'aba7debb-233d-436c-9f6a-3900f79df14b',
 'Medication Management', 'Healthcare', 'Jane Smith',
 '2024-01-01', 'Daily', '15 minutes',
 ARRAY['Ensure medication compliance', 'Monitor side effects'],
 'active', 'Daily pill organizer check and glucose monitoring'),
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'aba7debb-233d-436c-9f6a-3900f79df14b',
 'Mobility Support', 'Physical Therapy', 'Physiotherapist',
 '2024-01-15', 'Weekly', '1 hour',
 ARRAY['Maintain current mobility', 'Prevent deterioration'],
 'active', 'Weekly physiotherapy sessions to maintain strength and balance');

-- Add activity records for Peter Jones
INSERT INTO client_activities (
  care_plan_id, name, description, frequency, status
) VALUES 
('aba7debb-233d-436c-9f6a-3900f79df14b', 'Daily Walking Exercise',
 'Short walks in the garden or around the house with walking stick for 15-20 minutes',
 'Daily', 'active'),
('aba7debb-233d-436c-9f6a-3900f79df14b', 'Blood Glucose Monitoring',
 'Check blood glucose levels twice daily before main meals',
 'Twice Daily', 'active'),
('aba7debb-233d-436c-9f6a-3900f79df14b', 'Social Activities',
 'Participate in weekly community activities, family visits, and phone calls with friends',
 'Weekly', 'active'),
('aba7debb-233d-436c-9f6a-3900f79df14b', 'Medication Review',
 'Weekly review of medication compliance and any side effects with care provider',
 'Weekly', 'active');

-- Add event logs for Peter Jones
INSERT INTO client_events_logs (
  client_id, title, description, event_type, severity, reporter, status
) VALUES 
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'Care Plan Initiated',
 'Comprehensive care plan established with Jane Smith as primary carer. Initial assessments completed.',
 'care_plan', 'low', 'Jane Smith', 'closed'),
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'Medication Adjustment',
 'GP reviewed medications. Metformin timing adjusted to improve glucose control.',
 'medical', 'low', 'Dr. Michael Brown', 'closed'),
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'Family Meeting',
 'Met with daughter Sarah to discuss care progress and future planning. Very positive feedback.',
 'family', 'low', 'Jane Smith', 'closed'),
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'Equipment Installation',
 'Shower chair and safety equipment installed in bathroom. Peter trained on proper use.',
 'equipment', 'low', 'Equipment Technician', 'closed'),
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'Health Review',
 'Monthly health review completed. All vital signs stable. Continue current care plan.',
 'medical', 'low', 'Jane Smith', 'closed');

-- Add assessment records for Peter Jones (removed performed_by_id to avoid foreign key constraint)
INSERT INTO client_assessments (
  client_id, care_plan_id, assessment_name, assessment_type, assessment_date,
  performed_by, score, results, recommendations, next_review_date
) VALUES 
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'aba7debb-233d-436c-9f6a-3900f79df14b',
 'Barthel Index', 'Functional Assessment', CURRENT_DATE, 'Jane Smith',
 85, 'Good level of independence in most activities of daily living. Requires minimal assistance.',
 'Continue current support level. Monitor for any decline in function.',
 CURRENT_DATE + INTERVAL '6 months'),
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'aba7debb-233d-436c-9f6a-3900f79df14b',
 'Mini Mental State Exam', 'Cognitive Assessment', CURRENT_DATE, 'Dr. Michael Brown',
 26, 'Mild cognitive concerns but generally alert and oriented. Memory slightly affected.',
 'Annual cognitive assessments. Engage in mental stimulation activities.',
 CURRENT_DATE + INTERVAL '12 months'),
('9706fa5b-cd8f-4b23-96e4-6f9d903c4246', 'aba7debb-233d-436c-9f6a-3900f79df14b',
 'Nutritional Screening', 'Dietary Assessment', CURRENT_DATE, 'Nutritionist',
 3, 'Well-nourished. Diabetic diet well-managed. Good appetite and hydration.',
 'Continue current dietary plan. Regular weight monitoring.',
 CURRENT_DATE + INTERVAL '3 months');
