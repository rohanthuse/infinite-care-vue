
export const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "Active": return "text-green-600 bg-green-50 border-green-200";
    case "In Progress": return "text-blue-600 bg-blue-50 border-blue-200";
    case "Completed": return "text-purple-600 bg-purple-50 border-purple-200";
    case "Under Review": return "text-amber-600 bg-amber-50 border-amber-200";
    case "Archived": return "text-gray-600 bg-gray-50 border-gray-200";
    default: return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

export const getRiskLevelClass = (level: string) => {
  switch (level) {
    case "High": return "text-red-600 bg-red-50 border-red-200";
    case "Moderate": return "text-amber-600 bg-amber-50 border-amber-200";
    case "Low": return "text-green-600 bg-green-50 border-green-200";
    default: return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

export const calculateProgressPercentage = (status: string, notes: string) => {
  if (status === "Completed") return 100;
  if (status === "Active") return 60;
  if (status === "In Progress") {
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
