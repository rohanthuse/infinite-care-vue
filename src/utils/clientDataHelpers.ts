
/**
 * Utility function to safely extract client name from Supabase relation data
 */
export const getClientName = (clientData: any): string => {
  if (!clientData) return 'Unknown Client';
  
  if (Array.isArray(clientData)) {
    const firstClient = clientData[0];
    return firstClient ? `${firstClient.first_name || ''} ${firstClient.last_name || ''}`.trim() : 'Unknown Client';
  } else {
    return `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim();
  }
};

/**
 * Utility function to safely extract staff name from Supabase relation data
 */
export const getStaffName = (staffData: any): string => {
  if (!staffData) return 'Unknown Staff';
  
  if (Array.isArray(staffData)) {
    const firstStaff = staffData[0];
    return firstStaff ? `${firstStaff.first_name || ''} ${firstStaff.last_name || ''}`.trim() : 'Unknown Staff';
  } else {
    return `${staffData.first_name || ''} ${staffData.last_name || ''}`.trim();
  }
};
