
// Mapping utility to handle mock care plan IDs to real database UUIDs
export const carePlanIdMapping: Record<string, string> = {
  'CP-001': '550e8400-e29b-41d4-a716-446655440001', // John Michael's care plan UUID
  'CP-002': '550e8400-e29b-41d4-a716-446655440002', // Emma Thompson's care plan UUID (if needed later)
};

// Function to get the real UUID from mock ID or return the original if it's already a UUID
export const resolveCarePlanId = (id: string): string => {
  // Check if it's a mock ID that needs mapping
  if (carePlanIdMapping[id]) {
    return carePlanIdMapping[id];
  }
  
  // If it's already a UUID format, return as is
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id;
  }
  
  // If it's neither a mock ID nor a UUID, return the original
  return id;
};

// Function to get display ID (for showing in UI - can be mock ID for familiarity)
export const getDisplayCarePlanId = (id: string): string => {
  // Find the mock ID that maps to this UUID
  const mockId = Object.keys(carePlanIdMapping).find(
    mockKey => carePlanIdMapping[mockKey] === id
  );
  
  return mockId || id;
};
