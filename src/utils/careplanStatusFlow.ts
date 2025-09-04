import { CARE_PLAN_STATUSES } from "./statusHelpers";

// Care Plan Status Flow and Descriptions
export const CARE_PLAN_STATUS_DESCRIPTIONS = {
  [CARE_PLAN_STATUSES.DRAFT]: {
    description: "Initial stage where the care plan is being created and refined. Not yet ready for client review.",
    nextSteps: ["Submit for Review", "Continue Editing"],
    allowedTransitions: [CARE_PLAN_STATUSES.UNDER_REVIEW, CARE_PLAN_STATUSES.ARCHIVED]
  },
  [CARE_PLAN_STATUSES.UNDER_REVIEW]: {
    description: "Care plan is being reviewed by supervisors or healthcare professionals before activation.",
    nextSteps: ["Approve and Activate", "Request Changes", "Reject"],
    allowedTransitions: [CARE_PLAN_STATUSES.ACTIVE, CARE_PLAN_STATUSES.DRAFT, CARE_PLAN_STATUSES.ARCHIVED]
  },
  [CARE_PLAN_STATUSES.ACTIVE]: {
    description: "Care plan is currently being implemented and services are being delivered to the client.",
    nextSteps: ["Put on Hold", "Mark Complete", "Review and Update"],
    allowedTransitions: [CARE_PLAN_STATUSES.ON_HOLD, CARE_PLAN_STATUSES.COMPLETED, CARE_PLAN_STATUSES.UNDER_REVIEW, CARE_PLAN_STATUSES.ARCHIVED]
  },
  [CARE_PLAN_STATUSES.ON_HOLD]: {
    description: "Care plan is temporarily paused due to client needs, circumstances, or external factors.",
    nextSteps: ["Reactivate", "Archive", "Review"],
    allowedTransitions: [CARE_PLAN_STATUSES.ACTIVE, CARE_PLAN_STATUSES.ARCHIVED, CARE_PLAN_STATUSES.UNDER_REVIEW]
  },
  [CARE_PLAN_STATUSES.COMPLETED]: {
    description: "All care plan objectives have been achieved and the plan has been successfully finished.",
    nextSteps: ["Archive", "Create Follow-up Plan"],
    allowedTransitions: [CARE_PLAN_STATUSES.ARCHIVED, CARE_PLAN_STATUSES.ACTIVE] // Can reactivate if needed
  },
  [CARE_PLAN_STATUSES.ARCHIVED]: {
    description: "Care plan is no longer active and has been stored for historical reference only.",
    nextSteps: ["Reference Only"],
    allowedTransitions: [] // Generally final state
  }
};

// Recommended Care Plan Lifecycle Flow
export const RECOMMENDED_CARE_PLAN_FLOW = [
  CARE_PLAN_STATUSES.DRAFT,
  CARE_PLAN_STATUSES.UNDER_REVIEW,
  CARE_PLAN_STATUSES.ACTIVE,
  CARE_PLAN_STATUSES.COMPLETED,
  CARE_PLAN_STATUSES.ARCHIVED
];

// Alternative flow paths
export const ALTERNATIVE_FLOW_PATHS = {
  EMERGENCY_HOLD: [
    CARE_PLAN_STATUSES.ACTIVE,
    CARE_PLAN_STATUSES.ON_HOLD,
    CARE_PLAN_STATUSES.ACTIVE
  ],
  REVISION_CYCLE: [
    CARE_PLAN_STATUSES.ACTIVE,
    CARE_PLAN_STATUSES.UNDER_REVIEW,
    CARE_PLAN_STATUSES.ACTIVE
  ],
  EARLY_TERMINATION: [
    CARE_PLAN_STATUSES.ACTIVE,
    CARE_PLAN_STATUSES.ARCHIVED
  ]
};

export const getStatusHelp = (status: string): string => {
  const statusInfo = CARE_PLAN_STATUS_DESCRIPTIONS[status as keyof typeof CARE_PLAN_STATUS_DESCRIPTIONS];
  return statusInfo?.description || "Status information not available.";
};

export const getNextSteps = (status: string): string[] => {
  const statusInfo = CARE_PLAN_STATUS_DESCRIPTIONS[status as keyof typeof CARE_PLAN_STATUS_DESCRIPTIONS];
  return statusInfo?.nextSteps || [];
};

export const canTransitionTo = (currentStatus: string, targetStatus: string): boolean => {
  const statusInfo = CARE_PLAN_STATUS_DESCRIPTIONS[currentStatus as keyof typeof CARE_PLAN_STATUS_DESCRIPTIONS];
  return statusInfo?.allowedTransitions.includes(targetStatus) || false;
};