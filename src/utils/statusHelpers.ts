
// Comprehensive status system for clients and care plans
export const CLIENT_STATUSES = {
  ACTIVE: "Active",
  NEW_ENQUIRIES: "New Enquiries", 
  ACTIVELY_ASSESSING: "Actively Assessing",
  CLOSED_ENQUIRIES: "Closed Enquiries",
  FORMER: "Former"
} as const;

export const CARE_PLAN_STATUSES = {
  ACTIVE: "Active",
  IN_PROGRESS: "In Progress", 
  COMPLETED: "Completed",
  UNDER_REVIEW: "Under Review",
  ARCHIVED: "Archived"
} as const;

// Map care plan statuses to client status equivalents where applicable
export const CARE_PLAN_TO_CLIENT_STATUS_MAP = {
  [CARE_PLAN_STATUSES.ACTIVE]: CLIENT_STATUSES.ACTIVE,
  [CARE_PLAN_STATUSES.IN_PROGRESS]: CLIENT_STATUSES.ACTIVELY_ASSESSING,
  [CARE_PLAN_STATUSES.COMPLETED]: CLIENT_STATUSES.ACTIVE,
  [CARE_PLAN_STATUSES.UNDER_REVIEW]: CLIENT_STATUSES.ACTIVELY_ASSESSING,
  [CARE_PLAN_STATUSES.ARCHIVED]: CLIENT_STATUSES.FORMER
} as const;

export const getStatusBadgeClass = (status: string) => {
  switch (status) {
    // Client statuses
    case CLIENT_STATUSES.ACTIVE:
      return "text-green-600 bg-green-50 border-green-200";
    case CLIENT_STATUSES.NEW_ENQUIRIES:
      return "text-blue-600 bg-blue-50 border-blue-200";
    case CLIENT_STATUSES.ACTIVELY_ASSESSING:
      return "text-amber-600 bg-amber-50 border-amber-200";
    case CLIENT_STATUSES.CLOSED_ENQUIRIES:
      return "text-gray-600 bg-gray-50 border-gray-200";
    case CLIENT_STATUSES.FORMER:
      return "text-red-600 bg-red-50 border-red-200";
    
    // Care plan statuses
    case CARE_PLAN_STATUSES.ACTIVE:
      return "text-green-600 bg-green-50 border-green-200";
    case CARE_PLAN_STATUSES.IN_PROGRESS:
      return "text-blue-600 bg-blue-50 border-blue-200";
    case CARE_PLAN_STATUSES.COMPLETED:
      return "text-purple-600 bg-purple-50 border-purple-200";
    case CARE_PLAN_STATUSES.UNDER_REVIEW:
      return "text-amber-600 bg-amber-50 border-amber-200";
    case CARE_PLAN_STATUSES.ARCHIVED:
      return "text-gray-600 bg-gray-50 border-gray-200";
    
    // Legacy/fallback statuses (case insensitive)
    case "active":
      return "text-green-600 bg-green-50 border-green-200";
    case "new enquiries":
    case "new_enquiries":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "actively assessing":
    case "actively_assessing":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "closed enquiries":
    case "closed_enquiries":
      return "text-gray-600 bg-gray-50 border-gray-200";
    case "former":
      return "text-red-600 bg-red-50 border-red-200";
    case "in progress":
    case "in_progress":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "completed":
      return "text-purple-600 bg-purple-50 border-purple-200";
    case "under review":
    case "under_review":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "archived":
      return "text-gray-600 bg-gray-50 border-gray-200";
    
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

export const getRiskLevelClass = (level: string) => {
  switch (level) {
    case "High":
      return "text-red-600 bg-red-50 border-red-200";
    case "Moderate":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "Low":
      return "text-green-600 bg-green-50 border-green-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

export const calculateProgressPercentage = (status: string, notes: string) => {
  if (status === "Completed" || status === "completed") return 100;
  if (status === "Active" || status === "active") return 60;
  if (status === "In Progress" || status === "in_progress" || status === "in progress") {
    const match = notes.match(/Currently at (\d+)/);
    if (match && match[1]) {
      const current = parseInt(match[1]);
      const target = notes.match(/for (\d+)/) ? parseInt(notes.match(/for (\d+)/)?.[1] || "0") : 15;
      return Math.round((current / target) * 100);
    }
    return 40;
  }
  return 10;
};

// Helper function to normalize status for consistent display
export const normalizeStatus = (status: string): string => {
  const normalized = status.toLowerCase().replace(/[_-]/g, ' ');
  
  // Convert to proper case
  return normalized.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get all available client statuses for filters/dropdowns
export const getClientStatusOptions = () => [
  { value: "all", label: "All Statuses" },
  { value: CLIENT_STATUSES.ACTIVE, label: CLIENT_STATUSES.ACTIVE },
  { value: CLIENT_STATUSES.NEW_ENQUIRIES, label: CLIENT_STATUSES.NEW_ENQUIRIES },
  { value: CLIENT_STATUSES.ACTIVELY_ASSESSING, label: CLIENT_STATUSES.ACTIVELY_ASSESSING },
  { value: CLIENT_STATUSES.CLOSED_ENQUIRIES, label: CLIENT_STATUSES.CLOSED_ENQUIRIES },
  { value: CLIENT_STATUSES.FORMER, label: CLIENT_STATUSES.FORMER }
];

// Get all available care plan statuses for filters/dropdowns
export const getCarePlanStatusOptions = () => [
  { value: "all", label: "All Statuses" },
  { value: CARE_PLAN_STATUSES.ACTIVE, label: CARE_PLAN_STATUSES.ACTIVE },
  { value: CARE_PLAN_STATUSES.IN_PROGRESS, label: CARE_PLAN_STATUSES.IN_PROGRESS },
  { value: CARE_PLAN_STATUSES.COMPLETED, label: CARE_PLAN_STATUSES.COMPLETED },
  { value: CARE_PLAN_STATUSES.UNDER_REVIEW, label: CARE_PLAN_STATUSES.UNDER_REVIEW },
  { value: CARE_PLAN_STATUSES.ARCHIVED, label: CARE_PLAN_STATUSES.ARCHIVED }
];
