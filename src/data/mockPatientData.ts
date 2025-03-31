
// Create a separate file for mock data
export const mockPatientData = {
  gender: "Male",
  dateOfBirth: new Date("1956-03-15"),
  address: "123 Main Street, Cityville, State, 12345",
  phone: "(555) 123-4567",
  email: "john.michael@example.com",
  emergencyContact: "Sarah Michael (Daughter) - (555) 987-6543",
  preferredLanguage: "English",
  allergies: ["Penicillin", "Shellfish"],
  medicalConditions: ["Hypertension", "Type 2 Diabetes", "Arthritis"],
  medications: [
    { name: "Lisinopril", dosage: "10mg", frequency: "Once daily", purpose: "Blood pressure" },
    { name: "Metformin", dosage: "500mg", frequency: "Twice daily", purpose: "Diabetes management" },
    { name: "Ibuprofen", dosage: "400mg", frequency: "As needed", purpose: "Pain relief" }
  ],
  aboutMe: {
    preferences: [
      "Prefers to be called 'John' rather than 'Mr. Michael'",
      "Enjoys reading the newspaper in the morning",
      "Prefers showers in the evening rather than morning",
      "Enjoys classical music during relaxation time"
    ],
    routines: [
      "Morning walk after breakfast (weather permitting)",
      "Afternoon nap between 2-3 PM",
      "Evening television from 7-9 PM",
      "Bedtime reading for 30 minutes before sleep"
    ],
    interests: [
      "Classical music (particularly Mozart and Beethoven)",
      "Gardening (maintains a small herb garden)",
      "Chess (intermediate player)",
      "History documentaries"
    ],
    dislikes: [
      "Loud environments",
      "Spicy food",
      "Being rushed during activities",
      "Cold room temperatures"
    ]
  },
  goals: [
    { title: "Improve mobility", status: "In Progress", target: "Walk unassisted for 15 minutes", notes: "Currently at 8 minutes with walking frame" },
    { title: "Medication adherence", status: "Active", target: "100% medication compliance", notes: "Using pill organizer effectively" },
    { title: "Blood glucose management", status: "Active", target: "Maintain levels between 80-130 mg/dL", notes: "Morning readings occasionally high" },
  ],
  activities: [
    { date: new Date("2023-11-10"), action: "Medication review", performer: "Dr. Emma Lewis", status: "Completed" },
    { date: new Date("2023-11-05"), action: "Physical assessment", performer: "Nurse David Brown", status: "Completed" },
    { date: new Date("2023-10-25"), action: "Care plan update", performer: "Dr. Sarah Johnson", status: "Completed" },
  ],
  notes: [
    { date: new Date("2023-11-08"), author: "Nurse David Brown", content: "Patient reported mild discomfort in left knee. Applied cold compress and recommended rest. Will monitor." },
    { date: new Date("2023-11-01"), author: "Dr. Sarah Johnson", content: "Blood pressure readings have improved with current medication. Continuing current dosage and monitoring." },
    { date: new Date("2023-10-20"), author: "Dr. Emma Lewis", content: "Patient has been adhering well to diabetes management plan. Blood glucose levels stable." },
  ],
  documents: [
    { name: "Medical History Summary", date: new Date("2023-09-15"), type: "PDF", author: "Dr. Emma Lewis" },
    { name: "Diabetes Management Plan", date: new Date("2023-09-20"), type: "DOCX", author: "Dr. Sarah Johnson" },
    { name: "Physical Therapy Assessment", date: new Date("2023-10-10"), type: "PDF", author: "Nurse David Brown" },
  ],
  assessments: [
    { 
      name: "Mobility Assessment", 
      date: new Date("2023-10-15"), 
      status: "Completed", 
      performer: "Nurse David Brown",
      results: "Patient shows limited mobility in left leg. Can walk with frame for 8-10 minutes before requiring rest. Balance is fair but should be monitored."
    },
    { 
      name: "Cognitive Assessment", 
      date: new Date("2023-09-25"), 
      status: "Completed", 
      performer: "Dr. Emma Lewis",
      results: "Patient is alert and oriented. Memory function is good, with slight delay in recall of recent events. No significant cognitive concerns noted."
    },
  ],
  equipment: [
    { name: "Walking Frame", type: "Mobility Aid", status: "In Use", notes: "Checked monthly", lastInspection: new Date("2023-10-30") },
    { name: "Shower Chair", type: "Bathroom Aid", status: "In Use", notes: "Stable condition", lastInspection: new Date("2023-11-05") },
    { name: "Hospital Bed", type: "Bedroom Aid", status: "In Use", notes: "Electric controls working properly", lastInspection: new Date("2023-10-15") },
    { name: "Oxygen Concentrator", type: "Medical Device", status: "Available", notes: "Only used when needed", lastInspection: new Date("2023-11-10") }
  ],
  dietaryRequirements: {
    mealPlan: "Low sodium diabetic diet plan",
    restrictions: [
      { name: "Low Sodium", reason: "Hypertension management", severity: "Strict" },
      { name: "Low Sugar", reason: "Diabetes management", severity: "Moderate" },
      { name: "No Shellfish", reason: "Allergy", severity: "Critical" }
    ],
    preferences: [
      "Prefers meals to be warm, not hot",
      "Enjoys fruit as dessert",
      "Prefers small, frequent meals",
      "Dislikes most dairy products except cheese"
    ],
    supplements: [
      { name: "Calcium + Vitamin D", dosage: "500mg", frequency: "Daily", purpose: "Bone health" },
      { name: "Multivitamin", dosage: "1 tablet", frequency: "Morning", purpose: "Nutritional supplement" }
    ],
    hydrationPlan: "Minimum 8 glasses of water daily, monitored with checklist",
    nutritionalNotes: "Patient struggles with maintaining adequate hydration. Family has been advised to encourage fluid intake throughout the day."
  },
  personalCare: {
    routines: [
      { activity: "Morning hygiene", frequency: "Daily" },
      { activity: "Evening bath", frequency: "3 times per week" },
      { activity: "Hair washing", frequency: "Twice weekly" },
      { activity: "Nail care", frequency: "Weekly" }
    ],
    preferences: [
      "Prefers warmer water temperature",
      "Likes to use own toiletries",
      "Prefers male caregiver for personal care",
      "Likes to dress in button-up shirts"
    ],
    mobility: {
      status: "Limited mobility",
      transferAbility: "Requires one-person assist",
      walkingDistance: "Up to 10 meters with frame",
      stairs: "Unable to manage stairs",
      notes: "Better mobility in the morning, fatigue increases throughout day"
    }
  },
  riskAssessments: [
    {
      type: "Fall Risk",
      level: "Moderate",
      lastAssessed: new Date("2023-10-20"),
      assessedBy: "Nurse David Brown",
      mitigationPlan: "Walking frame use, clear pathways, night light",
      reviewDate: new Date("2023-12-20")
    },
    {
      type: "Pressure Ulcer Risk",
      level: "Low",
      lastAssessed: new Date("2023-10-15"),
      assessedBy: "Dr. Emma Lewis",
      mitigationPlan: "Regular position changes, pressure relieving mattress",
      reviewDate: new Date("2023-12-15")
    }
  ],
  serviceActions: [
    {
      service: "Personal Care",
      provider: "Home Care Assistant",
      frequency: "Daily",
      duration: "45 minutes",
      schedule: "Morning and Evening",
      goals: ["Improve hygiene", "Maintain dignity"],
      progress: "Meeting needs"
    },
    {
      service: "Medication Management",
      provider: "Nurse",
      frequency: "Weekly",
      duration: "30 minutes",
      schedule: "Monday mornings",
      goals: ["Medication compliance", "Health monitoring"],
      progress: "Stable"
    }
  ]
};
