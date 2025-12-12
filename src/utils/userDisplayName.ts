/**
 * Utility function to get a display name for a user with proper fallbacks.
 * Priority: fullName > firstName + lastName > email prefix > "Unknown"
 */
export const getUserDisplayName = (user: {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
} | null | undefined): string => {
  if (!user) return 'Unknown';
  
  // Try full name first
  if (user.fullName && user.fullName.trim()) {
    return user.fullName.trim();
  }
  
  // Try combining first and last name
  const combinedName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  if (combinedName) {
    return combinedName;
  }
  
  // Fall back to email prefix (without domain for cleaner display)
  if (user.email) {
    const emailPrefix = user.email.split('@')[0];
    // Capitalize first letter and replace dots/underscores with spaces
    return emailPrefix
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }
  
  return 'Unknown';
};
