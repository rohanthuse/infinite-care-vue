
// Utility to map display care plan IDs to actual database UUIDs
// Updated to use real database UUIDs and rely on database display_id

const carePlanIdMapping: Record<string, string> = {
  'CP-001': '550e8400-e29b-41d4-a716-446655440001', // John Michael's care plan (REAL UUID)
  'CP-002': 'aba7debb-233d-436c-9f6a-3900f79df14b', // Emily Smith's care plan (REAL UUID)
  'CP-003': '550e8400-e29b-41d4-a716-446655440003', // Wendy Smith's care plan
  'CP-004': '550e8400-e29b-41d4-a716-446655440004', // Robert Johnson's care plan
  'CP-005': '550e8400-e29b-41d4-a716-446655440005', // Lisa Rodrigues's care plan
  'CP-006': '550e8400-e29b-41d4-a716-446655440006', // David Wilson's care plan
  'CP-007': '550e8400-e29b-41d4-a716-446655440007', // Kate Williams's care plan
  'CP-008': '550e8400-e29b-41d4-a716-446655440008', // Olivia Parker's care plan
};

// Reverse mapping for display purposes
const uuidToDisplayId: Record<string, string> = Object.fromEntries(
  Object.entries(carePlanIdMapping).map(([displayId, uuid]) => [uuid, displayId])
);

export const resolveCarePlanId = (carePlanId: string): string => {
  console.log(`[resolveCarePlanId] Input ID: ${carePlanId}`);
  
  // If it's already a full UUID, return as is
  if (carePlanId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    console.log(`[resolveCarePlanId] Valid full UUID: ${carePlanId}`);
    return carePlanId;
  }
  
  // Check if it's a display ID (CP-001 format) - use mapping for backward compatibility
  if (carePlanIdMapping[carePlanId]) {
    const resolvedId = carePlanIdMapping[carePlanId];
    console.log(`[resolveCarePlanId] Display ID ${carePlanId} mapped to UUID: ${resolvedId}`);
    return resolvedId;
  }
  
  // If no mapping found, return the original ID (might be a new UUID)
  console.warn(`[resolveCarePlanId] No mapping found for ${carePlanId}, using as-is`);
  return carePlanId;
};

export const getDisplayCarePlanId = (uuid: string): string => {
  // First check direct UUID mapping for backward compatibility
  if (uuidToDisplayId[uuid]) {
    return uuidToDisplayId[uuid];
  }
  
  // If it's already a display ID, return as is
  if (uuid.startsWith('CP-')) {
    return uuid;
  }
  
  // Default: return the UUID (should not happen with new system)
  return uuid;
};

// Helper function to convert database UUIDs to display IDs for navigation
export const getNavigationId = (id: string): string => {
  console.log(`[getNavigationId] Converting ID for navigation: ${id}`);
  
  // If it's already a display ID, use it
  if (id.startsWith('CP-')) {
    console.log(`[getNavigationId] Already display ID: ${id}`);
    return id;
  }
  
  // Check if it's a full UUID and we have a mapping
  if (uuidToDisplayId[id]) {
    const displayId = uuidToDisplayId[id];
    console.log(`[getNavigationId] Full UUID ${id} converted to display ID: ${displayId}`);
    return displayId;
  }
  
  console.warn(`[getNavigationId] Could not convert ID ${id}, using as-is`);
  return id;
};
