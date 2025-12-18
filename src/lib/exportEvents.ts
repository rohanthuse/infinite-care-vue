import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Helper function to fetch staff names for a branch
const fetchStaffNames = async (branchId: string): Promise<Map<string, string>> => {
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

// Helper function to resolve staff ID to name
const resolveStaffName = (staffId: string | undefined, staffMap: Map<string, string>): string => {
  if (!staffId) return 'Not assigned';
  return staffMap.get(staffId) || staffId;
};

// Helper function to resolve array of staff IDs to names
const resolveStaffNames = (staffIds: string[] | undefined, staffMap: Map<string, string>): string => {
  if (!staffIds || staffIds.length === 0) return 'None';
  return staffIds
    .map(id => staffMap.get(id) || id)
    .join(', ');
};

// Helper function to load image from URL and convert to base64
const loadImageAsBase64 = async (imageUrl: string): Promise<string | null> => {
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

// Helper function to fetch organization/company settings
const fetchOrganizationSettings = async (branchId: string): Promise<{
  name: string;
  branchName: string | null;
  address: string | null;
  telephone: string | null;
  website: string | null;
  email: string | null;
  logo_url: string | null;
} | null> => {
  try {
    // First get the organization_id and branch name from the branch
    const { data: branchData, error: branchError } = await supabase
      .from('branches')
      .select('organization_id, name')
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
      branchName: branchData.name || null,
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

// Healthcare color palette with blue theme
const HEALTHCARE_COLORS = {
  primary: { r: 30, g: 136, b: 229 },        // Healthcare Blue #1E88E5
  primaryLight: { r: 227, g: 242, b: 253 },  // Light Blue #E3F2FD
  secondary: { r: 66, g: 165, b: 245 },      // Light Blue #42A5F5
  secondaryLight: { r: 187, g: 222, b: 251 }, // Very Light Blue #BBDEFB
  accent: { r: 13, g: 71, b: 161 },          // Dark Blue #0D47A1
  dark: { r: 31, g: 41, b: 55 },             // Dark Gray
  text: { r: 55, g: 65, b: 81 },             // Text Gray
  textMuted: { r: 107, g: 114, b: 128 },     // Muted Gray
  background: { r: 249, g: 250, b: 251 },    // Light Background
  white: { r: 255, g: 255, b: 255 },
  border: { r: 229, g: 231, b: 235 },        // Border Gray
  success: { r: 16, g: 185, b: 129 },        // Green
  warning: { r: 245, g: 158, b: 11 },        // Amber
  danger: { r: 239, g: 68, b: 68 },          // Red
};

// Helper function to generate body map summary from points data
const generateBodyMapSummary = (bodyMapPoints: any[]): { 
  totalMarks: number;
  frontCount: number;
  backCount: number;
  types: string[];
  severities: string[];
  notes: string[];
} => {
  if (!bodyMapPoints || !Array.isArray(bodyMapPoints) || bodyMapPoints.length === 0) {
    return {
      totalMarks: 0,
      frontCount: 0,
      backCount: 0,
      types: [],
      severities: [],
      notes: []
    };
  }
  
  const frontPoints = bodyMapPoints.filter(p => p.side === 'front');
  const backPoints = bodyMapPoints.filter(p => p.side === 'back');
  
  // Extract unique types
  const types = [...new Set(bodyMapPoints.map(p => p.type).filter(Boolean))];
  
  // Extract unique severities
  const severities = [...new Set(bodyMapPoints.map(p => p.severity).filter(Boolean))];
  
  // Extract all notes
  const notes = bodyMapPoints.map(p => p.notes).filter(Boolean);
  
  return {
    totalMarks: bodyMapPoints.length,
    frontCount: frontPoints.length,
    backCount: backPoints.length,
    types,
    severities,
    notes
  };
};

// Helper function to add healthcare-styled header to each page
const addPDFHeader = async (
  pdf: jsPDF, 
  orgSettings: any, 
  logoBase64: string | null,
  isFirstPage: boolean = false,
  generatedBy?: string
): Promise<number> => {
  const pageWidth = pdf.internal.pageSize.width;
  const leftMargin = 20;
  const rightMargin = pageWidth - 20;
  
  // Top colored healthcare blue bar
  pdf.setFillColor(HEALTHCARE_COLORS.primary.r, HEALTHCARE_COLORS.primary.g, HEALTHCARE_COLORS.primary.b);
  pdf.rect(0, 0, pageWidth, 4, 'F');
  
  let headerY = 12;
  
  // LEFT SIDE: Organization Information
  if (orgSettings) {
    pdf.setFontSize(13);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(HEALTHCARE_COLORS.dark.r, HEALTHCARE_COLORS.dark.g, HEALTHCARE_COLORS.dark.b);
    pdf.text(orgSettings.name, leftMargin, headerY + 5);
    
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(HEALTHCARE_COLORS.textMuted.r, HEALTHCARE_COLORS.textMuted.g, HEALTHCARE_COLORS.textMuted.b);
    
    let infoY = headerY + 11;
    
    // Branch Name
    if (orgSettings.branchName) {
      pdf.text(orgSettings.branchName, leftMargin, infoY);
      infoY += 5;
    }
    
    // Address
    if (orgSettings.address) {
      const addressLines = pdf.splitTextToSize(orgSettings.address, 90);
      pdf.text(addressLines, leftMargin, infoY);
      infoY += addressLines.length * 5;
    }
    
    // Contact Number
    if (orgSettings.telephone) {
      pdf.text(`Tel: ${orgSettings.telephone}`, leftMargin, infoY);
      infoY += 5;
    }
    
    // Email
    if (orgSettings.email) {
      pdf.text(`Email: ${orgSettings.email}`, leftMargin, infoY);
    }
  }
  
  // RIGHT SIDE: Company Logo (properly sized and aligned)
  if (logoBase64) {
    try {
      const maxWidth = 40;
      const maxHeight = 30;
      const logoX = rightMargin - maxWidth;
      const logoY = headerY;
      pdf.addImage(logoBase64, 'PNG', logoX, logoY, maxWidth, maxHeight, undefined, 'FAST');
    } catch (error) {
      console.error('Error adding logo to header:', error);
    }
  }
  
  // REPORT META INFORMATION (only on first page)
  if (isFirstPage) {
    headerY = 55;
    
    // Separator line
    pdf.setDrawColor(HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b);
    pdf.setLineWidth(0.5);
    pdf.line(leftMargin, headerY, rightMargin, headerY);
    
    headerY += 8;
    
    // Report meta block
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(HEALTHCARE_COLORS.primary.r, HEALTHCARE_COLORS.primary.g, HEALTHCARE_COLORS.primary.b);
    pdf.text('Report Name:', leftMargin, headerY);
    
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(HEALTHCARE_COLORS.text.r, HEALTHCARE_COLORS.text.g, HEALTHCARE_COLORS.text.b);
    pdf.text('Event & Log Report', leftMargin + 30, headerY);
    
    headerY += 5;
    
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(HEALTHCARE_COLORS.primary.r, HEALTHCARE_COLORS.primary.g, HEALTHCARE_COLORS.primary.b);
    pdf.text('Generated On:', leftMargin, headerY);
    
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(HEALTHCARE_COLORS.text.r, HEALTHCARE_COLORS.text.g, HEALTHCARE_COLORS.text.b);
    pdf.text(format(new Date(), 'MMMM d, yyyy \'at\' h:mm a'), leftMargin + 30, headerY);
    
    if (generatedBy) {
      headerY += 5;
      
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(HEALTHCARE_COLORS.primary.r, HEALTHCARE_COLORS.primary.g, HEALTHCARE_COLORS.primary.b);
      pdf.text('Generated By:', leftMargin, headerY);
      
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(HEALTHCARE_COLORS.text.r, HEALTHCARE_COLORS.text.g, HEALTHCARE_COLORS.text.b);
      pdf.text(generatedBy, leftMargin + 30, headerY);
    }
    
    headerY += 10;
    
    // "Event Details Report" heading with blue underline
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(HEALTHCARE_COLORS.primary.r, HEALTHCARE_COLORS.primary.g, HEALTHCARE_COLORS.primary.b);
    pdf.text('Event Details Report', leftMargin, headerY);
    
    // Blue underline
    const headingWidth = pdf.getTextWidth('Event Details Report');
    pdf.setDrawColor(HEALTHCARE_COLORS.primary.r, HEALTHCARE_COLORS.primary.g, HEALTHCARE_COLORS.primary.b);
    pdf.setLineWidth(1);
    pdf.line(leftMargin, headerY + 2, leftMargin + headingWidth, headerY + 2);
    
    headerY += 10;
  } else {
    headerY = 52;
  }
  
  // Reset colors
  pdf.setTextColor(0, 0, 0);
  
  return headerY;
};

// Helper function to add healthcare-styled footer to each page
const addPDFFooter = (pdf: jsPDF, orgSettings: any, pageNumber: number, totalPages: number) => {
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const footerY = pageHeight - 12;
  
  // Separator line
  pdf.setDrawColor(HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b);
  pdf.setLineWidth(0.3);
  pdf.line(20, footerY - 6, pageWidth - 20, footerY - 6);
  
  // Page numbers (right)
  pdf.setFontSize(7);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(HEALTHCARE_COLORS.textMuted.r, HEALTHCARE_COLORS.textMuted.g, HEALTHCARE_COLORS.textMuted.b);
  pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 20, footerY, { align: 'right' });
  
  // Organization info (center)
  if (orgSettings) {
    pdf.setFontSize(6);
    const orgText = `© ${orgSettings.name} | ${orgSettings.website || ''} | ${format(new Date(), 'yyyy-MM-dd')}`;
    pdf.text(orgText, pageWidth / 2, footerY, { align: 'center' });
  }
  
  // Reset colors
  pdf.setTextColor(0, 0, 0);
};

export interface ExportableEvent {
  // Basic fields
  id: string;
  title: string;
  event_type: string;
  category: string;
  severity: string;
  status: string;
  reporter: string;
  client_name?: string;
  client_id?: string;
  location?: string;
  description?: string;
  event_date?: string;
  event_time?: string;
  created_at: string;
  updated_at?: string;
  recorded_by_staff_name?: string;
  recorded_by_staff_id?: string;
  branch_id?: string;
  branch_name?: string;
  
  // Body map
  body_map_points?: any;
  body_map_front_image_url?: string;
  body_map_back_image_url?: string;
  
  // Staff information
  staff_present?: string[];
  staff_aware?: string[];
  other_people_present?: any[];
  
  // Follow-up
  action_required?: boolean;
  follow_up_date?: string;
  follow_up_assigned_to?: string;
  follow_up_notes?: string;
  
  // Actions
  immediate_actions_taken?: string;
  investigation_required?: boolean;
  investigation_assigned_to?: string;
  expected_resolution_date?: string;
  lessons_learned?: string;
  
  // Risk assessment
  risk_level?: string;
  contributing_factors?: string[];
  environmental_factors?: string;
  preventable?: boolean;
  similar_incidents?: string;
  
  // Compliance
  family_notified?: boolean;
  family_notification_date?: string;
  family_notification_method?: string;
  gp_notified?: boolean;
  gp_notification_date?: string;
  insurance_notified?: boolean;
  insurance_notification_date?: string;
  external_reporting_required?: boolean;
  external_reporting_details?: string;
  
  // Attachments
  attachments?: any[];
}

export const exportEventsToCSV = async (events: ExportableEvent[], filename: string = 'events-logs') => {
  // Fetch staff names if we have a branch_id
  const branchId = events[0]?.branch_id;
  const staffMap = branchId ? await fetchStaffNames(branchId) : new Map();
  
  const headers = [
    'Event ID',
    'Title',
    'Client Name',
    'Client ID',
    'Branch Name',
    'Event Type',
    'Category',
    'Severity',
    'Status',
    'Reporter',
    'Recorded By Staff',
    'Staff ID',
    'Location',
    'Event Date',
    'Event Time',
    'Recorded Date',
    'Last Updated',
    'Description',
    'Staff Present',
    'Staff Aware',
    'Other People Present',
    'Action Required',
    'Follow-up Date',
    'Follow-up Assigned To',
    'Follow-up Notes',
    'Immediate Actions Taken',
    'Investigation Required',
    'Investigation Assigned To',
    'Expected Resolution Date',
    'Lessons Learned',
    'Risk Level',
    'Contributing Factors',
    'Environmental Factors',
    'Preventable',
    'Similar Incidents',
    'Family Notified',
    'Family Notification Date',
    'Family Notification Method',
    'GP Notified',
    'GP Notification Date',
    'Insurance Notified',
    'Insurance Notification Date',
    'External Reporting Required',
    'External Reporting Details',
    'Body Map Points Count',
    'Has Front Body Map',
    'Has Back Body Map',
    'Attachments Count'
  ];

  const csvData = events.map(event => [
    event.id || '',
    event.title || '',
    event.client_name || '',
    event.client_id || '',
    event.branch_name || event.branch_id || '',
    event.event_type || '',
    event.category || '',
    event.severity || '',
    event.status || '',
    event.reporter || '',
    event.recorded_by_staff_name || '',
    event.recorded_by_staff_id || '',
    event.location || '',
    event.event_date || '',
    event.event_time || '',
    format(new Date(event.created_at), 'yyyy-MM-dd HH:mm'),
    event.updated_at ? format(new Date(event.updated_at), 'yyyy-MM-dd HH:mm') : '',
    (event.description || '').replace(/[\r\n]+/g, ' '),
    // Staff information
    Array.isArray(event.staff_present) ? resolveStaffNames(event.staff_present, staffMap) : '',
    Array.isArray(event.staff_aware) ? resolveStaffNames(event.staff_aware, staffMap) : '',
    Array.isArray(event.other_people_present) 
      ? event.other_people_present.map((p: any) => `${p.name} (${p.relationship})`).join('; ') 
      : '',
    // Follow-up
    event.action_required ? 'Yes' : 'No',
    event.follow_up_date || '',
    resolveStaffName(event.follow_up_assigned_to, staffMap),
    (event.follow_up_notes || '').replace(/[\r\n]+/g, ' '),
    // Actions
    (event.immediate_actions_taken || '').replace(/[\r\n]+/g, ' '),
    event.investigation_required ? 'Yes' : 'No',
    resolveStaffName(event.investigation_assigned_to, staffMap),
    event.expected_resolution_date || '',
    (event.lessons_learned || '').replace(/[\r\n]+/g, ' '),
    // Risk assessment
    event.risk_level || '',
    Array.isArray(event.contributing_factors) ? event.contributing_factors.join('; ') : '',
    (event.environmental_factors || '').replace(/[\r\n]+/g, ' '),
    event.preventable === true ? 'Yes' : event.preventable === false ? 'No' : '',
    (event.similar_incidents || '').replace(/[\r\n]+/g, ' '),
    // Compliance
    event.family_notified ? 'Yes' : 'No',
    event.family_notification_date || '',
    event.family_notification_method || '',
    event.gp_notified ? 'Yes' : 'No',
    event.gp_notification_date || '',
    event.insurance_notified ? 'Yes' : 'No',
    event.insurance_notification_date || '',
    event.external_reporting_required ? 'Yes' : 'No',
    (event.external_reporting_details || '').replace(/[\r\n]+/g, ' '),
    // Body map and attachments
    event.body_map_points ? (Array.isArray(event.body_map_points) ? event.body_map_points.length.toString() : '0') : '0',
    event.body_map_front_image_url ? 'Yes' : 'No',
    event.body_map_back_image_url ? 'Yes' : 'No',
    event.attachments ? (Array.isArray(event.attachments) ? event.attachments.length.toString() : '0') : '0'
  ]);

  // Add UTF-8 BOM for Excel compatibility
  const csvContent = '\uFEFF' + [headers, ...csvData]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const exportEventToPDF = async (event: ExportableEvent, filename?: string) => {
  const pdf = new jsPDF();
  
  // Fetch staff names and organization settings if branch_id is available
  const staffMap = event.branch_id ? await fetchStaffNames(event.branch_id) : new Map();
  const orgSettings = event.branch_id ? await fetchOrganizationSettings(event.branch_id) : null;

  // Pre-load logo once for reuse across pages
  let logoBase64: string | null = null;
  if (orgSettings?.logo_url) {
    try {
      logoBase64 = await loadImageAsBase64(orgSettings.logo_url);
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  }
  
  const pageWidth = pdf.internal.pageSize.width;
  const leftMargin = 20;
  const rightMargin = pageWidth - 20;

  // === PAGE 1: HEADER ===
  let currentY = await addPDFHeader(pdf, orgSettings, logoBase64, true);
  
  // === EVENT SUMMARY CARD ===
  // Outer card border
  pdf.setDrawColor(HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b);
  pdf.setLineWidth(0.5);
  pdf.setFillColor(HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b);
  const cardHeight = 42;
  pdf.roundedRect(leftMargin, currentY, rightMargin - leftMargin, cardHeight, 2, 2, 'F');
  
  // Event title box
  pdf.setFillColor(HEALTHCARE_COLORS.primaryLight.r, HEALTHCARE_COLORS.primaryLight.g, HEALTHCARE_COLORS.primaryLight.b);
  pdf.roundedRect(leftMargin + 3, currentY + 3, rightMargin - leftMargin - 6, 12, 1, 1, 'F');
  
  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(HEALTHCARE_COLORS.primary.r, HEALTHCARE_COLORS.primary.g, HEALTHCARE_COLORS.primary.b);
  const titleText = event.title || 'Untitled Event';
  const titleLines = pdf.splitTextToSize(titleText, rightMargin - leftMargin - 50);
  pdf.text(titleLines[0], leftMargin + 6, currentY + 10);
  
  // Event ID
  pdf.setFontSize(8);
  pdf.setFont(undefined, 'normal');
  const eventIdShort = `ID: ${event.id?.substring(0, 8).toUpperCase() || 'N/A'}`;
  pdf.text(eventIdShort, rightMargin - 6 - pdf.getTextWidth(eventIdShort), currentY + 10);
  
  // Event Information Table
  const eventDate = event.event_date ? format(new Date(event.event_date), 'MMM d, yyyy') : 'N/A';
  const eventInfoData = [
    ['Event Type', event.event_type || 'N/A'],
    ['Event Date', eventDate],
    ['Event Time', event.event_time || 'N/A'],
    ['Client', event.client_name || 'N/A'],
    ['Location', event.location || 'Location not specified'],
    ['Recorded By', event.recorded_by_staff_name || event.reporter || 'N/A']
  ];

  autoTable(pdf, {
    body: eventInfoData,
    startY: currentY + 18,
    theme: 'plain',
    styles: { 
      fontSize: 8,
      cellPadding: { top: 3, right: 6, bottom: 3, left: 6 },
      textColor: [55, 65, 81],
      halign: 'left',
      overflow: 'linebreak'
    },
    columnStyles: { 
      0: { 
        fontStyle: 'bold',
        cellWidth: 40,
        textColor: [31, 41, 55]
      },
      1: {
        cellWidth: 90
      }
    },
    margin: { left: leftMargin + 6, right: 20 }
  });
  
  let metaY = (pdf as any).lastAutoTable.finalY + 2;
  
  // Status badges at bottom
  metaY += 7;
  
  // Severity badge
  const severityColors: Record<string, { r: number; g: number; b: number }> = {
    'Critical': HEALTHCARE_COLORS.danger,
    'High': HEALTHCARE_COLORS.warning,
    'Medium': HEALTHCARE_COLORS.secondary,
    'Low': HEALTHCARE_COLORS.success
  };
  const sevColor = severityColors[event.severity] || HEALTHCARE_COLORS.textMuted;
  
  pdf.setFillColor(sevColor.r, sevColor.g, sevColor.b);
  pdf.setTextColor(HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b);
  pdf.setFontSize(7);
  pdf.setFont(undefined, 'bold');
  const sevText = event.severity?.toUpperCase() || 'UNKNOWN';
  const sevWidth = pdf.getTextWidth(sevText) + 6;
  pdf.roundedRect(leftMargin + 6, metaY - 3, sevWidth, 6, 1, 1, 'F');
  pdf.text(sevText, leftMargin + 9, metaY + 1);
  
  // Status badge
  const statusColors: Record<string, { r: number; g: number; b: number }> = {
    'Open': HEALTHCARE_COLORS.secondary,
    'In Progress': HEALTHCARE_COLORS.accent,
    'Resolved': HEALTHCARE_COLORS.success,
    'Closed': HEALTHCARE_COLORS.textMuted
  };
  const statColor = statusColors[event.status] || HEALTHCARE_COLORS.textMuted;
  
  pdf.setFillColor(statColor.r, statColor.g, statColor.b);
  const statText = event.status || 'Unknown';
  const statWidth = pdf.getTextWidth(statText) + 6;
  const statX = leftMargin + 6 + sevWidth + 4;
  pdf.roundedRect(statX, metaY - 3, statWidth, 6, 1, 1, 'F');
  pdf.text(statText, statX + 3, metaY + 1);
  
  // Event Type badge
  pdf.setFillColor(HEALTHCARE_COLORS.primaryLight.r, HEALTHCARE_COLORS.primaryLight.g, HEALTHCARE_COLORS.primaryLight.b);
  pdf.setTextColor(HEALTHCARE_COLORS.primary.r, HEALTHCARE_COLORS.primary.g, HEALTHCARE_COLORS.primary.b);
  const typeText = event.event_type || 'Event';
  const typeWidth = pdf.getTextWidth(typeText) + 6;
  const typeX = statX + statWidth + 4;
  pdf.roundedRect(typeX, metaY - 3, typeWidth, 6, 1, 1, 'F');
  pdf.text(typeText, typeX + 3, metaY + 1);
  
  currentY = metaY + 12;
  
  // Reset text color
  pdf.setTextColor(0, 0, 0);


  // Helper to add section header with healthcare styling
  const addSectionHeader = async (title: string, accentColor: { r: number; g: number; b: number } = HEALTHCARE_COLORS.primary) => {
    // Check if we need a new page
    if (currentY > 240) {
      pdf.addPage();
      currentY = await addPDFHeader(pdf, orgSettings, logoBase64, false);
    }
    
    // Left accent bar
    pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b);
    pdf.rect(leftMargin, currentY - 2, 3, 8, 'F');
    
    // Section title
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(HEALTHCARE_COLORS.dark.r, HEALTHCARE_COLORS.dark.g, HEALTHCARE_COLORS.dark.b);
    pdf.text(title.toUpperCase(), leftMargin + 6, currentY + 3);
    
    currentY += 6;
    
    // Underline separator
    pdf.setDrawColor(accentColor.r, accentColor.g, accentColor.b);
    pdf.setLineWidth(0.5);
    pdf.line(leftMargin, currentY, rightMargin, currentY);
    
    currentY += 5;
    
    // Reset
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(0, 0, 0);
  };
  
  // === BASIC EVENT DETAILS ===
  await addSectionHeader('Event Information', HEALTHCARE_COLORS.primary);
  
  const basicEventData = [
    ['Event ID', event.id?.substring(0, 13) + '...' || 'N/A'],
    ['Title', event.title || 'N/A'],
    ['Client', event.client_name || 'N/A'],
    ['Event Type', event.event_type || 'N/A'],
    ['Category', event.category || 'N/A'],
    ['Severity', event.severity || 'N/A'],
    ['Status', event.status || 'N/A'],
    ['Reporter', event.reporter || 'N/A'],
    ['Location', event.location || 'Not specified'],
    ['Event Date', event.event_date || 'N/A'],
    ['Event Time', event.event_time || 'N/A'],
    ['Recorded Date', format(new Date(event.created_at), 'PPP')],
    ['Recorded By', event.recorded_by_staff_name || 'N/A'],
    ['Last Updated', event.updated_at ? format(new Date(event.updated_at), 'PPP p') : 'N/A']
  ];

  autoTable(pdf, {
    body: basicEventData,
    startY: currentY,
    theme: 'plain',
    styles: { 
      fontSize: 9,
      cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
      lineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
      lineWidth: 0.2,
      textColor: [HEALTHCARE_COLORS.text.r, HEALTHCARE_COLORS.text.g, HEALTHCARE_COLORS.text.b]
    },
    columnStyles: { 
      0: { 
        fontStyle: 'bold', 
        fillColor: [HEALTHCARE_COLORS.primaryLight.r, HEALTHCARE_COLORS.primaryLight.g, HEALTHCARE_COLORS.primaryLight.b],
        cellWidth: 55,
        textColor: [HEALTHCARE_COLORS.dark.r, HEALTHCARE_COLORS.dark.g, HEALTHCARE_COLORS.dark.b]
      },
      1: {
        fillColor: [HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b],
        cellWidth: 115
      }
    },
    margin: { left: 20, right: 20 },
    tableLineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
    tableLineWidth: 0.3
  });

  currentY = (pdf as any).lastAutoTable.finalY + 10;
  
  // === DESCRIPTION ===
  if (event.description) {
    await addSectionHeader('Event Description', HEALTHCARE_COLORS.secondary);
    
    // Add description in a bordered box with healthcare styling
    pdf.setDrawColor(HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b);
    pdf.setFillColor(HEALTHCARE_COLORS.background.r, HEALTHCARE_COLORS.background.g, HEALTHCARE_COLORS.background.b);
    
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(HEALTHCARE_COLORS.text.r, HEALTHCARE_COLORS.text.g, HEALTHCARE_COLORS.text.b);
    const splitDescription = pdf.splitTextToSize(event.description, 160);
    
    const boxHeight = (splitDescription.length * 5) + 10;
    pdf.roundedRect(leftMargin, currentY, rightMargin - leftMargin, boxHeight, 1, 1, 'FD');
    
    pdf.text(splitDescription, leftMargin + 5, currentY + 7);
    currentY += boxHeight + 10;
    
    // Reset color
    pdf.setTextColor(0, 0, 0);
  }
  
  // === STAFF INFORMATION ===
  if ((event.staff_present && event.staff_present.length > 0) || 
      (event.staff_aware && event.staff_aware.length > 0) || 
      (event.other_people_present && event.other_people_present.length > 0)) {
    
    await addSectionHeader('Staff & People Information', HEALTHCARE_COLORS.success);
    
    const staffData = [];
    if (event.staff_present && event.staff_present.length > 0) {
      staffData.push(['Staff Present', resolveStaffNames(event.staff_present, staffMap)]);
    }
    if (event.staff_aware && event.staff_aware.length > 0) {
      staffData.push(['Staff Aware', resolveStaffNames(event.staff_aware, staffMap)]);
    }
    if (event.other_people_present && event.other_people_present.length > 0) {
      const otherPeople = event.other_people_present.map((p: any) => 
        `${p.name || 'Unknown'} (${p.relationship || 'N/A'})`
      ).join(', ');
      staffData.push(['Other People Present', otherPeople]);
    }
    
    autoTable(pdf, {
      body: staffData,
      startY: currentY,
      theme: 'plain',
      styles: { 
        fontSize: 9,
        cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
        lineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
        lineWidth: 0.2,
        textColor: [HEALTHCARE_COLORS.text.r, HEALTHCARE_COLORS.text.g, HEALTHCARE_COLORS.text.b],
        halign: 'left'
      },
      columnStyles: { 
        0: { 
          fontStyle: 'bold', 
          fillColor: [HEALTHCARE_COLORS.primaryLight.r, HEALTHCARE_COLORS.primaryLight.g, HEALTHCARE_COLORS.primaryLight.b],
          cellWidth: 55,
          textColor: [HEALTHCARE_COLORS.dark.r, HEALTHCARE_COLORS.dark.g, HEALTHCARE_COLORS.dark.b],
          halign: 'left'
        },
        1: {
          fillColor: [HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b],
          cellWidth: 115,
          halign: 'left'
        }
      },
      margin: { left: 20, right: 20 },
      tableLineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
      tableLineWidth: 0.3
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === FOLLOW-UP INFORMATION ===
  if (event.action_required || event.follow_up_date || event.follow_up_assigned_to || event.follow_up_notes) {
    await addSectionHeader('Follow-Up Details', HEALTHCARE_COLORS.warning);
    
    const followUpData = [
      ['Action Required', event.action_required ? 'Yes' : 'No'],
      ['Follow-up Date', event.follow_up_date || 'Not set'],
      ['Assigned To', resolveStaffName(event.follow_up_assigned_to, staffMap)],
      ['Follow-up Notes', event.follow_up_notes || 'No notes']
    ];
    
    autoTable(pdf, {
      body: followUpData,
      startY: currentY,
      theme: 'plain',
      styles: { 
        fontSize: 9,
        cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
        lineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
        lineWidth: 0.2,
        textColor: [HEALTHCARE_COLORS.text.r, HEALTHCARE_COLORS.text.g, HEALTHCARE_COLORS.text.b]
      },
      columnStyles: { 
        0: { 
          fontStyle: 'bold', 
          fillColor: [HEALTHCARE_COLORS.primaryLight.r, HEALTHCARE_COLORS.primaryLight.g, HEALTHCARE_COLORS.primaryLight.b],
          cellWidth: 55,
          textColor: [HEALTHCARE_COLORS.dark.r, HEALTHCARE_COLORS.dark.g, HEALTHCARE_COLORS.dark.b]
        },
        1: {
          fillColor: [HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b],
          cellWidth: 115
        }
      },
      margin: { left: 20, right: 20 },
      tableLineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
      tableLineWidth: 0.3
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === ACTIONS TAKEN ===
  if (event.immediate_actions_taken || event.investigation_required || event.lessons_learned) {
    await addSectionHeader('Actions & Investigation', HEALTHCARE_COLORS.accent);
    
    const actionsData = [];
    if (event.immediate_actions_taken) {
      actionsData.push(['Immediate Actions', event.immediate_actions_taken]);
    }
    actionsData.push(['Investigation Required', event.investigation_required ? 'Yes' : 'No']);
    if (event.investigation_assigned_to) {
      actionsData.push(['Investigation Assigned To', resolveStaffName(event.investigation_assigned_to, staffMap)]);
    }
    if (event.expected_resolution_date) {
      actionsData.push(['Expected Resolution', event.expected_resolution_date]);
    }
    if (event.lessons_learned) {
      actionsData.push(['Lessons Learned', event.lessons_learned]);
    }
    
    autoTable(pdf, {
      body: actionsData,
      startY: currentY,
      theme: 'plain',
      styles: { 
        fontSize: 9,
        cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
        lineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
        lineWidth: 0.2,
        textColor: [HEALTHCARE_COLORS.text.r, HEALTHCARE_COLORS.text.g, HEALTHCARE_COLORS.text.b]
      },
      columnStyles: { 
        0: { 
          fontStyle: 'bold', 
          fillColor: [HEALTHCARE_COLORS.primaryLight.r, HEALTHCARE_COLORS.primaryLight.g, HEALTHCARE_COLORS.primaryLight.b],
          cellWidth: 55,
          textColor: [HEALTHCARE_COLORS.dark.r, HEALTHCARE_COLORS.dark.g, HEALTHCARE_COLORS.dark.b]
        },
        1: {
          fillColor: [HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b],
          cellWidth: 115
        }
      },
      margin: { left: 20, right: 20 },
      tableLineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
      tableLineWidth: 0.3
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === RISK ASSESSMENT ===
  if (event.risk_level || event.contributing_factors || event.environmental_factors || event.preventable !== undefined) {
    await addSectionHeader('Risk Assessment', HEALTHCARE_COLORS.danger);
    
    const riskData = [
      ['Risk Level', event.risk_level || 'Not assessed'],
      ['Preventable', event.preventable === true ? 'Yes' : event.preventable === false ? 'No' : 'Unknown']
    ];
    
    if (event.contributing_factors && event.contributing_factors.length > 0) {
      riskData.push(['Contributing Factors', event.contributing_factors.join(', ')]);
    }
    if (event.environmental_factors) {
      riskData.push(['Environmental Factors', event.environmental_factors]);
    }
    if (event.similar_incidents) {
      riskData.push(['Similar Incidents', event.similar_incidents]);
    }
    
    autoTable(pdf, {
      body: riskData,
      startY: currentY,
      theme: 'plain',
      styles: { 
        fontSize: 9,
        cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
        lineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
        lineWidth: 0.2,
        textColor: [HEALTHCARE_COLORS.text.r, HEALTHCARE_COLORS.text.g, HEALTHCARE_COLORS.text.b]
      },
      columnStyles: { 
        0: { 
          fontStyle: 'bold', 
          fillColor: [HEALTHCARE_COLORS.primaryLight.r, HEALTHCARE_COLORS.primaryLight.g, HEALTHCARE_COLORS.primaryLight.b],
          cellWidth: 55,
          textColor: [HEALTHCARE_COLORS.dark.r, HEALTHCARE_COLORS.dark.g, HEALTHCARE_COLORS.dark.b]
        },
        1: {
          fillColor: [HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b],
          cellWidth: 115
        }
      },
      margin: { left: 20, right: 20 },
      tableLineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
      tableLineWidth: 0.3
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === COMPLIANCE & NOTIFICATIONS ===
  if (event.family_notified || event.gp_notified || event.insurance_notified || event.external_reporting_required) {
    await addSectionHeader('Compliance & Notifications', HEALTHCARE_COLORS.accent);
    
    const complianceData = [];
    
    // Family notification
    complianceData.push(['Family Notified', event.family_notified ? 'Yes' : 'No']);
    if (event.family_notified) {
      if (event.family_notification_date) {
        complianceData.push(['Family Notification Date', event.family_notification_date]);
      }
      if (event.family_notification_method) {
        complianceData.push(['Notification Method', event.family_notification_method]);
      }
    }
    
    // GP notification
    complianceData.push(['GP Notified', event.gp_notified ? 'Yes' : 'No']);
    if (event.gp_notified && event.gp_notification_date) {
      complianceData.push(['GP Notification Date', event.gp_notification_date]);
    }
    
    // Insurance notification
    complianceData.push(['Insurance Notified', event.insurance_notified ? 'Yes' : 'No']);
    if (event.insurance_notified && event.insurance_notification_date) {
      complianceData.push(['Insurance Notification Date', event.insurance_notification_date]);
    }
    
    // External reporting
    complianceData.push(['External Reporting Required', event.external_reporting_required ? 'Yes' : 'No']);
    if (event.external_reporting_required && event.external_reporting_details) {
      complianceData.push(['External Reporting Details', event.external_reporting_details]);
    }
    
    autoTable(pdf, {
      body: complianceData,
      startY: currentY,
      theme: 'plain',
      styles: { 
        fontSize: 9,
        cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
        lineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
        lineWidth: 0.2,
        textColor: [HEALTHCARE_COLORS.text.r, HEALTHCARE_COLORS.text.g, HEALTHCARE_COLORS.text.b]
      },
      columnStyles: { 
        0: { 
          fontStyle: 'bold', 
          fillColor: [HEALTHCARE_COLORS.primaryLight.r, HEALTHCARE_COLORS.primaryLight.g, HEALTHCARE_COLORS.primaryLight.b],
          cellWidth: 55,
          textColor: [HEALTHCARE_COLORS.dark.r, HEALTHCARE_COLORS.dark.g, HEALTHCARE_COLORS.dark.b]
        },
        1: {
          fillColor: [HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b],
          cellWidth: 115
        }
      },
      margin: { left: 20, right: 20 },
      tableLineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
      tableLineWidth: 0.3
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === BODY MAP IMAGES ===
  if (event.body_map_front_image_url || event.body_map_back_image_url) {
    if (currentY > 180) {
      pdf.addPage();
      currentY = await addPDFHeader(pdf, orgSettings, logoBase64, false);
    }
    
    await addSectionHeader('Body Map', HEALTHCARE_COLORS.textMuted);
    
    if (event.body_map_front_image_url) {
      try {
        const frontImageBase64 = await loadImageAsBase64(event.body_map_front_image_url);
        if (frontImageBase64) {
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'bold');
          pdf.setTextColor(HEALTHCARE_COLORS.dark.r, HEALTHCARE_COLORS.dark.g, HEALTHCARE_COLORS.dark.b);
          pdf.text('Front View:', 20, currentY);
          currentY += 5;
          
          pdf.addImage(frontImageBase64, 'PNG', 20, currentY, 80, 100);
          currentY += 105;
          
          pdf.setTextColor(0, 0, 0);
        }
      } catch (error) {
        console.error('Error adding front body map image:', error);
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'italic');
        pdf.setTextColor(HEALTHCARE_COLORS.textMuted.r, HEALTHCARE_COLORS.textMuted.g, HEALTHCARE_COLORS.textMuted.b);
        pdf.text('Front body map image could not be loaded', 20, currentY);
        currentY += 10;
        pdf.setTextColor(0, 0, 0);
      }
    }
    
    if (event.body_map_back_image_url && currentY > 180) {
      pdf.addPage();
      currentY = await addPDFHeader(pdf, orgSettings, logoBase64, false);
    }
    
    if (event.body_map_back_image_url) {
      try {
        const backImageBase64 = await loadImageAsBase64(event.body_map_back_image_url);
        if (backImageBase64) {
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'bold');
          pdf.setTextColor(HEALTHCARE_COLORS.dark.r, HEALTHCARE_COLORS.dark.g, HEALTHCARE_COLORS.dark.b);
          pdf.text('Back View:', 20, currentY);
          currentY += 5;
          
          pdf.addImage(backImageBase64, 'PNG', 20, currentY, 80, 100);
          currentY += 105;
          
          pdf.setTextColor(0, 0, 0);
        }
      } catch (error) {
        console.error('Error adding back body map image:', error);
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'italic');
        pdf.setTextColor(HEALTHCARE_COLORS.textMuted.r, HEALTHCARE_COLORS.textMuted.g, HEALTHCARE_COLORS.textMuted.b);
        pdf.text('Back body map image could not be loaded', 20, currentY);
        currentY += 10;
        pdf.setTextColor(0, 0, 0);
      }
    }
    
    // Add Body Map Summary after images
    if (event.body_map_points && Array.isArray(event.body_map_points) && event.body_map_points.length > 0) {
      const summary = generateBodyMapSummary(event.body_map_points);
      
      currentY += 10;
      
      const summaryData = [
        ['Total Marks', `${summary.totalMarks} recorded`],
        ['Front Side', `${summary.frontCount} marks`],
        ['Back Side', `${summary.backCount} marks`],
        ['Types', summary.types.length > 0 ? summary.types.join(', ') : 'Not specified'],
        ['Severity Levels', summary.severities.length > 0 ? summary.severities.join(', ') : 'Not specified'],
        ['Notes', summary.notes.length > 0 ? summary.notes.join('; ') : 'No notes recorded']
      ];
      
      autoTable(pdf, {
        body: summaryData,
        startY: currentY,
        theme: 'plain',
        styles: { 
          fontSize: 9,
          cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
          lineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
          lineWidth: 0.2,
          textColor: [HEALTHCARE_COLORS.text.r, HEALTHCARE_COLORS.text.g, HEALTHCARE_COLORS.text.b],
          halign: 'left',
          overflow: 'linebreak'
        },
        columnStyles: { 
          0: { 
            fontStyle: 'bold', 
            fillColor: [HEALTHCARE_COLORS.primaryLight.r, HEALTHCARE_COLORS.primaryLight.g, HEALTHCARE_COLORS.primaryLight.b],
            cellWidth: 55,
            textColor: [HEALTHCARE_COLORS.dark.r, HEALTHCARE_COLORS.dark.g, HEALTHCARE_COLORS.dark.b]
          },
          1: {
            fillColor: [HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b],
            cellWidth: 115
          }
        },
        margin: { left: 20, right: 20 },
        tableLineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
        tableLineWidth: 0.3
      });
      
      currentY = (pdf as any).lastAutoTable.finalY + 10;
    }
  }
  
  // === ATTACHMENTS INFO ===
  if (event.attachments && event.attachments.length > 0) {
    // Check if we need a new page
    if (currentY > 220) {
      pdf.addPage();
      currentY = await addPDFHeader(pdf, orgSettings, logoBase64, false);
    }
    
    await addSectionHeader(`Attachments (${event.attachments.length} files)`, HEALTHCARE_COLORS.textMuted);
    
    // Create attachments table data with file type icons
    const attachmentsTableData = event.attachments.map((attachment: any, index: number) => {
      const fileName = attachment.file_name || attachment.name || 'Unknown File';
      const fileType = attachment.file_type || attachment.type || 'Unknown';
      const fileSize = attachment.file_size || attachment.size;
      
      // File type prefix (no emojis)
      let typePrefix = 'File';
      if (fileType.includes('image')) typePrefix = 'Image';
      else if (fileType.includes('pdf')) typePrefix = 'PDF';
      else if (fileType.includes('video')) typePrefix = 'Video';
      else if (fileType.includes('word') || fileType.includes('doc')) typePrefix = 'Document';
      
      // Format file size
      let sizeDisplay = 'N/A';
      if (fileSize) {
        if (fileSize < 1024) {
          sizeDisplay = `${fileSize} B`;
        } else if (fileSize < 1024 * 1024) {
          sizeDisplay = `${(fileSize / 1024).toFixed(1)} KB`;
        } else {
          sizeDisplay = `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
        }
      }
      
      return [
        (index + 1).toString(),
        `${typePrefix}: ${fileName}`,
        fileType.split('/').pop()?.toUpperCase() || 'N/A',
        sizeDisplay
      ];
    });
    
    // Add attachments table with healthcare styling
    autoTable(pdf, {
      head: [['#', 'File Name', 'Type', 'Size']],
      body: attachmentsTableData,
      startY: currentY,
      theme: 'plain',
      styles: { 
        fontSize: 8,
        cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
        lineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
        lineWidth: 0.2,
        textColor: [HEALTHCARE_COLORS.text.r, HEALTHCARE_COLORS.text.g, HEALTHCARE_COLORS.text.b]
      },
      headStyles: {
        fillColor: [HEALTHCARE_COLORS.primary.r, HEALTHCARE_COLORS.primary.g, HEALTHCARE_COLORS.primary.b],
        textColor: [HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b],
        fontStyle: 'bold',
        halign: 'left',
        fontSize: 9
      },
      columnStyles: { 
        0: { cellWidth: 12, halign: 'center', fillColor: [HEALTHCARE_COLORS.background.r, HEALTHCARE_COLORS.background.g, HEALTHCARE_COLORS.background.b] },
        1: { cellWidth: 90, fillColor: [HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b] },
        2: { cellWidth: 40, fillColor: [HEALTHCARE_COLORS.background.r, HEALTHCARE_COLORS.background.g, HEALTHCARE_COLORS.background.b] },
        3: { cellWidth: 28, halign: 'right', fillColor: [HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b] }
      },
      margin: { left: 20, right: 20 },
      alternateRowStyles: {
        fillColor: [HEALTHCARE_COLORS.background.r, HEALTHCARE_COLORS.background.g, HEALTHCARE_COLORS.background.b]
      },
      tableLineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
      tableLineWidth: 0.3
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }

  // === ADD FOOTERS TO ALL PAGES ===
  const totalPages = pdf.internal.pages.length - 1; // Subtract 1 for internal counter
  
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addPDFFooter(pdf, orgSettings, i, totalPages);
  }

  const pdfFilename = filename || `event-${event.id}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  pdf.save(pdfFilename);
};

export const exportEventToPDFBlob = async (event: ExportableEvent): Promise<Blob> => {
  // Use the same implementation as exportEventToPDF but return blob
  const pdf = new jsPDF();
  
  const staffMap = event.branch_id ? await fetchStaffNames(event.branch_id) : new Map();
  const orgSettings = event.branch_id ? await fetchOrganizationSettings(event.branch_id) : null;

  let logoBase64: string | null = null;
  if (orgSettings?.logo_url) {
    try {
      logoBase64 = await loadImageAsBase64(orgSettings.logo_url);
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  }
  
  const pageWidth = pdf.internal.pageSize.width;
  const leftMargin = 20;
  const rightMargin = pageWidth - 20;

  let currentY = await addPDFHeader(pdf, orgSettings, logoBase64, true);
  
  // Reuse same styling - create summary card
  pdf.setDrawColor(HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b);
  pdf.setLineWidth(0.5);
  pdf.setFillColor(HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b);
  const cardHeightBlob = 42;
  pdf.roundedRect(leftMargin, currentY, rightMargin - leftMargin, cardHeightBlob, 2, 2, 'F');
  
  pdf.setFillColor(HEALTHCARE_COLORS.primaryLight.r, HEALTHCARE_COLORS.primaryLight.g, HEALTHCARE_COLORS.primaryLight.b);
  pdf.roundedRect(leftMargin + 3, currentY + 3, rightMargin - leftMargin - 6, 12, 1, 1, 'F');
  
  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(HEALTHCARE_COLORS.primary.r, HEALTHCARE_COLORS.primary.g, HEALTHCARE_COLORS.primary.b);
  const titleTextBlob = event.title || 'Untitled Event';
  const titleLinesBlob = pdf.splitTextToSize(titleTextBlob, rightMargin - leftMargin - 50);
  pdf.text(titleLinesBlob[0], leftMargin + 6, currentY + 10);
  
  pdf.setFontSize(8);
  pdf.setFont(undefined, 'normal');
  const eventIdShortBlob = `ID: ${event.id?.substring(0, 8).toUpperCase() || 'N/A'}`;
  pdf.text(eventIdShortBlob, rightMargin - 6 - pdf.getTextWidth(eventIdShortBlob), currentY + 10);
  
  // Event Information Table
  const eventDateBlob = event.event_date ? format(new Date(event.event_date), 'MMM d, yyyy') : 'N/A';
  const eventInfoDataBlob = [
    ['Event Type', event.event_type || 'N/A'],
    ['Event Date', eventDateBlob],
    ['Event Time', event.event_time || 'N/A'],
    ['Client', event.client_name || 'N/A'],
    ['Location', event.location || 'Location not specified'],
    ['Recorded By', event.recorded_by_staff_name || event.reporter || 'N/A']
  ];

  autoTable(pdf, {
    body: eventInfoDataBlob,
    startY: currentY + 18,
    theme: 'plain',
    styles: { 
      fontSize: 8,
      cellPadding: { top: 3, right: 6, bottom: 3, left: 6 },
      textColor: [55, 65, 81],
      halign: 'left',
      overflow: 'linebreak'
    },
    columnStyles: { 
      0: { 
        fontStyle: 'bold',
        cellWidth: 40,
        textColor: [31, 41, 55]
      },
      1: {
        cellWidth: 90
      }
    },
    margin: { left: leftMargin + 6, right: 20 }
  });
  
  let metaYBlob = (pdf as any).lastAutoTable.finalY + 2;
  
  const severityColorsBlob: Record<string, { r: number; g: number; b: number }> = {
    'Critical': HEALTHCARE_COLORS.danger,
    'High': HEALTHCARE_COLORS.warning,
    'Medium': HEALTHCARE_COLORS.secondary,
    'Low': HEALTHCARE_COLORS.success
  };
  const sevColorBlob = severityColorsBlob[event.severity] || HEALTHCARE_COLORS.textMuted;
  
  pdf.setFillColor(sevColorBlob.r, sevColorBlob.g, sevColorBlob.b);
  pdf.setTextColor(HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b);
  pdf.setFontSize(7);
  pdf.setFont(undefined, 'bold');
  const sevTextBlob = event.severity?.toUpperCase() || 'UNKNOWN';
  const sevWidthBlob = pdf.getTextWidth(sevTextBlob) + 6;
  pdf.roundedRect(leftMargin + 6, metaYBlob - 3, sevWidthBlob, 6, 1, 1, 'F');
  pdf.text(sevTextBlob, leftMargin + 9, metaYBlob + 1);
  
  const statusColorsBlob: Record<string, { r: number; g: number; b: number }> = {
    'Open': HEALTHCARE_COLORS.secondary,
    'In Progress': HEALTHCARE_COLORS.accent,
    'Resolved': HEALTHCARE_COLORS.success,
    'Closed': HEALTHCARE_COLORS.textMuted
  };
  const statColorBlob = statusColorsBlob[event.status] || HEALTHCARE_COLORS.textMuted;
  
  pdf.setFillColor(statColorBlob.r, statColorBlob.g, statColorBlob.b);
  const statTextBlob = event.status || 'Unknown';
  const statWidthBlob = pdf.getTextWidth(statTextBlob) + 6;
  const statXBlob = leftMargin + 6 + sevWidthBlob + 4;
  pdf.roundedRect(statXBlob, metaYBlob - 3, statWidthBlob, 6, 1, 1, 'F');
  pdf.text(statTextBlob, statXBlob + 3, metaYBlob + 1);
  
  pdf.setFillColor(HEALTHCARE_COLORS.primaryLight.r, HEALTHCARE_COLORS.primaryLight.g, HEALTHCARE_COLORS.primaryLight.b);
  pdf.setTextColor(HEALTHCARE_COLORS.primary.r, HEALTHCARE_COLORS.primary.g, HEALTHCARE_COLORS.primary.b);
  const typeTextBlob = event.event_type || 'Event';
  const typeWidthBlob = pdf.getTextWidth(typeTextBlob) + 6;
  const typeXBlob = statXBlob + statWidthBlob + 4;
  pdf.roundedRect(typeXBlob, metaYBlob - 3, typeWidthBlob, 6, 1, 1, 'F');
  pdf.text(typeTextBlob, typeXBlob + 3, metaYBlob + 1);
  
  currentY = metaYBlob + 12;
  pdf.setTextColor(0, 0, 0);

  // Helper matches exportEventToPDF styling
  const addSectionHeaderBlob = async (title: string, accentColor: { r: number; g: number; b: number } = HEALTHCARE_COLORS.primary) => {
    if (currentY > 240) {
      pdf.addPage();
      currentY = await addPDFHeader(pdf, orgSettings, logoBase64, false);
    }
    pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b);
    pdf.rect(leftMargin, currentY - 2, 3, 8, 'F');
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(HEALTHCARE_COLORS.dark.r, HEALTHCARE_COLORS.dark.g, HEALTHCARE_COLORS.dark.b);
    pdf.text(title.toUpperCase(), leftMargin + 6, currentY + 3);
    currentY += 6;
    pdf.setDrawColor(accentColor.r, accentColor.g, accentColor.b);
    pdf.setLineWidth(0.5);
    pdf.line(leftMargin, currentY, rightMargin, currentY);
    currentY += 5;
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(0, 0, 0);
  };
  
  // === BASIC EVENT DETAILS ===
  await addSectionHeaderBlob('Event Information');
  
  const basicEventData = [
    ['Event ID', event.id?.substring(0, 13) + '...' || 'N/A'],
    ['Title', event.title || 'N/A'],
    ['Client', event.client_name || 'N/A'],
    ['Event Type', event.event_type || 'N/A'],
    ['Category', event.category || 'N/A'],
    ['Severity', event.severity || 'N/A'],
    ['Status', event.status || 'N/A'],
    ['Reporter', event.reporter || 'N/A'],
    ['Location', event.location || 'Not specified'],
    ['Event Date', event.event_date || 'N/A'],
    ['Event Time', event.event_time || 'N/A'],
    ['Recorded Date', format(new Date(event.created_at), 'PPP')],
    ['Recorded By', event.recorded_by_staff_name || 'N/A'],
    ['Last Updated', event.updated_at ? format(new Date(event.updated_at), 'PPP p') : 'N/A']
  ];

  autoTable(pdf, {
    body: basicEventData,
    startY: currentY,
    theme: 'plain',
    styles: { 
      fontSize: 9,
      cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
      lineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
      lineWidth: 0.2,
      textColor: [HEALTHCARE_COLORS.text.r, HEALTHCARE_COLORS.text.g, HEALTHCARE_COLORS.text.b],
      halign: 'left',
      overflow: 'linebreak'
    },
    columnStyles: { 
      0: { 
        fontStyle: 'bold', 
        fillColor: [HEALTHCARE_COLORS.primaryLight.r, HEALTHCARE_COLORS.primaryLight.g, HEALTHCARE_COLORS.primaryLight.b],
        cellWidth: 55,
        textColor: [HEALTHCARE_COLORS.dark.r, HEALTHCARE_COLORS.dark.g, HEALTHCARE_COLORS.dark.b]
      },
      1: {
        fillColor: [HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b],
        cellWidth: 115
      }
    },
    margin: { left: 20, right: 20 }
  });

  currentY = (pdf as any).lastAutoTable.finalY + 10;
  
  // === DESCRIPTION ===
  if (event.description) {
    await addSectionHeaderBlob('Event Description');
    
    // Add description in a bordered box
    pdf.setDrawColor(220, 220, 220);
    pdf.setFillColor(252, 252, 252);
    
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    const splitDescription = pdf.splitTextToSize(event.description, 160);
    
    const boxHeight = (splitDescription.length * 5) + 10;
    pdf.rect(leftMargin, currentY, rightMargin - leftMargin, boxHeight, 'FD');
    
    pdf.text(splitDescription, leftMargin + 5, currentY + 7);
    currentY += boxHeight + 10;
  }
  
  // === STAFF INFORMATION ===
  if ((event.staff_present && event.staff_present.length > 0) || 
      (event.staff_aware && event.staff_aware.length > 0) || 
      (event.other_people_present && event.other_people_present.length > 0)) {
    
    await addSectionHeaderBlob('Staff & People Information');
    
    const staffData = [];
    if (event.staff_present && event.staff_present.length > 0) {
      staffData.push(['Staff Present', resolveStaffNames(event.staff_present, staffMap)]);
    }
    if (event.staff_aware && event.staff_aware.length > 0) {
      staffData.push(['Staff Aware', resolveStaffNames(event.staff_aware, staffMap)]);
    }
    if (event.other_people_present && event.other_people_present.length > 0) {
      const otherPeople = event.other_people_present.map((p: any) => 
        `${p.name || 'Unknown'} (${p.relationship || 'N/A'})`
      ).join(', ');
      staffData.push(['Other People Present', otherPeople]);
    }
    
    autoTable(pdf, {
      body: staffData,
      startY: currentY,
      theme: 'plain',
      styles: { 
        fontSize: 9,
        cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
        lineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
        lineWidth: 0.2,
        textColor: [HEALTHCARE_COLORS.text.r, HEALTHCARE_COLORS.text.g, HEALTHCARE_COLORS.text.b],
        halign: 'left',
        overflow: 'linebreak'
      },
      columnStyles: { 
        0: { 
          fontStyle: 'bold', 
          fillColor: [HEALTHCARE_COLORS.primaryLight.r, HEALTHCARE_COLORS.primaryLight.g, HEALTHCARE_COLORS.primaryLight.b],
          cellWidth: 55,
          textColor: [HEALTHCARE_COLORS.dark.r, HEALTHCARE_COLORS.dark.g, HEALTHCARE_COLORS.dark.b]
        },
        1: {
          fillColor: [HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b],
          cellWidth: 115
        }
      },
      margin: { left: 20, right: 20 }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === FOLLOW-UP INFORMATION ===
  if (event.action_required || event.follow_up_date || event.follow_up_assigned_to || event.follow_up_notes) {
    await addSectionHeaderBlob('Follow-Up Details');
    
    const followUpData = [
      ['Action Required', event.action_required ? 'Yes' : 'No'],
      ['Follow-up Date', event.follow_up_date || 'Not set'],
      ['Assigned To', resolveStaffName(event.follow_up_assigned_to, staffMap)],
      ['Follow-up Notes', event.follow_up_notes || 'No notes']
    ];
    
    autoTable(pdf, {
      body: followUpData,
      startY: currentY,
      theme: 'plain',
      styles: { 
        fontSize: 9,
        cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
        lineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
        lineWidth: 0.2,
        textColor: [HEALTHCARE_COLORS.text.r, HEALTHCARE_COLORS.text.g, HEALTHCARE_COLORS.text.b],
        halign: 'left',
        overflow: 'linebreak'
      },
      columnStyles: { 
        0: { 
          fontStyle: 'bold', 
          fillColor: [HEALTHCARE_COLORS.primaryLight.r, HEALTHCARE_COLORS.primaryLight.g, HEALTHCARE_COLORS.primaryLight.b],
          cellWidth: 55,
          textColor: [HEALTHCARE_COLORS.dark.r, HEALTHCARE_COLORS.dark.g, HEALTHCARE_COLORS.dark.b]
        },
        1: {
          fillColor: [HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b],
          cellWidth: 115
        }
      },
      margin: { left: 20, right: 20 }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === ACTIONS TAKEN ===
  if (event.immediate_actions_taken || event.investigation_required || event.lessons_learned) {
    await addSectionHeaderBlob('Actions & Investigation');
    
    const actionsData = [];
    if (event.immediate_actions_taken) {
      actionsData.push(['Immediate Actions', event.immediate_actions_taken]);
    }
    actionsData.push(['Investigation Required', event.investigation_required ? 'Yes' : 'No']);
    if (event.investigation_assigned_to) {
      actionsData.push(['Investigation Assigned To', resolveStaffName(event.investigation_assigned_to, staffMap)]);
    }
    if (event.expected_resolution_date) {
      actionsData.push(['Expected Resolution', event.expected_resolution_date]);
    }
    if (event.lessons_learned) {
      actionsData.push(['Lessons Learned', event.lessons_learned]);
    }
    
    autoTable(pdf, {
      body: actionsData,
      startY: currentY,
      theme: 'plain',
      styles: { 
        fontSize: 9,
        cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
        lineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
        lineWidth: 0.2,
        textColor: [HEALTHCARE_COLORS.text.r, HEALTHCARE_COLORS.text.g, HEALTHCARE_COLORS.text.b],
        halign: 'left',
        overflow: 'linebreak'
      },
      columnStyles: { 
        0: { 
          fontStyle: 'bold', 
          fillColor: [HEALTHCARE_COLORS.primaryLight.r, HEALTHCARE_COLORS.primaryLight.g, HEALTHCARE_COLORS.primaryLight.b],
          cellWidth: 55,
          textColor: [HEALTHCARE_COLORS.dark.r, HEALTHCARE_COLORS.dark.g, HEALTHCARE_COLORS.dark.b]
        },
        1: {
          fillColor: [HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b],
          cellWidth: 115
        }
      },
      margin: { left: 20, right: 20 }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === RISK ASSESSMENT ===
  if (event.risk_level || event.contributing_factors || event.environmental_factors || event.preventable !== undefined) {
    await addSectionHeaderBlob('Risk Assessment');
    
    const riskData = [
      ['Risk Level', event.risk_level || 'Not assessed'],
      ['Preventable', event.preventable === true ? 'Yes' : event.preventable === false ? 'No' : 'Unknown']
    ];
    
    if (event.contributing_factors && event.contributing_factors.length > 0) {
      riskData.push(['Contributing Factors', event.contributing_factors.join(', ')]);
    }
    if (event.environmental_factors) {
      riskData.push(['Environmental Factors', event.environmental_factors]);
    }
    if (event.similar_incidents) {
      riskData.push(['Similar Incidents', event.similar_incidents]);
    }
    
    autoTable(pdf, {
      body: riskData,
      startY: currentY,
      theme: 'plain',
      styles: { 
        fontSize: 9,
        cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
        lineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
        lineWidth: 0.2,
        textColor: [HEALTHCARE_COLORS.text.r, HEALTHCARE_COLORS.text.g, HEALTHCARE_COLORS.text.b],
        halign: 'left',
        overflow: 'linebreak'
      },
      columnStyles: { 
        0: { 
          fontStyle: 'bold', 
          fillColor: [HEALTHCARE_COLORS.primaryLight.r, HEALTHCARE_COLORS.primaryLight.g, HEALTHCARE_COLORS.primaryLight.b],
          cellWidth: 55,
          textColor: [HEALTHCARE_COLORS.dark.r, HEALTHCARE_COLORS.dark.g, HEALTHCARE_COLORS.dark.b]
        },
        1: {
          fillColor: [HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b],
          cellWidth: 115
        }
      },
      margin: { left: 20, right: 20 }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === COMPLIANCE & NOTIFICATIONS ===
  if (event.family_notified || event.gp_notified || event.insurance_notified || event.external_reporting_required) {
    await addSectionHeaderBlob('Compliance & Notifications');
    
    const complianceData = [];
    
    // Family notification
    complianceData.push(['Family Notified', event.family_notified ? 'Yes' : 'No']);
    if (event.family_notified) {
      if (event.family_notification_date) {
        complianceData.push(['Family Notification Date', event.family_notification_date]);
      }
      if (event.family_notification_method) {
        complianceData.push(['Notification Method', event.family_notification_method]);
      }
    }
    
    // GP notification
    complianceData.push(['GP Notified', event.gp_notified ? 'Yes' : 'No']);
    if (event.gp_notified && event.gp_notification_date) {
      complianceData.push(['GP Notification Date', event.gp_notification_date]);
    }
    
    // Insurance notification
    complianceData.push(['Insurance Notified', event.insurance_notified ? 'Yes' : 'No']);
    if (event.insurance_notified && event.insurance_notification_date) {
      complianceData.push(['Insurance Notification Date', event.insurance_notification_date]);
    }
    
    // External reporting
    complianceData.push(['External Reporting Required', event.external_reporting_required ? 'Yes' : 'No']);
    if (event.external_reporting_required && event.external_reporting_details) {
      complianceData.push(['External Reporting Details', event.external_reporting_details]);
    }
    
    autoTable(pdf, {
      body: complianceData,
      startY: currentY,
      theme: 'plain',
      styles: { 
        fontSize: 9,
        cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
        lineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
        lineWidth: 0.2,
        textColor: [HEALTHCARE_COLORS.text.r, HEALTHCARE_COLORS.text.g, HEALTHCARE_COLORS.text.b],
        halign: 'left',
        overflow: 'linebreak'
      },
      columnStyles: { 
        0: { 
          fontStyle: 'bold', 
          fillColor: [HEALTHCARE_COLORS.primaryLight.r, HEALTHCARE_COLORS.primaryLight.g, HEALTHCARE_COLORS.primaryLight.b],
          cellWidth: 55,
          textColor: [HEALTHCARE_COLORS.dark.r, HEALTHCARE_COLORS.dark.g, HEALTHCARE_COLORS.dark.b]
        },
        1: {
          fillColor: [HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b],
          cellWidth: 115
        }
      },
      margin: { left: 20, right: 20 }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === BODY MAP IMAGES ===
  if (event.body_map_front_image_url || event.body_map_back_image_url) {
    if (currentY > 180) {
      pdf.addPage();
      currentY = await addPDFHeader(pdf, orgSettings, logoBase64);
    }
    
    await addSectionHeaderBlob('Body Map');
    
    if (event.body_map_front_image_url) {
      try {
        const frontImageBase64 = await loadImageAsBase64(event.body_map_front_image_url);
        if (frontImageBase64) {
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'bold');
          pdf.text('Front View:', 20, currentY);
          currentY += 5;
          
          pdf.addImage(frontImageBase64, 'PNG', 20, currentY, 80, 100);
          currentY += 105;
        }
      } catch (error) {
        console.error('Error adding front body map image:', error);
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'italic');
        pdf.text('Front body map image could not be loaded', 20, currentY);
        currentY += 10;
      }
    }
    
    if (event.body_map_back_image_url && currentY > 180) {
      pdf.addPage();
      currentY = await addPDFHeader(pdf, orgSettings, logoBase64);
    }
    
    if (event.body_map_back_image_url) {
      try {
        const backImageBase64 = await loadImageAsBase64(event.body_map_back_image_url);
        if (backImageBase64) {
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'bold');
          pdf.text('Back View:', 20, currentY);
          currentY += 5;
          
          pdf.addImage(backImageBase64, 'PNG', 20, currentY, 80, 100);
          currentY += 105;
        }
      } catch (error) {
        console.error('Error adding back body map image:', error);
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'italic');
        pdf.text('Back body map image could not be loaded', 20, currentY);
        currentY += 10;
      }
    }
    
    // Add Body Map Summary after images
    if (event.body_map_points && Array.isArray(event.body_map_points) && event.body_map_points.length > 0) {
      const summary = generateBodyMapSummary(event.body_map_points);
      
      currentY += 10;
      
      const summaryData = [
        ['Total Marks', `${summary.totalMarks} recorded`],
        ['Front Side', `${summary.frontCount} marks`],
        ['Back Side', `${summary.backCount} marks`],
        ['Types', summary.types.length > 0 ? summary.types.join(', ') : 'Not specified'],
        ['Severity Levels', summary.severities.length > 0 ? summary.severities.join(', ') : 'Not specified'],
        ['Notes', summary.notes.length > 0 ? summary.notes.join('; ') : 'No notes recorded']
      ];
      
      autoTable(pdf, {
        body: summaryData,
        startY: currentY,
        theme: 'plain',
        styles: { 
          fontSize: 9,
          cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
          lineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
          lineWidth: 0.2,
          textColor: [HEALTHCARE_COLORS.text.r, HEALTHCARE_COLORS.text.g, HEALTHCARE_COLORS.text.b],
          halign: 'left',
          overflow: 'linebreak'
        },
        columnStyles: { 
          0: { 
            fontStyle: 'bold', 
            fillColor: [HEALTHCARE_COLORS.primaryLight.r, HEALTHCARE_COLORS.primaryLight.g, HEALTHCARE_COLORS.primaryLight.b],
            cellWidth: 55,
            textColor: [HEALTHCARE_COLORS.dark.r, HEALTHCARE_COLORS.dark.g, HEALTHCARE_COLORS.dark.b]
          },
          1: {
            fillColor: [HEALTHCARE_COLORS.white.r, HEALTHCARE_COLORS.white.g, HEALTHCARE_COLORS.white.b],
            cellWidth: 115
          }
        },
        margin: { left: 20, right: 20 },
        tableLineColor: [HEALTHCARE_COLORS.border.r, HEALTHCARE_COLORS.border.g, HEALTHCARE_COLORS.border.b],
        tableLineWidth: 0.3
      });
      
      currentY = (pdf as any).lastAutoTable.finalY + 10;
    }
  }
  
  // === ATTACHMENTS INFO ===
  if (event.attachments && event.attachments.length > 0) {
    // Check if we need a new page
    if (currentY > 220) {
      pdf.addPage();
      currentY = await addPDFHeader(pdf, orgSettings, logoBase64);
    }
    
    await addSectionHeaderBlob('Attachments');
    
    // Create attachments table data
    const attachmentsTableData = event.attachments.map((attachment: any, index: number) => {
      const fileName = attachment.file_name || attachment.name || 'Unknown File';
      const fileType = attachment.file_type || attachment.type || 'Unknown';
      const fileSize = attachment.file_size || attachment.size;
      
      // Format file size
      let sizeDisplay = 'N/A';
      if (fileSize) {
        if (fileSize < 1024) {
          sizeDisplay = `${fileSize} B`;
        } else if (fileSize < 1024 * 1024) {
          sizeDisplay = `${(fileSize / 1024).toFixed(1)} KB`;
        } else {
          sizeDisplay = `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
        }
      }
      
      return [
        (index + 1).toString(),
        fileName,
        fileType,
        sizeDisplay
      ];
    });
    
    // Add attachments table
    autoTable(pdf, {
      head: [['#', 'File Name', 'Type', 'Size']],
      body: attachmentsTableData,
      startY: currentY,
      theme: 'striped',
      styles: { 
        fontSize: 8,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [107, 114, 128],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: { 
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 80 },
        2: { cellWidth: 50 },
        3: { cellWidth: 25, halign: 'right' }
      },
      margin: { left: 20, right: 20 },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }

  // === ADD FOOTERS TO ALL PAGES ===
  const totalPages = pdf.internal.pages.length - 1;
  
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addPDFFooter(pdf, orgSettings, i, totalPages);
  }
  
  // Return as Blob for sharing
  return pdf.output('blob');
};

export const exportEventsListToPDF = (events: ExportableEvent[], filename: string = 'events-logs') => {
  const pdf = new jsPDF('landscape');
  
  // Header with statistics
  pdf.setFontSize(20);
  pdf.text('Events & Logs Report', 20, 20);
  
  pdf.setFontSize(12);
  pdf.text(`Generated: ${format(new Date(), 'PPP')}`, 20, 30);
  pdf.text(`Total Events: ${events.length}`, 20, 37);
  
  // Calculate statistics
  const criticalCount = events.filter(e => e.severity === 'critical').length;
  const highCount = events.filter(e => e.severity === 'high').length;
  const openCount = events.filter(e => e.status === 'open').length;
  const inProgressCount = events.filter(e => e.status === 'in-progress').length;
  
  pdf.setFontSize(10);
  pdf.text(`Critical: ${criticalCount} | High: ${highCount} | Open: ${openCount} | In Progress: ${inProgressCount}`, 20, 44);

  // Events table with comprehensive columns
  const tableData = events.map(event => [
    event.id.substring(0, 8) + '...',  // Short ID
    event.title || '',
    event.client_name || '',
    event.event_type || '',
    event.category || '',
    event.severity || '',
    event.status || '',
    event.reporter || '',
    event.location || '',
    event.event_date || '',
    event.event_time || '',
    format(new Date(event.created_at), 'MM/dd/yy HH:mm'),
    event.action_required ? 'Yes' : 'No',
    event.investigation_required ? 'Yes' : 'No'
  ]);

  autoTable(pdf, {
    head: [[
      'ID',
      'Title',
      'Client',
      'Type',
      'Category',
      'Severity',
      'Status',
      'Reporter',
      'Location',
      'Event Date',
      'Time',
      'Recorded',
      'Action Req.',
      'Investigation'
    ]],
    body: tableData,
    startY: 52,
    theme: 'grid',
    styles: { fontSize: 7 },
    headStyles: { fillColor: [66, 139, 202], fontStyle: 'bold' },
    columnStyles: { 
      0: { cellWidth: 15 },  // ID
      1: { cellWidth: 35 },  // Title
      2: { cellWidth: 25 },  // Client
      3: { cellWidth: 20 },  // Type
      4: { cellWidth: 18 },  // Category
      5: { cellWidth: 15 },  // Severity
      6: { cellWidth: 15 },  // Status
      7: { cellWidth: 22 },  // Reporter
      8: { cellWidth: 20 },  // Location
      9: { cellWidth: 18 },  // Event Date
      10: { cellWidth: 12 }, // Time
      11: { cellWidth: 20 }, // Recorded
      12: { cellWidth: 10 }, // Action
      13: { cellWidth: 15 }  // Investigation
    },
    margin: { left: 10, right: 10 }
  });
  
  // Add footer with page numbers
  const pageCount = (pdf as any).internal.pages.length - 1;
  pdf.setFontSize(8);
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.text(
      `Page ${i} of ${pageCount} | Generated: ${format(new Date(), 'PPP p')}`,
      pdf.internal.pageSize.width / 2,
      pdf.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  pdf.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Client share sections interface for PDF generation
interface ClientPdfSections {
  personalInfo?: boolean;
  generalInfo?: boolean;
  carePlans?: boolean;
  rates?: boolean;
  invoices?: boolean;
  notes?: boolean;
  medicalInfo?: boolean;
  emergencyContacts?: boolean;
}

// Export Client Profile to PDF with comprehensive information
export const exportClientProfileToPDF = async (
  clientId: string, 
  filename?: string,
  selectedSections?: ClientPdfSections
) => {
  const pdf = new jsPDF();
  
  // Default to all sections if none specified
  const sections = selectedSections || {
    personalInfo: true,
    generalInfo: true,
    carePlans: true,
    rates: true,
    invoices: true,
    notes: true,
    medicalInfo: true,
    emergencyContacts: true,
  };
  
  try {
    // Step 1: Fetch client data
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (clientError || !clientData) {
      console.error('Error fetching client:', clientError);
      toast({
        title: "Error",
        description: "Failed to fetch client data for export",
        variant: "destructive"
      });
      return;
    }
    
    // Step 2: Fetch personal information
    const { data: personalInfo } = await supabase
      .from('client_personal_info')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();
    
    // Step 3: Fetch medical information
    const { data: medicalInfo } = await supabase
      .from('client_medical_info')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();
    
    // Step 4: Fetch organization settings
    const orgSettings = clientData.branch_id 
      ? await fetchOrganizationSettings(clientData.branch_id) 
      : null;
    
    // Step 5: Pre-load logo
    let logoBase64: string | null = null;
    if (orgSettings?.logo_url) {
      try {
        logoBase64 = await loadImageAsBase64(orgSettings.logo_url);
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    }
    
    const pageWidth = pdf.internal.pageSize.width;
    const leftMargin = 20;
    const rightMargin = pageWidth - 20;
    
    // Step 6: Add header
    let currentY = await addPDFHeader(pdf, orgSettings, logoBase64);
    
    // Step 7: Add report title
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(30, 30, 30);
    pdf.text('Client Profile Report', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;
    
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated: ${format(new Date(), 'PPP p')}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 12;
    
    pdf.setTextColor(0, 0, 0);
    
    // Helper to add section header
    const addSectionHeader = async (title: string) => {
      if (currentY > 240) {
        pdf.addPage();
        currentY = await addPDFHeader(pdf, orgSettings, logoBase64);
      }
      
      pdf.setFillColor(245, 247, 250);
      pdf.rect(leftMargin, currentY - 5, rightMargin - leftMargin, 10, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(40, 40, 40);
      pdf.text(title, leftMargin + 3, currentY);
      currentY += 8;
      
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(0, 0, 0);
    };
    
    // Helper to calculate age
    const calculateAge = (dob: string) => {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };
    
    // Section 1: Basic Client Information (Personal Info)
    if (sections.personalInfo) {
      await addSectionHeader('Basic Client Information');
      
      const basicClientData = [
        ['Client ID', clientData.id],
        ['Full Name', `${clientData.title || ''} ${clientData.first_name || ''} ${clientData.middle_name || ''} ${clientData.last_name || ''}`.trim()],
        ['Preferred Name', clientData.preferred_name || 'Not provided'],
        ['Pronouns', clientData.pronouns || 'Not provided'],
        ['Date of Birth', clientData.date_of_birth ? format(new Date(clientData.date_of_birth), 'PPP') : 'Not provided'],
        ['Age', clientData.date_of_birth ? `${calculateAge(clientData.date_of_birth)} years` : 'N/A'],
        ['Gender', clientData.gender || 'Not provided'],
        ['Other Identifier', clientData.other_identifier || 'Not provided'],
        ['Status', clientData.status || 'Not provided'],
        ['Registered On', clientData.registered_on ? format(new Date(clientData.registered_on), 'PPP') : 'Not provided'],
        ['Referral Route', clientData.referral_route || 'Not provided']
      ];

      autoTable(pdf, {
        body: basicClientData,
        startY: currentY,
        theme: 'striped',
        styles: { 
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: { 
          0: { 
            fontStyle: 'bold', 
            fillColor: [240, 243, 246],
            cellWidth: 60,
            textColor: [40, 40, 40]
          },
          1: {
            cellWidth: 110
          }
        },
        margin: { left: 20, right: 20 }
      });

      currentY = (pdf as any).lastAutoTable.finalY + 10;
      
      // Section 2: Contact Information (part of Personal Info)
      await addSectionHeader('Contact Information');
      
      const contactData = [
        ['Email', clientData.email || 'Not provided'],
        ['Phone', clientData.phone || 'Not provided'],
        ['Telephone', clientData.telephone_number || 'Not provided'],
        ['Country Code', clientData.country_code || 'Not provided'],
        ['Full Address', clientData.address || 'Not provided'],
        ['Region', clientData.region || 'Not provided']
      ];

      autoTable(pdf, {
        body: contactData,
        startY: currentY,
        theme: 'striped',
        styles: { 
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: { 
          0: { 
            fontStyle: 'bold', 
            fillColor: [240, 243, 246],
            cellWidth: 60,
            textColor: [40, 40, 40]
          },
          1: {
            cellWidth: 110
          }
        },
        margin: { left: 20, right: 20 }
      });

      currentY = (pdf as any).lastAutoTable.finalY + 10;
    }
    
    // Section 3: Emergency Contact
    if (sections.emergencyContacts && personalInfo) {
      await addSectionHeader('Emergency Contact Information');
      
      const emergencyData = [
        ['Emergency Contact Name', personalInfo.emergency_contact_name || 'Not provided'],
        ['Emergency Contact Phone', personalInfo.emergency_contact_phone || 'Not provided'],
        ['Relationship', personalInfo.emergency_contact_relationship || 'Not provided'],
        ['Next of Kin Name', personalInfo.next_of_kin_name || 'Not provided'],
        ['Next of Kin Phone', personalInfo.next_of_kin_phone || 'Not provided'],
        ['Next of Kin Relationship', personalInfo.next_of_kin_relationship || 'Not provided']
      ];

      autoTable(pdf, {
        body: emergencyData,
        startY: currentY,
        theme: 'striped',
        styles: { 
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: { 
          0: { 
            fontStyle: 'bold', 
            fillColor: [240, 243, 246],
            cellWidth: 60,
            textColor: [40, 40, 40]
          },
          1: {
            cellWidth: 110
          }
        },
        margin: { left: 20, right: 20 }
      });

      currentY = (pdf as any).lastAutoTable.finalY + 10;
    }
    
    // Section 4-13: General Information (Personal Background, Home Info, Accessibility, GP, Care Preferences, etc.)
    if (sections.generalInfo && personalInfo) {
      // Section 4: Personal Background
      await addSectionHeader('Personal Background & Identity');
      
      const backgroundData = [
        ['Ethnicity', personalInfo.ethnicity || 'Not provided'],
        ['Sexual Orientation', personalInfo.sexual_orientation || 'Not provided'],
        ['Gender Identity', personalInfo.gender_identity || 'Not provided'],
        ['Nationality', personalInfo.nationality || 'Not provided'],
        ['Primary Language', personalInfo.primary_language || 'Not provided'],
        ['Interpreter Required', personalInfo.interpreter_required ? 'Yes' : 'No'],
        ['Preferred Interpreter Language', personalInfo.preferred_interpreter_language || 'Not provided'],
        ['Religion', personalInfo.religion || 'Not provided'],
        ['Marital Status', personalInfo.marital_status || 'Not provided']
      ];

      autoTable(pdf, {
        body: backgroundData,
        startY: currentY,
        theme: 'striped',
        styles: { 
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: { 
          0: { 
            fontStyle: 'bold', 
            fillColor: [240, 243, 246],
            cellWidth: 60,
            textColor: [40, 40, 40]
          },
          1: {
            cellWidth: 110
          }
        },
        margin: { left: 20, right: 20 }
      });

      currentY = (pdf as any).lastAutoTable.finalY + 10;
      
      // Section 5: Home Information
      await addSectionHeader('Home Information');
      
      const homeData = [
        ['Property Type', personalInfo.property_type || 'Not provided'],
        ['Living Arrangement', personalInfo.living_arrangement || 'Not provided'],
        ['Home Accessibility', personalInfo.home_accessibility || 'Not provided'],
        ['Pets', personalInfo.pets || 'Not provided'],
        ['Key Safe Location', personalInfo.key_safe_location || 'Not provided'],
        ['Parking Availability', personalInfo.parking_availability || 'Not provided'],
        ['Emergency Access', personalInfo.emergency_access || 'Not provided']
      ];

      autoTable(pdf, {
        body: homeData,
        startY: currentY,
        theme: 'striped',
        styles: { 
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: { 
          0: { 
            fontStyle: 'bold', 
            fillColor: [240, 243, 246],
            cellWidth: 60,
            textColor: [40, 40, 40]
          },
          1: {
            cellWidth: 110
          }
        },
        margin: { left: 20, right: 20 }
      });

      currentY = (pdf as any).lastAutoTable.finalY + 10;
      
      // Section 6: Accessibility & Communication
      await addSectionHeader('Accessibility & Communication');
      
      const accessibilityData = [
        ['Sensory Impairment', personalInfo.sensory_impairment || 'Not provided'],
        ['Communication Aids', personalInfo.communication_aids || 'Not provided'],
        ['Preferred Communication Method', personalInfo.preferred_communication_method || 'Not provided'],
        ['Hearing Difficulties', personalInfo.hearing_difficulties ? 'Yes' : 'No'],
        ['Vision Difficulties', personalInfo.vision_difficulties ? 'Yes' : 'No'],
        ['Speech Difficulties', personalInfo.speech_difficulties ? 'Yes' : 'No'],
        ['Cognitive Impairment', personalInfo.cognitive_impairment ? 'Yes' : 'No'],
        ['Mobility Aids', personalInfo.mobility_aids || 'Not provided']
      ];

      autoTable(pdf, {
        body: accessibilityData,
        startY: currentY,
        theme: 'striped',
        styles: { 
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: { 
          0: { 
            fontStyle: 'bold', 
            fillColor: [240, 243, 246],
            cellWidth: 60,
            textColor: [40, 40, 40]
          },
          1: {
            cellWidth: 110
          }
        },
        margin: { left: 20, right: 20 }
      });

      currentY = (pdf as any).lastAutoTable.finalY + 10;
      
      // Section 7: GP & Medical Services
      await addSectionHeader('GP & Medical Services');
      
      const gpData = [
        ['GP Name', personalInfo.gp_name || 'Not provided'],
        ['GP Surgery Name', personalInfo.gp_surgery_name || 'Not provided'],
        ['GP Surgery Address', personalInfo.gp_surgery_address || 'Not provided'],
        ['GP Surgery Phone', personalInfo.gp_surgery_phone || 'Not provided'],
        ['GP Surgery ODS Code', personalInfo.gp_surgery_ods_code || 'Not provided'],
        ['Pharmacy Name', personalInfo.pharmacy_name || 'Not provided'],
        ['Pharmacy Address', personalInfo.pharmacy_address || 'Not provided'],
        ['Pharmacy Phone', personalInfo.pharmacy_phone || 'Not provided'],
        ['Pharmacy ODS Code', personalInfo.pharmacy_ods_code || 'Not provided']
      ];

      autoTable(pdf, {
        body: gpData,
        startY: currentY,
        theme: 'striped',
        styles: { 
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: { 
          0: { 
            fontStyle: 'bold', 
            fillColor: [240, 243, 246],
            cellWidth: 60,
            textColor: [40, 40, 40]
          },
          1: {
            cellWidth: 110
          }
        },
        margin: { left: 20, right: 20 }
      });

      currentY = (pdf as any).lastAutoTable.finalY + 10;
      
      // Section 8: Care Preferences
      await addSectionHeader('Care Preferences');
      
      const preferencesData = [
        ['Cultural Preferences', personalInfo.cultural_preferences || 'Not provided'],
        ['Language Preferences', personalInfo.language_preferences || 'Not provided'],
        ['Preferred Communication', personalInfo.preferred_communication || 'Not provided']
      ];

      autoTable(pdf, {
        body: preferencesData,
        startY: currentY,
        theme: 'striped',
        styles: { 
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: { 
          0: { 
            fontStyle: 'bold', 
            fillColor: [240, 243, 246],
            cellWidth: 60,
            textColor: [40, 40, 40]
          },
          1: {
            cellWidth: 110
          }
        },
        margin: { left: 20, right: 20 }
      });

      currentY = (pdf as any).lastAutoTable.finalY + 10;
      
      // Section 9: Likes & Preferences (Do's & Don'ts)
      if (personalInfo.likes_preferences || personalInfo.dislikes_restrictions || personalInfo.dos || personalInfo.donts) {
        await addSectionHeader("Do's & Don'ts");
        
        if (personalInfo.likes_preferences) {
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'bold');
          pdf.text('Likes & Preferences:', leftMargin, currentY);
          currentY += 5;
          
          pdf.setFont(undefined, 'normal');
          pdf.setFontSize(9);
          const likesLines = pdf.splitTextToSize(personalInfo.likes_preferences, 160);
          pdf.text(likesLines, leftMargin + 5, currentY);
          currentY += (likesLines.length * 5) + 5;
        }
        
        if (personalInfo.dislikes_restrictions) {
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'bold');
          pdf.text('Dislikes & Restrictions:', leftMargin, currentY);
          currentY += 5;
          
          pdf.setFont(undefined, 'normal');
          pdf.setFontSize(9);
          const dislikesLines = pdf.splitTextToSize(personalInfo.dislikes_restrictions, 160);
          pdf.text(dislikesLines, leftMargin + 5, currentY);
          currentY += (dislikesLines.length * 5) + 5;
        }
        
        if (personalInfo.dos) {
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'bold');
          pdf.text("Do's:", leftMargin, currentY);
          currentY += 5;
          
          pdf.setFont(undefined, 'normal');
          pdf.setFontSize(9);
          const dosLines = pdf.splitTextToSize(personalInfo.dos, 160);
          pdf.text(dosLines, leftMargin + 5, currentY);
          currentY += (dosLines.length * 5) + 5;
        }
        
        if (personalInfo.donts) {
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'bold');
          pdf.text("Don'ts:", leftMargin, currentY);
          currentY += 5;
          
          pdf.setFont(undefined, 'normal');
          pdf.setFontSize(9);
          const dontsLines = pdf.splitTextToSize(personalInfo.donts, 160);
          pdf.text(dontsLines, leftMargin + 5, currentY);
          currentY += (dontsLines.length * 5) + 10;
        }
      }
      
      // Section 10: Goals & Outcomes
      if (personalInfo.personal_goals || personalInfo.desired_outcomes || personalInfo.success_measures || personalInfo.priority_areas) {
        await addSectionHeader('Goals & Desired Outcomes');
        
        const goalsData = [];
        if (personalInfo.personal_goals) goalsData.push(['Personal Goals', personalInfo.personal_goals]);
        if (personalInfo.desired_outcomes) goalsData.push(['Desired Outcomes', personalInfo.desired_outcomes]);
        if (personalInfo.success_measures) goalsData.push(['Success Measures', personalInfo.success_measures]);
        if (personalInfo.priority_areas) goalsData.push(['Priority Areas', personalInfo.priority_areas]);

        autoTable(pdf, {
          body: goalsData,
          startY: currentY,
          theme: 'striped',
          styles: { 
            fontSize: 9,
            cellPadding: 3
          },
          columnStyles: { 
            0: { 
              fontStyle: 'bold', 
              fillColor: [240, 243, 246],
              cellWidth: 60,
              textColor: [40, 40, 40]
            },
            1: {
              cellWidth: 110
            }
          },
          margin: { left: 20, right: 20 }
        });

        currentY = (pdf as any).lastAutoTable.finalY + 10;
      }
      
      // Section 11: General Care Information
      await addSectionHeader('General Care Information');
      
      const generalData = [
        ['Main Reasons for Care', personalInfo.main_reasons_for_care || 'Not provided'],
        ['Used Other Care Providers', personalInfo.used_other_care_providers ? 'Yes' : 'No'],
        ['Fallen in Past 6 Months', personalInfo.fallen_past_six_months ? 'Yes' : 'No'],
        ['Has Assistance Device', personalInfo.has_assistance_device ? 'Yes' : 'No'],
        ['Arrange Assistance Device', personalInfo.arrange_assistance_device ? 'Yes' : 'No'],
        ['Bereavement in Past 2 Years', personalInfo.bereavement_past_two_years ? 'Yes' : 'No']
      ];

      autoTable(pdf, {
        body: generalData,
        startY: currentY,
        theme: 'striped',
        styles: { 
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: { 
          0: { 
            fontStyle: 'bold', 
            fillColor: [240, 243, 246],
            cellWidth: 60,
            textColor: [40, 40, 40]
          },
          1: {
            cellWidth: 110
          }
        },
        margin: { left: 20, right: 20 }
      });

      currentY = (pdf as any).lastAutoTable.finalY + 10;
      
      // Section 12: Warnings & Instructions
      if ((Array.isArray(personalInfo.warnings) && personalInfo.warnings.length > 0) || (Array.isArray(personalInfo.instructions) && personalInfo.instructions.length > 0)) {
        await addSectionHeader('Warnings & Instructions');
        
        if (Array.isArray(personalInfo.warnings) && personalInfo.warnings.length > 0) {
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'bold');
          pdf.text('Warnings:', leftMargin, currentY);
          currentY += 5;
          
          pdf.setFont(undefined, 'normal');
          pdf.setFontSize(9);
          personalInfo.warnings.forEach((warning: string) => {
            pdf.text(`• ${warning}`, leftMargin + 5, currentY);
            currentY += 5;
          });
          currentY += 5;
        }
        
        if (Array.isArray(personalInfo.instructions) && personalInfo.instructions.length > 0) {
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'bold');
          pdf.text('Instructions:', leftMargin, currentY);
          currentY += 5;
          
          pdf.setFont(undefined, 'normal');
          pdf.setFontSize(9);
          personalInfo.instructions.forEach((instruction: string) => {
            pdf.text(`• ${instruction}`, leftMargin + 5, currentY);
            currentY += 5;
          });
          currentY += 5;
        }
      }
      
      // Section 13: Important Occasions
      if (personalInfo.important_occasions && Array.isArray(personalInfo.important_occasions) && personalInfo.important_occasions.length > 0) {
        await addSectionHeader('Important Occasions');
        
        const occasionsData = personalInfo.important_occasions.map((occasion: any) => [
          occasion.occasion || 'Not specified',
          occasion.date ? format(new Date(occasion.date), 'PPP') : 'No date provided'
        ]);

        autoTable(pdf, {
          head: [['Occasion', 'Date']],
          body: occasionsData,
          startY: currentY,
          theme: 'striped',
          styles: { 
            fontSize: 9,
            cellPadding: 3
          },
          headStyles: {
            fillColor: [240, 243, 246],
            textColor: [40, 40, 40],
            fontStyle: 'bold'
          },
          margin: { left: 20, right: 20 }
        });

        currentY = (pdf as any).lastAutoTable.finalY + 10;
      }
    }
    
    // Section 14: Medical Information (if selected and available)
    if (sections.medicalInfo && medicalInfo) {
      await addSectionHeader('Medical Information');
      
      const medicalData = [];
      if (medicalInfo.allergies && Array.isArray(medicalInfo.allergies) && medicalInfo.allergies.length > 0) {
        medicalData.push(['Allergies', medicalInfo.allergies.join(', ')]);
      }
      if (medicalInfo.current_medications && Array.isArray(medicalInfo.current_medications) && medicalInfo.current_medications.length > 0) {
        medicalData.push(['Current Diagnosis', medicalInfo.current_medications.join(', ')]);
      }
      if (medicalInfo.medical_conditions && Array.isArray(medicalInfo.medical_conditions) && medicalInfo.medical_conditions.length > 0) {
        medicalData.push(['Medical Conditions', medicalInfo.medical_conditions.join(', ')]);
      }
      if (medicalInfo.mobility_status) medicalData.push(['Mobility Status', medicalInfo.mobility_status]);

      if (medicalData.length > 0) {
        autoTable(pdf, {
          body: medicalData,
          startY: currentY,
          theme: 'striped',
          styles: { 
            fontSize: 9,
            cellPadding: 3
          },
          columnStyles: { 
            0: { 
              fontStyle: 'bold', 
              fillColor: [240, 243, 246],
              cellWidth: 60,
              textColor: [40, 40, 40]
            },
            1: {
              cellWidth: 110
            }
          },
          margin: { left: 20, right: 20 }
        });

        currentY = (pdf as any).lastAutoTable.finalY + 10;
      }
    }
    
    // Section 15: Notes (if selected)
    if (sections.notes && clientData.additional_information) {
      await addSectionHeader('Additional Notes');
      
      pdf.setDrawColor(220, 220, 220);
      pdf.setFillColor(252, 252, 252);
      
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      const splitNotes = pdf.splitTextToSize(clientData.additional_information, 160);
      
      const boxHeight = (splitNotes.length * 5) + 10;
      pdf.rect(leftMargin, currentY, rightMargin - leftMargin, boxHeight, 'FD');
      
      pdf.text(splitNotes, leftMargin + 5, currentY + 7);
      currentY += boxHeight + 10;
    }
    
    // Section 16: Care Plans (if selected)
    if (sections.carePlans) {
      const { data: carePlans } = await supabase
        .from('client_care_plans')
        .select('id, title, status, start_date, end_date, provider_name')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (carePlans && carePlans.length > 0) {
        await addSectionHeader('Care Plans');
        
        const carePlanData = carePlans.map((plan: any) => [
          plan.title || 'Untitled Plan',
          plan.status || 'N/A',
          plan.start_date ? format(new Date(plan.start_date), 'PP') : 'N/A',
          plan.end_date ? format(new Date(plan.end_date), 'PP') : 'Ongoing',
          plan.provider_name || 'N/A'
        ]);

        autoTable(pdf, {
          head: [['Title', 'Status', 'Start Date', 'End Date', 'Provider']],
          body: carePlanData,
          startY: currentY,
          theme: 'striped',
          styles: { 
            fontSize: 8,
            cellPadding: 3
          },
          headStyles: {
            fillColor: [240, 243, 246],
            textColor: [40, 40, 40],
            fontStyle: 'bold'
          },
          margin: { left: 20, right: 20 }
        });

        currentY = (pdf as any).lastAutoTable.finalY + 10;
      }
    }
    
    // Section 17: Service Rates (if selected)
    if (sections.rates) {
      const { data: ratesData } = await supabase
        .from('client_accounting_settings')
        .select('rate_type, pay_method, invoice_method, service_payer')
        .eq('client_id', clientId)
        .maybeSingle();
      
      if (ratesData) {
        await addSectionHeader('Service Rates & Billing');
        
        const rateDetails = [
          ['Rate Type', ratesData.rate_type || 'Not provided'],
          ['Pay Method', ratesData.pay_method || 'Not provided'],
          ['Invoice Method', ratesData.invoice_method || 'Not provided'],
          ['Service Payer', ratesData.service_payer || 'Not provided']
        ];

        autoTable(pdf, {
          body: rateDetails,
          startY: currentY,
          theme: 'striped',
          styles: { 
            fontSize: 9,
            cellPadding: 3
          },
          columnStyles: { 
            0: { 
              fontStyle: 'bold', 
              fillColor: [240, 243, 246],
              cellWidth: 60,
              textColor: [40, 40, 40]
            },
            1: {
              cellWidth: 110
            }
          },
          margin: { left: 20, right: 20 }
        });

        currentY = (pdf as any).lastAutoTable.finalY + 10;
      }
    }
    
    // Section 18: Invoices Summary (if selected - sensitive)
    if (sections.invoices) {
      const { data: invoicesData } = await supabase
        .from('client_billing')
        .select('invoice_number, invoice_date, amount, status, description')
        .eq('client_id', clientId)
        .order('invoice_date', { ascending: false })
        .limit(10);
      
      if (invoicesData && invoicesData.length > 0) {
        await addSectionHeader('Recent Invoices');
        
        const invoiceRows = invoicesData.map((inv: any) => [
          inv.invoice_number || 'N/A',
          inv.invoice_date ? format(new Date(inv.invoice_date), 'PP') : 'N/A',
          inv.amount ? `£${inv.amount.toFixed(2)}` : 'N/A',
          inv.status || 'N/A',
          (inv.description || 'N/A').substring(0, 30)
        ]);

        autoTable(pdf, {
          head: [['Invoice #', 'Date', 'Amount', 'Status', 'Description']],
          body: invoiceRows,
          startY: currentY,
          theme: 'striped',
          styles: { 
            fontSize: 8,
            cellPadding: 3
          },
          headStyles: {
            fillColor: [240, 243, 246],
            textColor: [40, 40, 40],
            fontStyle: 'bold'
          },
          margin: { left: 20, right: 20 }
        });

        currentY = (pdf as any).lastAutoTable.finalY + 10;
      }
    }
    
    // Add footers to all pages
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addPDFFooter(pdf, orgSettings, i, totalPages);
    }
    
    // Save PDF
    const pdfFilename = filename || `client-profile-${clientData.first_name}-${clientData.last_name}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    pdf.save(pdfFilename);
    
    toast({
      title: "Success",
      description: "Client profile exported successfully.",
    });
    
  } catch (error) {
    console.error('Error generating client profile PDF:', error);
    toast({
      title: "Error",
      description: "Failed to generate PDF. Please try again.",
      variant: "destructive"
    });
  }
};