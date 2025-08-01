-- Populate David Wilson's care plan with comprehensive test data

-- Add multiple goals with different statuses and progress
INSERT INTO client_care_plan_goals (care_plan_id, description, status, progress, notes) VALUES
('8c02b892-11fe-417e-a101-71a0d2d9534c', 'Improve mobility and independence with daily walking exercises', 'in-progress', 65, 'Good progress with daily 15-minute walks, needs encouragement on rainy days'),
('8c02b892-11fe-417e-a101-71a0d2d9534c', 'Maintain social connections through weekly community activities', 'in-progress', 80, 'Attending weekly bingo sessions and book club meetings regularly'),
('8c02b892-11fe-417e-a101-71a0d2d9534c', 'Establish consistent medication routine with assistance', 'completed', 100, 'Successfully using medication organizer with staff reminders'),
('8c02b892-11fe-417e-a101-71a0d2d9534c', 'Improve nutritional intake and hydration levels', 'not-started', 0, 'Assessment scheduled with dietitian next week');

-- Add medications with detailed information
INSERT INTO client_medications (care_plan_id, name, dosage, frequency, start_date, end_date, instructions, side_effects, prescribing_doctor) VALUES
('8c02b892-11fe-417e-a101-71a0d2d9534c', 'Metformin', '500mg', 'Twice daily with meals', '2024-01-15', NULL, 'Take with breakfast and dinner to reduce stomach upset', 'Nausea, diarrhea - monitor for first 2 weeks', 'Dr. Sarah Johnson'),
('8c02b892-11fe-417e-a101-71a0d2d9534c', 'Lisinopril', '10mg', 'Once daily', '2024-01-15', NULL, 'Take at the same time each day, preferably morning', 'Dry cough, dizziness - check blood pressure weekly', 'Dr. Sarah Johnson'),
('8c02b892-11fe-417e-a101-71a0d2d9534c', 'Vitamin D3', '1000 IU', 'Once daily', '2024-02-01', '2024-08-01', 'Take with a meal containing fat for better absorption', 'Generally well tolerated', 'Dr. Sarah Johnson'),
('8c02b892-11fe-417e-a101-71a0d2d9534c', 'Aspirin', '81mg', 'Once daily', '2024-01-15', NULL, 'Take with food to reduce stomach irritation', 'Stomach upset, bleeding risk - monitor closely', 'Dr. Sarah Johnson');

-- Add activities with schedules and descriptions
INSERT INTO client_activities (care_plan_id, name, description, frequency, status, staff_notes, client_feedback) VALUES
('8c02b892-11fe-417e-a101-71a0d2d9534c', 'Morning Personal Care', 'Assistance with washing, dressing, and grooming', 'Daily at 8:00 AM', 'scheduled', 'Prefers shower on Mondays, Wednesdays, Fridays. Independent with teeth brushing.', 'Appreciates having choices in clothing'),
('8c02b892-11fe-417e-a101-71a0d2d9534c', 'Medication Administration', 'Supervised medication taking with organized pill dispenser', 'Twice daily (8 AM, 6 PM)', 'active', 'Uses color-coded pill organizer. Requires reminder for evening dose.', 'Comfortable with routine now'),
('8c02b892-11fe-417e-a101-71a0d2d9534c', 'Physiotherapy Exercises', 'Gentle mobility exercises focusing on balance and strength', 'Monday, Wednesday, Friday', 'active', 'Focus on leg strengthening and balance exercises. Duration: 30 minutes.', 'Enjoys the exercises, seeing improvement'),
('8c02b892-11fe-417e-a101-71a0d2d9534c', 'Social Activities', 'Community center visits and group activities', 'Tuesday and Thursday afternoons', 'scheduled', 'Particularly enjoys bingo and book discussions. Transportation provided.', 'Looks forward to these outings'),
('8c02b892-11fe-417e-a101-71a0d2d9534c', 'Meal Preparation Support', 'Assistance with meal planning and preparation', 'Daily - lunch and dinner', 'active', 'Prefers traditional British meals. Diabetic-friendly options prioritized.', 'Enjoys helping with simple preparation tasks');

-- Update the care plan with more comprehensive details
UPDATE client_care_plans SET
  medical_conditions = ARRAY['Type 2 Diabetes', 'Hypertension', 'Mild Arthritis', 'Vitamin D Deficiency'],
  allergies = ARRAY['Penicillin - severe reaction', 'Shellfish - mild'],
  dietary_requirements = 'Diabetic diet - low sugar, controlled carbohydrates. Prefers traditional British cuisine. Needs encouragement to drink adequate fluids.',
  emergency_contact = 'Son: Michael Wilson - 07789 123456 (Primary), Daughter: Emma Thompson - 07789 654321 (Secondary)',
  special_instructions = 'Mr. Wilson is a retired teacher who values his independence. He responds well to routine and clear explanations. Prefers to be addressed as "Mr. Wilson" initially. Has mild hearing loss in left ear - speak clearly and from his right side when possible. Enjoys discussing books and local history.',
  risk_assessments = 'Falls risk - moderate due to balance issues. Requires support rails in bathroom. Medication compliance risk - needs reminders for evening dose. Social isolation risk - benefits from regular community activities.',
  care_objectives = 'Maintain independence while ensuring safety. Support medication compliance. Encourage social engagement. Monitor diabetes management. Provide emotional support during adjustment to care services.',
  provider_name = 'Compassionate Care Services',
  updated_at = now()
WHERE id = '8c02b892-11fe-417e-a101-71a0d2d9534c';