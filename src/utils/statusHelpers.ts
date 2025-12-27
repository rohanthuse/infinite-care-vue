
// Comprehensive status system for clients and care plans
export const CLIENT_STATUSES = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  NEW_ENQUIRIES: "New Enquiries", 
  ACTIVELY_ASSESSING: "Actively Assessing",
  CLOSED_ENQUIRIES: "Closed Enquiries",
  FORMER: "Former",
  ARCHIVED: "Archived"
} as const;

export const CARE_PLAN_STATUSES = {
  DRAFT: "Draft",
  UNDER_REVIEW: "Under Review",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived"
} as const;

// Map care plan statuses to client status equivalents where applicable
export const CARE_PLAN_TO_CLIENT_STATUS_MAP = {
  [CARE_PLAN_STATUSES.DRAFT]: CLIENT_STATUSES.NEW_ENQUIRIES,
  [CARE_PLAN_STATUSES.UNDER_REVIEW]: CLIENT_STATUSES.ACTIVELY_ASSESSING,
  [CARE_PLAN_STATUSES.ACTIVE]: CLIENT_STATUSES.ACTIVE,
  [CARE_PLAN_STATUSES.ON_HOLD]: CLIENT_STATUSES.ACTIVELY_ASSESSING,
  [CARE_PLAN_STATUSES.COMPLETED]: CLIENT_STATUSES.ACTIVE,
  [CARE_PLAN_STATUSES.ARCHIVED]: CLIENT_STATUSES.FORMER
} as const;

export const getStatusBadgeClass = (status: string) => {
  const normalizedStatus = normalizeStatus(status);
  
  // CRITICAL: Suspended status gets highest priority with special styling
  if (normalizedStatus === 'Suspended') {
    return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700 font-bold animate-pulse';
  }
  
  switch (status) {
    // Client statuses
    case CLIENT_STATUSES.ACTIVE:
      return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700";
    case CLIENT_STATUSES.INACTIVE:
      return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700";
    case CLIENT_STATUSES.NEW_ENQUIRIES:
      return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700";
    case CLIENT_STATUSES.ACTIVELY_ASSESSING:
      return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700";
    case CLIENT_STATUSES.CLOSED_ENQUIRIES:
      return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600";
    case CLIENT_STATUSES.FORMER:
      return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700";
    case CLIENT_STATUSES.ARCHIVED:
      return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600";
    
    // Care plan statuses
    case CARE_PLAN_STATUSES.DRAFT:
      return "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-600";
    case CARE_PLAN_STATUSES.UNDER_REVIEW:
      return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700";
    case CARE_PLAN_STATUSES.ACTIVE:
      return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700";
    case CARE_PLAN_STATUSES.ON_HOLD:
      return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700";
    case CARE_PLAN_STATUSES.COMPLETED:
      return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700";
    case CARE_PLAN_STATUSES.ARCHIVED:
      return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600";
    
    // Care plan approval statuses
    case "pending_approval":
      return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700";
    case "pending_client_approval":
      return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700";
    case "approved":
      return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700";
    case "rejected":
      return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700";
    
    // Legacy/fallback statuses (case insensitive)
    case "active":
      return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700";
    case "inactive":
      return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700";
    case "new enquiries":
    case "new_enquiries":
      return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700";
    case "actively assessing":
    case "actively_assessing":
      return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700";
    case "closed enquiries":
    case "closed_enquiries":
      return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600";
    case "former":
      return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700";
    case "draft":
      return "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-600";
    case "on hold":
    case "on_hold":
      return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700";
    case "completed":
      return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700";
    case "under review":
    case "under_review":
      return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700";
    case "archived":
      return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600";
    
    default:
      return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600";
  }
};

export const getRiskLevelClass = (level: string) => {
  switch (level) {
    case "High":
      return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700";
    case "Moderate":
      return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700";
    case "Low":
      return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700";
    default:
      return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600";
  }
};

export const calculateProgressPercentage = (status: string, notes: string) => {
  if (status === "Completed" || status === "completed") return 100;
  if (status === "Active" || status === "active") return 60;
  if (status === "Draft" || status === "draft") return 10;
  if (status === "Under Review" || status === "under_review" || status === "under review") return 25;
  if (status === "On Hold" || status === "on_hold" || status === "on hold") return 40;
  if (status === "Archived" || status === "archived") return 100;
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
  { value: CLIENT_STATUSES.INACTIVE, label: CLIENT_STATUSES.INACTIVE },
  { value: CLIENT_STATUSES.NEW_ENQUIRIES, label: CLIENT_STATUSES.NEW_ENQUIRIES },
  { value: CLIENT_STATUSES.ACTIVELY_ASSESSING, label: CLIENT_STATUSES.ACTIVELY_ASSESSING },
  { value: CLIENT_STATUSES.CLOSED_ENQUIRIES, label: CLIENT_STATUSES.CLOSED_ENQUIRIES },
  { value: CLIENT_STATUSES.FORMER, label: CLIENT_STATUSES.FORMER },
  { value: CLIENT_STATUSES.ARCHIVED, label: CLIENT_STATUSES.ARCHIVED }
];

// Get all available care plan statuses for filters/dropdowns
export const getCarePlanStatusOptions = () => [
  { value: "all", label: "All Statuses" },
  { value: CARE_PLAN_STATUSES.DRAFT, label: CARE_PLAN_STATUSES.DRAFT },
  { value: CARE_PLAN_STATUSES.UNDER_REVIEW, label: CARE_PLAN_STATUSES.UNDER_REVIEW },
  { value: CARE_PLAN_STATUSES.ACTIVE, label: CARE_PLAN_STATUSES.ACTIVE },
  { value: CARE_PLAN_STATUSES.ON_HOLD, label: CARE_PLAN_STATUSES.ON_HOLD },
  { value: CARE_PLAN_STATUSES.COMPLETED, label: CARE_PLAN_STATUSES.COMPLETED },
  { value: CARE_PLAN_STATUSES.ARCHIVED, label: CARE_PLAN_STATUSES.ARCHIVED }
];

/**
 * Get status badge with icon for better visual indication
 * Particularly useful for suspended status
 */
export const getStatusBadgeWithIcon = (status: string): { text: string; icon: string; class: string } => {
  const normalizedStatus = normalizeStatus(status);
  const badgeClass = getStatusBadgeClass(status);
  
  if (normalizedStatus === 'Suspended') {
    return {
      text: 'Suspended',
      icon: 'ban',
      class: badgeClass
    };
  }
  
  if (normalizedStatus === 'Active') {
    return {
      text: 'Active',
      icon: 'check-circle',
      class: badgeClass
    };
  }
  
  if (normalizedStatus === 'Pending') {
    return {
      text: 'Pending',
      icon: 'clock',
      class: badgeClass
    };
  }
  
  return {
    text: normalizedStatus,
    icon: 'circle',
    class: badgeClass
  };
};
