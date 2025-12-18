import { jsPDF } from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

/**
 * Brand Colors (HSL values for consistency)
 */
export const PDF_COLORS = {
  primary: { r: 59, g: 130, b: 246 }, // Blue
  primaryLight: { r: 147, g: 197, b: 253 },
  success: { r: 34, g: 197, b: 94 },
  warning: { r: 251, g: 191, b: 36 },
  danger: { r: 239, g: 68, b: 68 },
gray: {
    50: { r: 249, g: 250, b: 251 },
    100: { r: 243, g: 244, b: 246 },
    200: { r: 229, g: 231, b: 235 },
    300: { r: 209, g: 213, b: 219 },
    400: { r: 156, g: 163, b: 175 },
    500: { r: 107, g: 114, b: 128 },
    600: { r: 75, g: 85, b: 99 },
    700: { r: 55, g: 65, b: 81 },
    800: { r: 31, g: 41, b: 55 },
    900: { r: 17, g: 24, b: 39 }
  }
};

/**
 * Organization Settings Interface
 */
export interface OrganizationSettings {
  name: string;
  address: string | null;
  telephone: string | null;
  website: string | null;
  email: string | null;
  logo_url: string | null;
}

/**
 * Fetch organization/company settings from branch
 */
export const fetchOrganizationSettings = async (branchId: string): Promise<OrganizationSettings | null> => {
  try {
    // First get the organization_id from the branch
    const { data: branchData, error: branchError } = await supabase
      .from('branches')
      .select('organization_id')
      .eq('id', branchId)
      .single();

    if (branchError || !branchData?.organization_id) {
      console.error('Error fetching branch organization:', branchError);
      return null;
    }

    // Then fetch organization details
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('name, address, contact_phone, website, contact_email, logo_url')
      .eq('id', branchData.organization_id)
      .single();

    if (orgError) {
      console.error('Error fetching organization settings:', orgError);
      return null;
    }

    return {
      name: orgData.name || 'Company Name',
      address: orgData.address,
      telephone: orgData.contact_phone,
      website: orgData.website,
      email: orgData.contact_email,
      logo_url: orgData.logo_url
    };
  } catch (error) {
    console.error('Error in fetchOrganizationSettings:', error);
    return null;
  }
};

/**
 * Load image from URL and convert to base64
 */
export const loadImageAsBase64 = async (imageUrl: string): Promise<string | null> => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error('Failed to fetch image:', response.status);
      return null;
    }
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading image:', error);
    return null;
  }
};

/**
 * Get logo for PDF - tries org logo first, then falls back to default Laniwyn logo
 */
export const getLogoForPDF = async (orgSettings: OrganizationSettings | null): Promise<string | null> => {
  // Try organization logo first
  if (orgSettings?.logo_url) {
    const orgLogo = await loadImageAsBase64(orgSettings.logo_url);
    if (orgLogo) return orgLogo;
  }
  
  // Fallback to default Laniwyn logo
  try {
    const response = await fetch('/images/laniwyn-logo.png');
    if (response.ok) {
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }
  } catch (error) {
    console.error('Error loading fallback logo:', error);
  }
  
  return null;
};

/**
 * Add professional header to PDF page
 * @returns Y position where content should start
 */
export const addPDFHeader = async (
  pdf: jsPDF, 
  orgSettings: OrganizationSettings | null, 
  logoBase64: string | null
): Promise<number> => {
  const pageWidth = pdf.internal.pageSize.width;
  const leftMargin = 20;
  const rightMargin = pageWidth - 20;
  let headerY = 15;

  // LEFT SIDE: Company Information
  if (orgSettings) {
    pdf.setFontSize(11);
    pdf.setFont("helvetica", 'bold');
    pdf.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
    
    // Company Name
    pdf.text(orgSettings.name, leftMargin, headerY);
    headerY += 5;
    
    pdf.setFont("helvetica", 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
    
    // Address
    if (orgSettings.address) {
      const addressLines = pdf.splitTextToSize(orgSettings.address, 90);
      addressLines.forEach((line: string) => {
        pdf.text(line, leftMargin, headerY);
        headerY += 3.5;
      });
    }
    
    // Contact Details
    const contactDetails = [];
    if (orgSettings.telephone) contactDetails.push(`Tel: ${orgSettings.telephone}`);
    if (orgSettings.website) contactDetails.push(`Web: ${orgSettings.website}`);
    if (orgSettings.email) contactDetails.push(`Email: ${orgSettings.email}`);
    
    contactDetails.forEach(detail => {
      pdf.text(detail, leftMargin, headerY);
      headerY += 3.5;
    });
  }

  // RIGHT SIDE: Company Logo
  if (logoBase64) {
    try {
      // Detect image format from base64 string
      const getImageFormat = (base64: string): 'PNG' | 'JPEG' | 'GIF' => {
        if (base64.includes('data:image/jpeg') || base64.includes('data:image/jpg')) return 'JPEG';
        if (base64.includes('data:image/gif')) return 'GIF';
        return 'PNG'; // default fallback
      };
      
      // Position logo on right side (max width: 50, max height: 30)
      const logoX = rightMargin - 50;
      const format = getImageFormat(logoBase64);
      pdf.addImage(logoBase64, format, logoX, 12, 50, 30);
    } catch (error) {
      console.error('Error adding logo to header:', error);
    }
  }

  // Add separator line below header
  const separatorY = Math.max(headerY + 2, 45);
  pdf.setDrawColor(PDF_COLORS.gray[200].r, PDF_COLORS.gray[200].g, PDF_COLORS.gray[200].b);
  pdf.setLineWidth(0.5);
  pdf.line(leftMargin, separatorY, rightMargin, separatorY);
  
  // Reset colors
  pdf.setTextColor(0, 0, 0);
  
  return separatorY + 8; // Return Y position for content start
};

/**
 * Add professional footer to PDF page
 */
export const addPDFFooter = (
  pdf: jsPDF, 
  orgSettings: OrganizationSettings | null, 
  pageNumber: number, 
  totalPages: number,
  isConfidential: boolean = true
) => {
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const footerY = pageHeight - 15;
  
  // Add subtle line above footer
  pdf.setDrawColor(PDF_COLORS.gray[200].r, PDF_COLORS.gray[200].g, PDF_COLORS.gray[200].b);
  pdf.setLineWidth(0.3);
  pdf.line(20, footerY - 5, pageWidth - 20, footerY - 5);
  
  // Footer text
  pdf.setFontSize(8);
  pdf.setFont("helvetica", 'normal');
  pdf.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
  
  const footerText = orgSettings 
    ? `© ${orgSettings.name} | ${orgSettings.website || 'www.company.com'} | All Rights Reserved`
    : '© Company Name | All Rights Reserved';
  
  pdf.text(footerText, pageWidth / 2, footerY, { align: 'center' });
  
  // Confidential watermark
  if (isConfidential) {
    pdf.setFontSize(7);
    pdf.text('Confidential Document', 20, footerY);
  }
  
  // Page number
  pdf.setFontSize(7);
  pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 20, footerY, { align: 'right' });
  
  // Reset colors
  pdf.setTextColor(0, 0, 0);
};

/**
 * Add section header with colored background
 * @returns New Y position after header
 */
export const addSectionHeader = (
  pdf: jsPDF, 
  title: string, 
  currentY: number,
  color: { r: number; g: number; b: number } = PDF_COLORS.gray[100]
): number => {
  const pageWidth = pdf.internal.pageSize.width;
  const leftMargin = 20;
  const rightMargin = pageWidth - 20;
  
  // Section header with background
  pdf.setFillColor(color.r, color.g, color.b);
  pdf.rect(leftMargin, currentY - 5, rightMargin - leftMargin, 10, 'F');
  
  pdf.setFontSize(12);
  pdf.setFont("helvetica", 'bold');
  pdf.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
  pdf.text(title, leftMargin + 3, currentY);
  
  // Reset
  pdf.setFont("helvetica", 'normal');
  pdf.setTextColor(0, 0, 0);
  
  return currentY + 8;
};

/**
 * Add document title centered on page
 * @returns New Y position after title
 */
export const addDocumentTitle = (
  pdf: jsPDF,
  title: string,
  subtitle: string,
  currentY: number
): number => {
  const pageWidth = pdf.internal.pageSize.width;
  
  // Main title
  pdf.setFontSize(18);
  pdf.setFont("helvetica", 'bold');
  pdf.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
  pdf.text(title, pageWidth / 2, currentY, { align: 'center' });
  currentY += 7;
  
  // Subtitle
  pdf.setFontSize(9);
  pdf.setFont("helvetica", 'normal');
  pdf.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
  pdf.text(subtitle, pageWidth / 2, currentY, { align: 'center' });
  currentY += 12;
  
  // Reset text color
  pdf.setTextColor(0, 0, 0);
  
  return currentY;
};

/**
 * Check if we need a new page and add header if so
 * @returns Current Y position (either same or reset after new page)
 */
export const checkAndAddNewPage = async (
  pdf: jsPDF,
  currentY: number,
  requiredSpace: number,
  orgSettings: OrganizationSettings | null,
  logoBase64: string | null
): Promise<number> => {
  const pageHeight = pdf.internal.pageSize.height;
  
  if (currentY + requiredSpace > pageHeight - 30) {
    pdf.addPage();
    return await addPDFHeader(pdf, orgSettings, logoBase64);
  }
  
  return currentY;
};

/**
 * Add status badge to PDF
 */
export const addStatusBadge = (
  pdf: jsPDF,
  status: string,
  x: number,
  y: number
) => {
  const statusColors: Record<string, { r: number; g: number; b: number }> = {
    'Active': PDF_COLORS.success,
    'Pending': PDF_COLORS.warning,
    'Expired': PDF_COLORS.gray[500],
    'Terminated': PDF_COLORS.danger,
    'completed': PDF_COLORS.success,
    'pending': PDF_COLORS.warning,
    'cancelled': PDF_COLORS.danger,
  };
  
  const color = statusColors[status] || PDF_COLORS.gray[500];
  
  pdf.setFillColor(color.r, color.g, color.b);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", 'bold');
  
  const textWidth = pdf.getTextWidth(status);
  const padding = 3;
  
  // Draw badge background
  pdf.roundedRect(x, y - 4, textWidth + (padding * 2), 6, 1, 1, 'F');
  
  // Draw badge text
  pdf.text(status, x + padding, y);
  
  // Reset
  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", 'normal');
};

/**
 * Fetch staff names for a branch
 */
export const fetchStaffNames = async (branchId: string): Promise<Map<string, string>> => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('id, first_name, last_name')
      .eq('branch_id', branchId)
      .eq('status', 'Active');

    if (error) {
      console.error('Error fetching staff names:', error);
      return new Map();
    }

    const staffMap = new Map<string, string>();
    data?.forEach(staff => {
      const fullName = `${staff.first_name} ${staff.last_name}`.trim();
      staffMap.set(staff.id, fullName);
    });

    return staffMap;
  } catch (error) {
    console.error('Error in fetchStaffNames:', error);
    return new Map();
  }
};

/**
 * Resolve staff ID to name
 */
export const resolveStaffName = (staffId: string | undefined, staffMap: Map<string, string>): string => {
  if (!staffId) return 'Not assigned';
  return staffMap.get(staffId) || staffId;
};

/**
 * Resolve array of staff IDs to names
 */
export const resolveStaffNames = (staffIds: string[] | undefined, staffMap: Map<string, string>): string => {
  if (!staffIds || staffIds.length === 0) return 'None';
  return staffIds
    .map(id => staffMap.get(id) || id)
    .join(', ');
};
