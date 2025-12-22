-- =============================================
-- SEED SYSTEM MEDICAL CATEGORIES
-- =============================================
INSERT INTO public.system_medical_categories (name, status) VALUES
('Cardiovascular', 'active'),
('Respiratory', 'active'),
('Neurological', 'active'),
('Musculoskeletal', 'active'),
('Endocrine & Metabolic', 'active'),
('Gastrointestinal', 'active'),
('Mental Health', 'active'),
('Sensory', 'active'),
('Skin & Wound', 'active'),
('Urological', 'active'),
('Infectious Diseases', 'active'),
('Allergies', 'active');

-- =============================================
-- SEED SYSTEM MEDICAL CONDITIONS
-- =============================================
-- Cardiovascular conditions
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Heart Failure', id, 'Client has heart failure', 'active' FROM public.system_medical_categories WHERE name = 'Cardiovascular';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Hypertension', id, 'Client has high blood pressure', 'active' FROM public.system_medical_categories WHERE name = 'Cardiovascular';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Angina', id, 'Client has angina', 'active' FROM public.system_medical_categories WHERE name = 'Cardiovascular';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Atrial Fibrillation', id, 'Client has irregular heartbeat', 'active' FROM public.system_medical_categories WHERE name = 'Cardiovascular';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Stroke', id, 'Client has had a stroke', 'active' FROM public.system_medical_categories WHERE name = 'Cardiovascular';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Deep Vein Thrombosis', id, 'Client has DVT', 'active' FROM public.system_medical_categories WHERE name = 'Cardiovascular';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Peripheral Vascular Disease', id, 'Client has PVD', 'active' FROM public.system_medical_categories WHERE name = 'Cardiovascular';

-- Respiratory conditions
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'COPD', id, 'Client has chronic obstructive pulmonary disease', 'active' FROM public.system_medical_categories WHERE name = 'Respiratory';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Asthma', id, 'Client has asthma', 'active' FROM public.system_medical_categories WHERE name = 'Respiratory';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Pneumonia', id, 'Client has or is prone to pneumonia', 'active' FROM public.system_medical_categories WHERE name = 'Respiratory';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Pulmonary Fibrosis', id, 'Client has pulmonary fibrosis', 'active' FROM public.system_medical_categories WHERE name = 'Respiratory';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Sleep Apnoea', id, 'Client has sleep apnoea', 'active' FROM public.system_medical_categories WHERE name = 'Respiratory';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Bronchiectasis', id, 'Client has bronchiectasis', 'active' FROM public.system_medical_categories WHERE name = 'Respiratory';

-- Neurological conditions
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Dementia', id, 'Client has dementia', 'active' FROM public.system_medical_categories WHERE name = 'Neurological';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Alzheimer''s Disease', id, 'Client has Alzheimer''s disease', 'active' FROM public.system_medical_categories WHERE name = 'Neurological';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Parkinson''s Disease', id, 'Client has Parkinson''s disease', 'active' FROM public.system_medical_categories WHERE name = 'Neurological';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Epilepsy', id, 'Client has epilepsy', 'active' FROM public.system_medical_categories WHERE name = 'Neurological';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Multiple Sclerosis', id, 'Client has MS', 'active' FROM public.system_medical_categories WHERE name = 'Neurological';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Motor Neurone Disease', id, 'Client has MND', 'active' FROM public.system_medical_categories WHERE name = 'Neurological';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Acquired Brain Injury', id, 'Client has acquired brain injury', 'active' FROM public.system_medical_categories WHERE name = 'Neurological';

-- Musculoskeletal conditions
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Arthritis', id, 'Client has arthritis', 'active' FROM public.system_medical_categories WHERE name = 'Musculoskeletal';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Rheumatoid Arthritis', id, 'Client has rheumatoid arthritis', 'active' FROM public.system_medical_categories WHERE name = 'Musculoskeletal';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Osteoporosis', id, 'Client has osteoporosis', 'active' FROM public.system_medical_categories WHERE name = 'Musculoskeletal';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Fractures', id, 'Client has fractures', 'active' FROM public.system_medical_categories WHERE name = 'Musculoskeletal';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Joint Replacement', id, 'Client has had joint replacement', 'active' FROM public.system_medical_categories WHERE name = 'Musculoskeletal';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Chronic Back Pain', id, 'Client has chronic back pain', 'active' FROM public.system_medical_categories WHERE name = 'Musculoskeletal';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Fibromyalgia', id, 'Client has fibromyalgia', 'active' FROM public.system_medical_categories WHERE name = 'Musculoskeletal';

-- Endocrine & Metabolic conditions
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Diabetes Type 1', id, 'Client has Type 1 diabetes', 'active' FROM public.system_medical_categories WHERE name = 'Endocrine & Metabolic';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Diabetes Type 2', id, 'Client has Type 2 diabetes', 'active' FROM public.system_medical_categories WHERE name = 'Endocrine & Metabolic';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Hypothyroidism', id, 'Client has underactive thyroid', 'active' FROM public.system_medical_categories WHERE name = 'Endocrine & Metabolic';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Hyperthyroidism', id, 'Client has overactive thyroid', 'active' FROM public.system_medical_categories WHERE name = 'Endocrine & Metabolic';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Obesity', id, 'Client has obesity', 'active' FROM public.system_medical_categories WHERE name = 'Endocrine & Metabolic';

-- Gastrointestinal conditions
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Irritable Bowel Syndrome', id, 'Client has IBS', 'active' FROM public.system_medical_categories WHERE name = 'Gastrointestinal';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Crohn''s Disease', id, 'Client has Crohn''s disease', 'active' FROM public.system_medical_categories WHERE name = 'Gastrointestinal';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Ulcerative Colitis', id, 'Client has ulcerative colitis', 'active' FROM public.system_medical_categories WHERE name = 'Gastrointestinal';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'GERD', id, 'Client has gastroesophageal reflux disease', 'active' FROM public.system_medical_categories WHERE name = 'Gastrointestinal';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Dysphagia', id, 'Client has swallowing difficulties', 'active' FROM public.system_medical_categories WHERE name = 'Gastrointestinal';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Coeliac Disease', id, 'Client has coeliac disease', 'active' FROM public.system_medical_categories WHERE name = 'Gastrointestinal';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'PEG Feeding', id, 'Client requires PEG feeding', 'active' FROM public.system_medical_categories WHERE name = 'Gastrointestinal';

-- Mental Health conditions
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Depression', id, 'Client has depression', 'active' FROM public.system_medical_categories WHERE name = 'Mental Health';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Anxiety Disorder', id, 'Client has anxiety disorder', 'active' FROM public.system_medical_categories WHERE name = 'Mental Health';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Bipolar Disorder', id, 'Client has bipolar disorder', 'active' FROM public.system_medical_categories WHERE name = 'Mental Health';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Schizophrenia', id, 'Client has schizophrenia', 'active' FROM public.system_medical_categories WHERE name = 'Mental Health';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'PTSD', id, 'Client has post-traumatic stress disorder', 'active' FROM public.system_medical_categories WHERE name = 'Mental Health';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'OCD', id, 'Client has obsessive-compulsive disorder', 'active' FROM public.system_medical_categories WHERE name = 'Mental Health';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Eating Disorder', id, 'Client has an eating disorder', 'active' FROM public.system_medical_categories WHERE name = 'Mental Health';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Learning Disability', id, 'Client has a learning disability', 'active' FROM public.system_medical_categories WHERE name = 'Mental Health';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Autism Spectrum Disorder', id, 'Client is on the autism spectrum', 'active' FROM public.system_medical_categories WHERE name = 'Mental Health';

-- Sensory conditions
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Visual Impairment', id, 'Client has visual impairment', 'active' FROM public.system_medical_categories WHERE name = 'Sensory';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Hearing Loss', id, 'Client has hearing loss', 'active' FROM public.system_medical_categories WHERE name = 'Sensory';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Macular Degeneration', id, 'Client has macular degeneration', 'active' FROM public.system_medical_categories WHERE name = 'Sensory';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Glaucoma', id, 'Client has glaucoma', 'active' FROM public.system_medical_categories WHERE name = 'Sensory';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Cataracts', id, 'Client has cataracts', 'active' FROM public.system_medical_categories WHERE name = 'Sensory';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Registered Blind', id, 'Client is registered blind', 'active' FROM public.system_medical_categories WHERE name = 'Sensory';

-- Skin & Wound conditions
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Pressure Ulcers', id, 'Client has pressure ulcers', 'active' FROM public.system_medical_categories WHERE name = 'Skin & Wound';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Eczema', id, 'Client has eczema', 'active' FROM public.system_medical_categories WHERE name = 'Skin & Wound';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Psoriasis', id, 'Client has psoriasis', 'active' FROM public.system_medical_categories WHERE name = 'Skin & Wound';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Leg Ulcers', id, 'Client has leg ulcers', 'active' FROM public.system_medical_categories WHERE name = 'Skin & Wound';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Diabetic Wounds', id, 'Client has diabetes-related wounds', 'active' FROM public.system_medical_categories WHERE name = 'Skin & Wound';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Skin Tears', id, 'Client is prone to skin tears', 'active' FROM public.system_medical_categories WHERE name = 'Skin & Wound';

-- Urological conditions
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Urinary Incontinence', id, 'Client has urinary incontinence', 'active' FROM public.system_medical_categories WHERE name = 'Urological';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Faecal Incontinence', id, 'Client has faecal incontinence', 'active' FROM public.system_medical_categories WHERE name = 'Urological';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Catheter Use', id, 'Client uses a catheter', 'active' FROM public.system_medical_categories WHERE name = 'Urological';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Chronic Kidney Disease', id, 'Client has chronic kidney disease', 'active' FROM public.system_medical_categories WHERE name = 'Urological';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Prostate Issues', id, 'Client has prostate issues', 'active' FROM public.system_medical_categories WHERE name = 'Urological';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'UTI Prone', id, 'Client is prone to urinary tract infections', 'active' FROM public.system_medical_categories WHERE name = 'Urological';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Stoma Care', id, 'Client requires stoma care', 'active' FROM public.system_medical_categories WHERE name = 'Urological';

-- Infectious Diseases
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'MRSA', id, 'Client has MRSA', 'active' FROM public.system_medical_categories WHERE name = 'Infectious Diseases';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'C. Difficile', id, 'Client has C. Difficile', 'active' FROM public.system_medical_categories WHERE name = 'Infectious Diseases';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Hepatitis B', id, 'Client has Hepatitis B', 'active' FROM public.system_medical_categories WHERE name = 'Infectious Diseases';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Hepatitis C', id, 'Client has Hepatitis C', 'active' FROM public.system_medical_categories WHERE name = 'Infectious Diseases';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'HIV/AIDS', id, 'Client has HIV/AIDS', 'active' FROM public.system_medical_categories WHERE name = 'Infectious Diseases';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Tuberculosis', id, 'Client has tuberculosis', 'active' FROM public.system_medical_categories WHERE name = 'Infectious Diseases';

-- Allergies
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Penicillin Allergy', id, 'Client is allergic to penicillin', 'active' FROM public.system_medical_categories WHERE name = 'Allergies';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Drug Allergies', id, 'Client has drug allergies', 'active' FROM public.system_medical_categories WHERE name = 'Allergies';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Nut Allergy', id, 'Client has a nut allergy', 'active' FROM public.system_medical_categories WHERE name = 'Allergies';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Shellfish Allergy', id, 'Client has shellfish allergy', 'active' FROM public.system_medical_categories WHERE name = 'Allergies';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Dairy Allergy', id, 'Client has dairy allergy', 'active' FROM public.system_medical_categories WHERE name = 'Allergies';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Gluten Intolerance', id, 'Client has gluten intolerance', 'active' FROM public.system_medical_categories WHERE name = 'Allergies';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Latex Allergy', id, 'Client has latex allergy', 'active' FROM public.system_medical_categories WHERE name = 'Allergies';
INSERT INTO public.system_medical_conditions (title, category_id, field_caption, status)
SELECT 'Hay Fever', id, 'Client has hay fever', 'active' FROM public.system_medical_categories WHERE name = 'Allergies';

-- =============================================
-- SEED SYSTEM WORK TYPES
-- =============================================
INSERT INTO public.system_work_types (title, status) VALUES
-- Shift Types
('Day Shift', 'active'),
('Night Shift', 'active'),
('Sleep-In', 'active'),
('Waking Night', 'active'),
('Live-In Care', 'active'),
-- Call Types
('Morning Call', 'active'),
('Lunchtime Call', 'active'),
('Tea-Time Call', 'active'),
('Evening Call', 'active'),
('Bed-Time Call', 'active'),
-- Visit Types
('Double-Up Visit', 'active'),
('Solo Visit', 'active'),
('Personal Care Visit', 'active'),
('Medication Round', 'active'),
('Welfare Check', 'active'),
-- Care Types
('Respite Care', 'active'),
('Palliative Care', 'active'),
('Dementia Care', 'active'),
('Complex Care', 'active'),
('Reablement', 'active'),
-- Cover Types
('Emergency Cover', 'active'),
('Bank Shift', 'active'),
('Weekend Shift', 'active'),
('Holiday Cover', 'active'),
('On-Call', 'active'),
-- Admin Types
('Training Day', 'active'),
('Supervision', 'active'),
('Team Meeting', 'active'),
('Handover', 'active'),
('Assessment Visit', 'active');

-- =============================================
-- SEED SYSTEM BODY MAP POINTS
-- =============================================
INSERT INTO public.system_body_map_points (letter, title, color, status) VALUES
-- Head & Neck (Red tones)
('A', 'Head (Front)', '#E53935', 'active'),
('B', 'Head (Back)', '#C62828', 'active'),
('C', 'Face', '#EF5350', 'active'),
('D', 'Neck (Front)', '#F44336', 'active'),
('E', 'Neck (Back)', '#D32F2F', 'active'),
-- Shoulders & Upper Arms (Orange tones)
('F', 'Right Shoulder', '#FB8C00', 'active'),
('G', 'Left Shoulder', '#F57C00', 'active'),
('H', 'Right Upper Arm', '#FF9800', 'active'),
('I', 'Left Upper Arm', '#EF6C00', 'active'),
-- Elbows & Forearms (Yellow tones)
('J', 'Right Elbow', '#FDD835', 'active'),
('K', 'Left Elbow', '#FBC02D', 'active'),
('L', 'Right Forearm', '#FFEB3B', 'active'),
('M', 'Left Forearm', '#F9A825', 'active'),
-- Hands (Light Green tones)
('N', 'Right Hand', '#7CB342', 'active'),
('O', 'Left Hand', '#689F38', 'active'),
-- Torso Front (Green tones)
('P', 'Chest', '#43A047', 'active'),
('Q', 'Abdomen', '#388E3C', 'active'),
('R', 'Ribs (Right)', '#66BB6A', 'active'),
('S', 'Ribs (Left)', '#4CAF50', 'active'),
-- Torso Back (Teal tones)
('T', 'Upper Back', '#00897B', 'active'),
('U', 'Lower Back', '#00796B', 'active'),
('V', 'Spine', '#009688', 'active'),
-- Hips & Groin (Blue tones)
('W', 'Right Hip', '#1E88E5', 'active'),
('X', 'Left Hip', '#1976D2', 'active'),
('Y', 'Groin', '#2196F3', 'active'),
('Z', 'Buttocks', '#1565C0', 'active'),
-- Thighs (Indigo tones)
('AA', 'Right Thigh (Front)', '#5C6BC0', 'active'),
('BB', 'Left Thigh (Front)', '#3F51B5', 'active'),
('CC', 'Right Thigh (Back)', '#3949AB', 'active'),
('DD', 'Left Thigh (Back)', '#303F9F', 'active'),
-- Knees (Purple tones)
('EE', 'Right Knee', '#8E24AA', 'active'),
('FF', 'Left Knee', '#7B1FA2', 'active'),
-- Lower Legs (Pink tones)
('GG', 'Right Lower Leg (Front)', '#EC407A', 'active'),
('HH', 'Left Lower Leg (Front)', '#D81B60', 'active'),
('II', 'Right Lower Leg (Back)', '#F06292', 'active'),
('JJ', 'Left Lower Leg (Back)', '#E91E63', 'active'),
-- Ankles (Brown tones)
('KK', 'Right Ankle', '#8D6E63', 'active'),
('LL', 'Left Ankle', '#795548', 'active'),
-- Feet (Grey tones)
('MM', 'Right Foot (Top)', '#78909C', 'active'),
('NN', 'Left Foot (Top)', '#607D8B', 'active'),
('OO', 'Right Foot (Sole)', '#546E7A', 'active'),
('PP', 'Left Foot (Sole)', '#455A64', 'active');