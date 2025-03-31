
import { Training, TrainingMatrix, TrainingStatus, StaffMember, TrainingCategory } from "@/types/training";

// Sample trainings data
export const mockTrainings: Training[] = [
  {
    id: "training-1",
    title: "Manual Handling",
    category: "core",
    description: "Basic techniques for safe manual handling in healthcare settings",
    status: "completed",
    validFor: 12,
    dueDate: "2025-05-15",
    completionDate: "2024-05-15",
    score: 95,
    maxScore: 100
  },
  {
    id: "training-2",
    title: "Infection Control",
    category: "mandatory",
    description: "Procedures to prevent and control infection",
    status: "completed",
    validFor: 12,
    dueDate: "2025-03-10",
    completionDate: "2024-03-10",
    score: 98,
    maxScore: 100
  },
  {
    id: "training-3",
    title: "First Aid",
    category: "core",
    description: "Basic first aid procedures in emergency situations",
    status: "in-progress",
    validFor: 24,
    dueDate: "2025-06-22"
  },
  {
    id: "training-4",
    title: "Safeguarding Adults",
    category: "mandatory",
    description: "Procedures for ensuring the safety of vulnerable adults",
    status: "expired",
    validFor: 12,
    dueDate: "2024-02-05",
    completionDate: "2023-02-05",
    score: 90,
    maxScore: 100
  },
  {
    id: "training-5",
    title: "Medication Administration",
    category: "specialized",
    description: "Safe handling and administration of medications",
    status: "completed",
    validFor: 12,
    dueDate: "2025-07-30",
    completionDate: "2024-07-30",
    score: 92,
    maxScore: 100
  },
  {
    id: "training-6",
    title: "Dementia Care",
    category: "specialized",
    description: "Person-centered approaches to dementia care",
    status: "not-started",
    validFor: 12,
    dueDate: "2024-08-15"
  },
  {
    id: "training-7",
    title: "End of Life Care",
    category: "specialized",
    description: "Compassionate care for patients at the end of life",
    status: "in-progress",
    validFor: 24,
    dueDate: "2025-01-20"
  },
  {
    id: "training-8",
    title: "Health & Safety",
    category: "mandatory",
    description: "Workplace health and safety procedures",
    status: "completed",
    validFor: 12,
    dueDate: "2025-04-05",
    completionDate: "2024-04-05",
    score: 100,
    maxScore: 100
  },
  {
    id: "training-9",
    title: "Food Hygiene",
    category: "optional",
    description: "Safe handling and preparation of food",
    status: "not-started",
    validFor: 36,
    dueDate: "2024-11-10"
  }
];

// Sample staff members
export const mockStaffMembers: StaffMember[] = [
  {
    id: "staff-1",
    name: "Sarah Johnson",
    role: "Registered Nurse",
    department: "Nursing",
    avatar: "/avatars/sarah.jpg",
    trainingCompleted: 7,
    trainingTotal: 9
  },
  {
    id: "staff-2",
    name: "Michael Brown",
    role: "Healthcare Assistant",
    department: "Care",
    avatar: "/avatars/michael.jpg",
    trainingCompleted: 5,
    trainingTotal: 9
  },
  {
    id: "staff-3",
    name: "Emily Parker",
    role: "Senior Carer",
    department: "Care",
    avatar: "/avatars/emily.jpg",
    trainingCompleted: 8,
    trainingTotal: 9
  },
  {
    id: "staff-4",
    name: "David Wilson",
    role: "Care Coordinator",
    department: "Administration",
    avatar: "/avatars/placeholder.svg",
    trainingCompleted: 6,
    trainingTotal: 9
  },
  {
    id: "staff-5",
    name: "Lisa Adams",
    role: "Physiotherapist",
    department: "Therapy",
    avatar: "/avatars/lisa.jpg",
    trainingCompleted: 4,
    trainingTotal: 9
  }
];

// Generate mock training matrix data
export const generateTrainingMatrix = (): TrainingMatrix => {
  const data: Record<string, Record<string, any>> = {};
  
  mockStaffMembers.forEach(staff => {
    data[staff.id] = {};
    
    mockTrainings.forEach(training => {
      // Randomly assign training statuses to create varied data
      const statuses: TrainingStatus[] = ['completed', 'in-progress', 'expired', 'not-started'];
      const randomIndex = Math.floor(Math.random() * statuses.length);
      const status = statuses[randomIndex];
      
      let completionDate, expiryDate, score;
      
      if (status === 'completed' || status === 'expired') {
        // Generate a random completion date in the past
        const completionDays = Math.floor(Math.random() * 365);
        const completionDateObj = new Date();
        completionDateObj.setDate(completionDateObj.getDate() - completionDays);
        completionDate = completionDateObj.toISOString().split('T')[0];
        
        // If training has a validFor period, calculate expiry date
        if (training.validFor) {
          const expiryDateObj = new Date(completionDateObj);
          expiryDateObj.setMonth(expiryDateObj.getMonth() + training.validFor);
          expiryDate = expiryDateObj.toISOString().split('T')[0];
          
          // If current date is past expiry date, ensure status is 'expired'
          const currentStatus = status;
          if (new Date() > expiryDateObj && currentStatus === 'completed') {
            data[staff.id][training.id] = { 
              status: 'expired', 
              completionDate, 
              expiryDate 
            };
            // Skip the rest of the current iteration and move to the next one
            return; // Using return instead of continue in the forEach callback
          }
        }
        
        // Generate a random score for completed trainings
        score = Math.floor(Math.random() * 30) + 70; // Score between 70-100
      }
      
      data[staff.id][training.id] = {
        status,
        ...(completionDate && { completionDate }),
        ...(expiryDate && { expiryDate }),
        ...(score && { score, maxScore: 100 })
      };
    });
  });
  
  return {
    staffMembers: mockStaffMembers,
    trainings: mockTrainings,
    data
  };
};

// Get training categories with counts
export const getTrainingCategories = (): {category: TrainingCategory, count: number}[] => {
  const categoryCounts: Record<TrainingCategory, number> = {
    core: 0,
    mandatory: 0,
    specialized: 0,
    optional: 0
  };
  
  mockTrainings.forEach(training => {
    categoryCounts[training.category]++;
  });
  
  return Object.entries(categoryCounts).map(([category, count]) => ({
    category: category as TrainingCategory,
    count
  }));
};

// Filter trainings by category
export const filterTrainingsByCategory = (trainings: Training[], category: TrainingCategory | 'all'): Training[] => {
  if (category === 'all') return trainings;
  return trainings.filter(training => training.category === category);
};

// Get the training matrix data
export const getTrainingMatrix = (): TrainingMatrix => {
  return generateTrainingMatrix();
};
