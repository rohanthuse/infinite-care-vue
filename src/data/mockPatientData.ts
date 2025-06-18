export const mockPatientData = {
  patientName: "John Michael",
  patientId: "PT-2356",
  dateOfBirth: new Date("1950-03-15"),
  age: 73,
  gender: "Male",
  address: "123 Oak Street, London, SW1A 1AA",
  phone: "+44 20 7946 0958",
  email: "john.michael@email.com",
  emergencyContact: "Sarah Michael (Daughter) - +44 20 7946 0959",
  preferredLanguage: "English",
  allergies: ["Penicillin", "Shellfish", "Latex"],
  medicalConditions: ["Diabetes Type 2", "Hypertension", "Arthritis"],
  medications: [
    {
      name: "Metformin",
      dosage: "500mg",
      frequency: "Twice daily",
      purpose: "Blood sugar control"
    },
    {
      name: "Lisinopril", 
      dosage: "10mg",
      frequency: "Once daily",
      purpose: "Blood pressure management"
    },
    {
      name: "Ibuprofen",
      dosage: "400mg", 
      frequency: "As needed",
      purpose: "Pain relief"
    }
  ],
  goals: [
    {
      title: "Improve Mobility",
      description: "Increase walking distance to 500 meters without assistance",
      status: "in-progress",
      target: "500 meters",
      progress: 65,
      notes: "Good progress with physiotherapy sessions"
    },
    {
      title: "Medication Compliance",
      description: "Take all medications as prescribed without reminders",
      status: "completed",
      target: "100% compliance",
      progress: 100,
      notes: "Successfully using pill organizer system"
    },
    {
      title: "Social Engagement",
      description: "Participate in community activities at least twice per week",
      status: "not-started",
      target: "2 activities per week",
      progress: 0,
      notes: "Waiting for community center to reopen"
    }
  ],
  activities: [
    {
      date: new Date("2023-11-05"),
      action: "Physical therapy session completed",
      performer: "Lead Carer Emma Wilson",
      status: "completed"
    },
    {
      date: new Date("2023-11-04"),
      action: "Medication review and compliance check",
      performer: "Admin Sarah Johnson",
      status: "completed"
    },
    {
      date: new Date("2023-11-03"),
      action: "Blood pressure monitoring",
      performer: "Senior Carer James Miller",
      status: "completed"
    },
    {
      date: new Date("2023-11-02"),
      action: "Weekly care plan review",
      performer: "Care Team Leader Rachel Adams",
      status: "completed"
    }
  ],
  notes: [
    {
      date: new Date("2023-11-05"),
      author: "Admin",
      content: "Patient showing excellent progress with mobility exercises. Recommend continuing current physiotherapy regime."
    },
    {
      date: new Date("2023-11-04"),
      author: "Carer",
      content: "Blood sugar levels stable. Patient reports feeling more energetic and positive."
    },
    {
      date: new Date("2023-11-03"),
      author: "Admin",
      content: "Family meeting scheduled for next week to discuss care plan updates and progress."
    }
  ],
  documents: [
    {
      name: "Care Plan Assessment 2023",
      type: "Assessment",
      date: new Date("2023-11-01"),
      author: "Senior Carer Rachel Adams"
    },
    {
      name: "Medical History Summary",
      type: "Medical Record",
      date: new Date("2023-10-15"),
      author: "Admin Sarah Johnson"
    },
    {
      name: "Medication Chart Update",
      type: "Medication",
      date: new Date("2023-10-30"),
      author: "Lead Carer Emma Wilson"
    }
  ],
  assessments: [
    {
      name: "Mobility Assessment",
      date: new Date("2023-10-15"),
      performer: "Senior Carer Rachel Adams",
      status: "completed",
      results: "Moderate mobility limitations, requires walking aid"
    },
    {
      name: "Cognitive Assessment",
      date: new Date("2023-10-20"),
      performer: "Care Team Leader",
      status: "completed", 
      results: "Good cognitive function, no significant concerns"
    },
    {
      name: "Nutrition Assessment",
      date: new Date("2023-10-25"),
      performer: "Lead Carer Emma Wilson",
      status: "completed",
      results: "Adequate nutrition, recommend increased protein intake"
    }
  ],
  equipment: [
    {
      name: "Walking Frame",
      type: "Mobility Aid",
      status: "active",
      lastInspection: new Date("2023-10-01"),
      notes: "Good condition, height adjusted appropriately"
    },
    {
      name: "Blood Pressure Monitor",
      type: "Medical Device",
      status: "active", 
      lastInspection: new Date("2023-09-15"),
      notes: "Calibrated and functioning correctly"
    },
    {
      name: "Pill Organizer",
      type: "Medication Aid",
      status: "active",
      lastInspection: new Date("2023-10-30"),
      notes: "Weekly organizer, helps with compliance"
    }
  ],
  dietaryRequirements: {
    restrictions: [
      { name: "Low Sodium", reason: "Hypertension management" },
      { name: "Diabetic Diet", reason: "Blood sugar control" }
    ],
    preferences: ["Vegetarian options", "Soft textures"],
    mealPlan: "3 main meals, 2 healthy snacks",
    nutritionalNotes: "Focus on balanced nutrition with controlled carbohydrates",
    supplements: [
      { name: "Vitamin D", dosage: "1000 IU daily" },
      { name: "Calcium", dosage: "500mg twice daily" }
    ],
    hydrationPlan: "8 glasses of water daily, limit caffeine"
  },
  personalCare: {
    routines: [
      { activity: "Morning hygiene", frequency: "Daily", notes: "Requires minimal assistance" },
      { activity: "Medication administration", frequency: "As prescribed", notes: "Self-administered with supervision" },
      { activity: "Exercise routine", frequency: "3 times per week", notes: "Chair exercises and walking" }
    ],
    preferences: ["Shower over bath", "Morning care preferred", "Privacy important"],
    mobility: {
      walkingAbility: "With walking frame",
      transferAbility: "Independent with supervision",
      notes: "Good upper body strength, some lower limb weakness"
    }
  },
  riskAssessments: [
    {
      type: "Falls Risk",
      level: "Medium",
      lastAssessed: new Date("2023-10-01"),
      assessedBy: "Senior Carer Rachel Adams",
      reviewDate: new Date("2024-01-01"),
      mitigationPlan: "Walking frame provided, regular physiotherapy, home environment assessment completed"
    },
    {
      type: "Medication Safety",
      level: "Low",
      lastAssessed: new Date("2023-10-15"),
      assessedBy: "Admin Sarah Johnson", 
      reviewDate: new Date("2024-01-15"),
      mitigationPlan: "Pill organizer system, weekly medication reviews, family support"
    }
  ],
  serviceActions: [
    {
      service: "Personal Care Support",
      provider: "Lead Carer Emma Wilson",
      frequency: "Daily",
      duration: "2 hours",
      schedule: "Morning visit 9-11 AM",
      goals: ["Maintain independence", "Ensure safety"],
      progress: "Excellent"
    },
    {
      service: "Medication Management",
      provider: "Admin Sarah Johnson",
      frequency: "Weekly",
      duration: "30 minutes", 
      schedule: "Every Monday 10 AM",
      goals: ["100% medication compliance", "Monitor side effects"],
      progress: "Very Good"
    },
    {
      service: "Physiotherapy Support",
      provider: "Senior Carer Rachel Adams",
      frequency: "3 times per week",
      duration: "45 minutes",
      schedule: "Monday, Wednesday, Friday 2 PM",
      goals: ["Improve mobility", "Prevent falls"],
      progress: "Good"
    }
  ],
  aboutMe: {
    background: "Retired teacher who loves reading and gardening. Lives independently with support from family and care team.",
    hobbies: ["Reading mystery novels", "Listening to classical music", "Light gardening"],
    preferences: ["Quiet environment", "Routine schedule", "Family involvement in care decisions"],
    socialConnections: ["Weekly family visits", "Church community", "Neighbor support network"]
  }
};
