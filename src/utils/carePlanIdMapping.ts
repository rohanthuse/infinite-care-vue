// Utility to map display care plan IDs to actual database UUIDs
// This handles the mapping between CP-001 style IDs and actual UUIDs

const carePlanIdMapping: Record<string, string> = {
  'CP-001': '550e8400-e29b-41d4-a716-446655440000', // John Michael's care plan
  'CP-002': '550e8400-e29b-41d4-a716-446655440001', // Emma Thompson's care plan
  'CP-003': '550e8400-e29b-41d4-a716-446655440002', // Wendy Smith's care plan
  'CP-004': '550e8400-e29b-41d4-a716-446655440003', // Robert Johnson's care plan
  'CP-005': '550e8400-e29b-41d4-a716-446655440004', // Lisa Rodrigues's care plan
  'CP-006': '550e8400-e29b-41d4-a716-446655440005', // David Wilson's care plan
  'CP-007': '550e8400-e29b-41d4-a716-446655440006', // Kate Williams's care plan
  'CP-008': '550e8400-e29b-41d4-a716-446655440007', // Olivia Parker's care plan
};

// Reverse mapping for display purposes
const uuidToDisplayId: Record<string, string> = Object.fromEntries(
  Object.entries(carePlanIdMapping).map(([displayId, uuid]) => [uuid, displayId])
);

export const resolveCarePlanId = (carePlanId: string): string => {
  // If it's already a UUID, return as is
  if (carePlanId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return carePlanId;
  }
  
  // Otherwise, try to resolve from mapping
  const resolvedId = carePlanIdMapping[carePlanId];
  if (resolvedId) {
    console.log(`[resolveCarePlanId] Mapped ${carePlanId} to ${resolvedId}`);
    return resolvedId;
  }
  
  // If no mapping found, return the original ID (might be a new UUID)
  console.warn(`[resolveCarePlanId] No mapping found for ${carePlanId}, using as-is`);
  return carePlanId;
};

export const getDisplayCarePlanId = (uuid: string): string => {
  return uuidToDisplayId[uuid] || uuid;
};
