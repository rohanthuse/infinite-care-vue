
import { FormMatrix, FormCategory, Form, StaffMember, FormStatus } from "@/types/form";

// Function to generate a random date within a range
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};

// Mock forms data
const mockForms: Form[] = [
  {
    id: "form-1",
    title: "Emergency Contact",
    category: "onboarding",
    description: "Emergency contact information for staff member",
    status: "completed",
    validFor: 12,
  },
  {
    id: "form-2",
    title: "Health Declaration",
    category: "medical",
    description: "Health declaration and medical information",
    status: "completed",
    validFor: 6,
  },
  {
    id: "form-3",
    title: "Performance Review",
    category: "feedback",
    description: "Quarterly performance review form",
    status: "in-progress",
    validFor: 3,
  },
  {
    id: "form-4",
    title: "Risk Assessment",
    category: "assessment",
    description: "Workplace risk assessment form",
    status: "completed",
    validFor: 12,
  },
  {
    id: "form-5",
    title: "Compliance Acknowledgment",
    category: "compliance",
    description: "GDPR and data protection compliance",
    status: "not-started",
    validFor: 12,
  },
  {
    id: "form-6",
    title: "Skills Assessment",
    category: "assessment",
    description: "Technical skills and competencies assessment",
    status: "in-progress",
    validFor: 6,
  },
  {
    id: "form-7",
    title: "Code of Conduct",
    category: "compliance",
    description: "Company code of conduct acknowledgment",
    status: "completed",
    validFor: 24,
  },
  {
    id: "form-8",
    title: "Equipment Checklist",
    category: "onboarding",
    description: "IT and equipment inventory checklist",
    status: "not-started",
    validFor: 12,
  }
];

// Mock staff members
const mockStaffMembers: StaffMember[] = [
  {
    id: "staff-1",
    name: "John Smith",
    role: "Senior Caregiver",
    department: "Elderly Care",
    formsCompleted: 5,
    formsTotal: 8,
  },
  {
    id: "staff-2",
    name: "Emma Johnson",
    role: "Nurse Practitioner",
    department: "Medical",
    formsCompleted: 7,
    formsTotal: 8,
  },
  {
    id: "staff-3",
    name: "Michael Chen",
    role: "Caregiver",
    department: "Disability Support",
    formsCompleted: 4,
    formsTotal: 8,
  },
  {
    id: "staff-4",
    name: "Sarah Williams",
    role: "Physiotherapist",
    department: "Rehabilitation",
    formsCompleted: 6,
    formsTotal: 8,
  },
  {
    id: "staff-5",
    name: "David Miller",
    role: "Care Assistant",
    department: "Elderly Care",
    formsCompleted: 3,
    formsTotal: 8,
  }
];

// Function to create a random form status
const getRandomStatus = (): FormStatus => {
  const statuses: FormStatus[] = ['completed', 'in-progress', 'not-started', 'approved', 'rejected'];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

// Create mock form matrix data
export const getFormMatrix = (): FormMatrix => {
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(today.getFullYear() + 1);
  
  // Generate form data for each staff member
  const formData: Record<string, Record<string, any>> = {};
  
  mockStaffMembers.forEach(staff => {
    formData[staff.id] = {};
    
    mockForms.forEach(form => {
      const status = getRandomStatus();
      const completionDate = status === 'completed' || status === 'approved' ? 
        randomDate(oneYearAgo, today) : undefined;
      
      let expiryDate;
      if (completionDate && form.validFor) {
        const expiry = new Date(completionDate);
        expiry.setMonth(expiry.getMonth() + form.validFor);
        expiryDate = expiry.toISOString().split('T')[0];
      }
      
      formData[staff.id][form.id] = {
        status,
        completionDate,
        expiryDate,
        lastUpdated: randomDate(oneYearAgo, today),
        comments: status === 'rejected' ? "Please resubmit with additional information" : undefined
      };
    });
  });
  
  return {
    staffMembers: mockStaffMembers,
    forms: mockForms,
    data: formData
  };
};

// Function to count forms by category
export const getFormCategories = () => {
  const categories = [
    { category: 'onboarding' as FormCategory, count: mockForms.filter(form => form.category === 'onboarding').length },
    { category: 'assessment' as FormCategory, count: mockForms.filter(form => form.category === 'assessment').length },
    { category: 'feedback' as FormCategory, count: mockForms.filter(form => form.category === 'feedback').length },
    { category: 'medical' as FormCategory, count: mockForms.filter(form => form.category === 'medical').length },
    { category: 'compliance' as FormCategory, count: mockForms.filter(form => form.category === 'compliance').length },
  ];
  
  return categories;
};
