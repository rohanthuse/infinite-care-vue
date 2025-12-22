
-- Seed System Services with care industry data (without created_by)
INSERT INTO system_services (title, category, description, code, status) VALUES
-- Personal Care
('Bathing/Showering Assistance', 'Personal Care', 'Assistance with bathing or showering including washing, drying and personal hygiene', 'PC001', 'active'),
('Dressing Assistance', 'Personal Care', 'Help with selecting appropriate clothing and getting dressed/undressed', 'PC002', 'active'),
('Toileting Support', 'Personal Care', 'Assistance with using the toilet, including continence care', 'PC003', 'active'),
('Continence Care', 'Personal Care', 'Management of incontinence including pad changes and skin care', 'PC004', 'active'),
('Oral Hygiene Care', 'Personal Care', 'Assistance with teeth brushing, denture care and mouth hygiene', 'PC005', 'active'),
('Skin Care', 'Personal Care', 'Application of creams, lotions and skin condition management', 'PC006', 'active'),
('Hair Care', 'Personal Care', 'Hair washing, brushing, styling and general hair maintenance', 'PC007', 'active'),
('Nail Care', 'Personal Care', 'Basic nail trimming and maintenance (non-clinical)', 'PC008', 'active'),
-- Medication Support
('Medication Administration', 'Medication Support', 'Administering prescribed medications as per care plan', 'MED001', 'active'),
('Medication Prompting', 'Medication Support', 'Reminding and prompting to take self-administered medications', 'MED002', 'active'),
('Medication Collection', 'Medication Support', 'Collecting prescriptions from pharmacy on behalf of client', 'MED003', 'active'),
-- Mobility Support
('Transfer Assistance', 'Mobility Support', 'Help with transfers between bed, chair, wheelchair, etc.', 'MOB001', 'active'),
('Walking Support', 'Mobility Support', 'Assistance with walking, including use of mobility aids', 'MOB002', 'active'),
('Wheelchair Assistance', 'Mobility Support', 'Help with wheelchair use, transfers and mobility', 'MOB003', 'active'),
('Hoisting Support', 'Mobility Support', 'Safe operation of hoisting equipment for transfers', 'MOB004', 'active'),
-- Domestic Support
('Meal Preparation', 'Domestic Support', 'Preparing nutritious meals and snacks according to dietary needs', 'DOM001', 'active'),
('Light Housekeeping', 'Domestic Support', 'General cleaning, tidying and maintaining a clean environment', 'DOM002', 'active'),
('Laundry Service', 'Domestic Support', 'Washing, drying, ironing and putting away clothes and linens', 'DOM003', 'active'),
('Shopping Assistance', 'Domestic Support', 'Help with grocery shopping, online ordering or accompanied shopping', 'DOM004', 'active'),
('Bed Making', 'Domestic Support', 'Making beds and changing bed linens', 'DOM005', 'active'),
-- Social Support
('Companionship', 'Social Support', 'Providing friendly company, conversation and emotional support', 'SOC001', 'active'),
('Escort to Appointments', 'Social Support', 'Accompanying to medical, social or other appointments', 'SOC002', 'active'),
('Social Activities', 'Social Support', 'Supporting participation in hobbies, games and leisure activities', 'SOC003', 'active'),
('Community Access', 'Social Support', 'Supporting access to community facilities and events', 'SOC004', 'active'),
-- Health Monitoring
('Vital Signs Monitoring', 'Health Monitoring', 'Recording blood pressure, temperature, pulse and other vitals', 'HM001', 'active'),
('Diabetes Support', 'Health Monitoring', 'Blood glucose monitoring and diabetes management support', 'HM002', 'active'),
('Wound Care', 'Health Monitoring', 'Basic wound dressing and monitoring (as delegated)', 'HM003', 'active'),
('Catheter Care', 'Health Monitoring', 'Catheter bag emptying and basic catheter maintenance', 'HM004', 'active'),
-- Night Care
('Sleep-in Service', 'Night Care', 'Overnight presence with assistance if required during the night', 'NC001', 'active'),
('Waking Night Service', 'Night Care', 'Active overnight care with regular checks and support', 'NC002', 'active'),
('Night Checks', 'Night Care', 'Scheduled overnight visits to check on wellbeing and safety', 'NC003', 'active');

-- Seed System Hobbies with common activities
INSERT INTO system_hobbies (title, status) VALUES
('Reading', 'active'),
('Gardening', 'active'),
('Watching TV', 'active'),
('Listening to Music', 'active'),
('Arts & Crafts', 'active'),
('Puzzles & Games', 'active'),
('Baking/Cooking', 'active'),
('Walking', 'active'),
('Birdwatching', 'active'),
('Knitting/Crochet', 'active'),
('Photography', 'active'),
('Painting/Drawing', 'active'),
('Dancing', 'active'),
('Singing', 'active'),
('Playing Cards', 'active'),
('Board Games', 'active'),
('Swimming', 'active'),
('Exercise/Fitness', 'active'),
('Writing', 'active'),
('Religious Activities', 'active'),
('Pet Care', 'active'),
('Fishing', 'active'),
('DIY/Woodwork', 'active'),
('Crosswords', 'active'),
('Theatre/Cinema', 'active'),
('Socialising', 'active'),
('Nature Walks', 'active'),
('Flower Arranging', 'active'),
('Sudoku', 'active'),
('Collecting', 'active');

-- Seed System Skills with carer/staff competencies
INSERT INTO system_skills (name, explanation, status) VALUES
-- Clinical Skills
('Medication Administration', 'Competence in safely administering medications following MAR charts and protocols', 'active'),
('Wound Care', 'Ability to perform basic wound dressing and care as delegated by healthcare professionals', 'active'),
('Catheter Care', 'Knowledge and competence in catheter bag management and hygiene protocols', 'active'),
('Stoma Care', 'Trained in stoma bag changes and skin care around stoma sites', 'active'),
('PEG Feeding', 'Competence in percutaneous endoscopic gastrostomy feeding procedures', 'active'),
('Blood Glucose Monitoring', 'Ability to perform blood glucose testing and record results accurately', 'active'),
('Oxygen Therapy', 'Knowledge of oxygen equipment operation and safety protocols', 'active'),
('Nebuliser Use', 'Competence in setting up and assisting with nebuliser treatments', 'active'),
('Compression Stocking Application', 'Trained in correct application and removal of compression hosiery', 'active'),
-- Moving & Handling
('Manual Handling Techniques', 'Certified in safe manual handling and moving techniques', 'active'),
('Hoist Operation', 'Competent in safe operation of various types of hoisting equipment', 'active'),
('Wheelchair Handling', 'Skilled in safe wheelchair operation and transfers', 'active'),
('Slide Sheet Use', 'Trained in correct use of slide sheets for repositioning', 'active'),
('Transfer Belt Use', 'Competent in using transfer belts for safe mobility assistance', 'active'),
-- Specialist Care
('Dementia Care', 'Trained in person-centred dementia care approaches and techniques', 'active'),
('End of Life Care', 'Competent in providing compassionate end of life support', 'active'),
('Learning Disability Support', 'Trained in supporting individuals with learning disabilities', 'active'),
('Mental Health Support', 'Knowledge of mental health conditions and appropriate support strategies', 'active'),
('Autism Awareness', 'Understanding of autism spectrum conditions and communication approaches', 'active'),
('Epilepsy Management', 'Trained in recognising and responding to seizures and epilepsy protocols', 'active'),
('Parkinsons Care', 'Knowledge of Parkinsons disease and associated care needs', 'active'),
('Stroke Rehabilitation Support', 'Trained in supporting stroke recovery and rehabilitation', 'active'),
('Challenging Behaviour Support', 'Competent in managing and de-escalating challenging behaviours', 'active'),
-- Communication
('Sign Language (Basic)', 'Basic British Sign Language communication skills', 'active'),
('Makaton', 'Trained in Makaton sign language and symbols', 'active'),
('Communication Aids Use', 'Experience with AAC devices and communication boards', 'active'),
-- Training Certifications
('First Aid', 'Current first aid certification (specify level in notes)', 'active'),
('Food Safety & Hygiene', 'Certified in food safety and hygiene (Level 2 or above)', 'active'),
('Health & Safety', 'Trained in workplace health and safety requirements', 'active'),
('Infection Control', 'Knowledge of infection prevention and control procedures', 'active'),
('Safeguarding Adults', 'Trained in adult safeguarding and abuse recognition', 'active'),
('Safeguarding Children', 'Trained in child protection and safeguarding procedures', 'active'),
('SOVA Training', 'Completed Safeguarding of Vulnerable Adults training', 'active'),
('Fire Safety', 'Trained in fire safety awareness and evacuation procedures', 'active'),
('Lone Working', 'Trained in lone working safety protocols', 'active');
