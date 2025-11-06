import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';

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
  address: string | null;
  telephone: string | null;
  website: string | null;
  email: string | null;
  logo_url: string | null;
} | null> => {
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

// Helper function to add header to each page
const addPDFHeader = async (
  pdf: jsPDF, 
  orgSettings: any, 
  logoBase64: string | null
): Promise<number> => {
  const pageWidth = pdf.internal.pageSize.width;
  const leftMargin = 20;
  const rightMargin = pageWidth - 20;
  let headerY = 15;

  // LEFT SIDE: Company Information
  if (orgSettings) {
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(40, 40, 40);
    
    // Company Name
    pdf.text(orgSettings.name, leftMargin, headerY);
    headerY += 5;
    
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(80, 80, 80);
    
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
      // Position logo on right side (max width: 50, max height: 30)
      const logoX = rightMargin - 50;
      pdf.addImage(logoBase64, 'PNG', logoX, 12, 50, 30);
    } catch (error) {
      console.error('Error adding logo to header:', error);
    }
  }

  // Add separator line below header
  const separatorY = Math.max(headerY + 2, 45);
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(leftMargin, separatorY, rightMargin, separatorY);
  
  // Reset colors
  pdf.setTextColor(0, 0, 0);
  
  return separatorY + 8; // Return Y position for content start
};

// Helper function to add footer to each page
const addPDFFooter = (pdf: jsPDF, orgSettings: any, pageNumber: number, totalPages: number) => {
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const footerY = pageHeight - 15;
  
  // Add subtle line above footer
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.3);
  pdf.line(20, footerY - 5, pageWidth - 20, footerY - 5);
  
  // Footer text
  pdf.setFontSize(8);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(120, 120, 120);
  
  const footerText = orgSettings 
    ? `© ${orgSettings.name} | ${orgSettings.website || 'www.company.com'} | All Rights Reserved`
    : '© Company Name | All Rights Reserved';
  
  pdf.text(footerText, pageWidth / 2, footerY, { align: 'center' });
  
  // Page number
  pdf.setFontSize(7);
  pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 20, footerY, { align: 'right' });
  
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
  let currentY = await addPDFHeader(pdf, orgSettings, logoBase64);
  
  // === REPORT TITLE ===
  pdf.setFontSize(18);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(30, 30, 30);
  pdf.text('Event Details Report', pageWidth / 2, currentY, { align: 'center' });
  currentY += 7;
  
  pdf.setFontSize(9);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated: ${format(new Date(), 'PPP p')}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 12;
  
  // Reset text color
  pdf.setTextColor(0, 0, 0);

  // Helper to add section header with background
  const addSectionHeader = async (title: string) => {
    // Check if we need a new page
    if (currentY > 240) {
      pdf.addPage();
      currentY = await addPDFHeader(pdf, orgSettings, logoBase64);
    }
    
    // Section header with background
    pdf.setFillColor(245, 247, 250);
    pdf.rect(leftMargin, currentY - 5, rightMargin - leftMargin, 10, 'F');
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(40, 40, 40);
    pdf.text(title, leftMargin + 3, currentY);
    currentY += 8;
    
    // Reset
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(0, 0, 0);
  };
  
  // === BASIC EVENT DETAILS ===
  await addSectionHeader('Event Information');
  
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
    theme: 'striped',
    styles: { 
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: { 
      0: { 
        fontStyle: 'bold', 
        fillColor: [240, 243, 246],
        cellWidth: 55,
        textColor: [40, 40, 40]
      },
      1: {
        cellWidth: 115
      }
    },
    margin: { left: leftMargin, right: rightMargin }
  });

  currentY = (pdf as any).lastAutoTable.finalY + 10;
  
  // === DESCRIPTION ===
  if (event.description) {
    await addSectionHeader('Event Description');
    
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
    
    await addSectionHeader('Staff & People Information');
    
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
      theme: 'striped',
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: { 
        0: { 
          fontStyle: 'bold', 
          fillColor: [240, 243, 246],
          cellWidth: 55,
          textColor: [40, 40, 40]
        }
      },
      margin: { left: leftMargin, right: rightMargin }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === FOLLOW-UP INFORMATION ===
  if (event.action_required || event.follow_up_date || event.follow_up_assigned_to || event.follow_up_notes) {
    await addSectionHeader('Follow-Up Details');
    
    const followUpData = [
      ['Action Required', event.action_required ? 'Yes' : 'No'],
      ['Follow-up Date', event.follow_up_date || 'Not set'],
      ['Assigned To', resolveStaffName(event.follow_up_assigned_to, staffMap)],
      ['Follow-up Notes', event.follow_up_notes || 'No notes']
    ];
    
    autoTable(pdf, {
      body: followUpData,
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
          cellWidth: 55,
          textColor: [40, 40, 40]
        }
      },
      margin: { left: leftMargin, right: rightMargin }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === ACTIONS TAKEN ===
  if (event.immediate_actions_taken || event.investigation_required || event.lessons_learned) {
    await addSectionHeader('Actions & Investigation');
    
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
      theme: 'striped',
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: { 
        0: { 
          fontStyle: 'bold', 
          fillColor: [240, 243, 246],
          cellWidth: 55,
          textColor: [40, 40, 40]
        }
      },
      margin: { left: leftMargin, right: rightMargin }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === RISK ASSESSMENT ===
  if (event.risk_level || event.contributing_factors || event.environmental_factors || event.preventable !== undefined) {
    await addSectionHeader('Risk Assessment');
    
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
      theme: 'striped',
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: { 
        0: { 
          fontStyle: 'bold', 
          fillColor: [240, 243, 246],
          cellWidth: 55,
          textColor: [40, 40, 40]
        }
      },
      margin: { left: leftMargin, right: rightMargin }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === COMPLIANCE & NOTIFICATIONS ===
  if (event.family_notified || event.gp_notified || event.insurance_notified || event.external_reporting_required) {
    await addSectionHeader('Compliance & Notifications');
    
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
      theme: 'striped',
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: { 
        0: { 
          fontStyle: 'bold', 
          fillColor: [240, 243, 246],
          cellWidth: 55,
          textColor: [40, 40, 40]
        }
      },
      margin: { left: leftMargin, right: rightMargin }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === BODY MAP IMAGES ===
  if (event.body_map_front_image_url || event.body_map_back_image_url) {
    if (currentY > 180) {
      pdf.addPage();
      currentY = await addPDFHeader(pdf, orgSettings, logoBase64);
    }
    
    await addSectionHeader('Body Map');
    
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
  }
  
  // === ATTACHMENTS INFO ===
  if (event.attachments && event.attachments.length > 0) {
    await addSectionHeader('Attachments');
    
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.text(`This event has ${event.attachments.length} file(s) attached.`, leftMargin, currentY);
    currentY += 10;
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
  let currentY = await addPDFHeader(pdf, orgSettings, logoBase64);
  
  // === REPORT TITLE ===
  pdf.setFontSize(18);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(30, 30, 30);
  pdf.text('Event Details Report', pageWidth / 2, currentY, { align: 'center' });
  currentY += 7;
  
  pdf.setFontSize(9);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated: ${format(new Date(), 'PPP p')}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 12;
  
  // Reset text color
  pdf.setTextColor(0, 0, 0);

  // Helper to add section header with background
  const addSectionHeader = async (title: string) => {
    // Check if we need a new page
    if (currentY > 240) {
      pdf.addPage();
      currentY = await addPDFHeader(pdf, orgSettings, logoBase64);
    }
    
    // Section header with background
    pdf.setFillColor(245, 247, 250);
    pdf.rect(leftMargin, currentY - 5, rightMargin - leftMargin, 10, 'F');
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(40, 40, 40);
    pdf.text(title, leftMargin + 3, currentY);
    currentY += 8;
    
    // Reset
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(0, 0, 0);
  };
  
  // === BASIC EVENT DETAILS ===
  await addSectionHeader('Event Information');
  
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
    theme: 'striped',
    styles: { 
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: { 
      0: { 
        fontStyle: 'bold', 
        fillColor: [240, 243, 246],
        cellWidth: 55,
        textColor: [40, 40, 40]
      },
      1: {
        cellWidth: 115
      }
    },
    margin: { left: leftMargin, right: rightMargin }
  });

  currentY = (pdf as any).lastAutoTable.finalY + 10;
  
  // === DESCRIPTION ===
  if (event.description) {
    await addSectionHeader('Event Description');
    
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
    
    await addSectionHeader('Staff & People Information');
    
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
      theme: 'striped',
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: { 
        0: { 
          fontStyle: 'bold', 
          fillColor: [240, 243, 246],
          cellWidth: 55,
          textColor: [40, 40, 40]
        }
      },
      margin: { left: leftMargin, right: rightMargin }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === FOLLOW-UP INFORMATION ===
  if (event.action_required || event.follow_up_date || event.follow_up_assigned_to || event.follow_up_notes) {
    await addSectionHeader('Follow-Up Details');
    
    const followUpData = [
      ['Action Required', event.action_required ? 'Yes' : 'No'],
      ['Follow-up Date', event.follow_up_date || 'Not set'],
      ['Assigned To', resolveStaffName(event.follow_up_assigned_to, staffMap)],
      ['Follow-up Notes', event.follow_up_notes || 'No notes']
    ];
    
    autoTable(pdf, {
      body: followUpData,
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
          cellWidth: 55,
          textColor: [40, 40, 40]
        }
      },
      margin: { left: leftMargin, right: rightMargin }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === ACTIONS TAKEN ===
  if (event.immediate_actions_taken || event.investigation_required || event.lessons_learned) {
    await addSectionHeader('Actions & Investigation');
    
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
      theme: 'striped',
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: { 
        0: { 
          fontStyle: 'bold', 
          fillColor: [240, 243, 246],
          cellWidth: 55,
          textColor: [40, 40, 40]
        }
      },
      margin: { left: leftMargin, right: rightMargin }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === RISK ASSESSMENT ===
  if (event.risk_level || event.contributing_factors || event.environmental_factors || event.preventable !== undefined) {
    await addSectionHeader('Risk Assessment');
    
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
      theme: 'striped',
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: { 
        0: { 
          fontStyle: 'bold', 
          fillColor: [240, 243, 246],
          cellWidth: 55,
          textColor: [40, 40, 40]
        }
      },
      margin: { left: leftMargin, right: rightMargin }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === COMPLIANCE & NOTIFICATIONS ===
  if (event.family_notified || event.gp_notified || event.insurance_notified || event.external_reporting_required) {
    await addSectionHeader('Compliance & Notifications');
    
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
      theme: 'striped',
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: { 
        0: { 
          fontStyle: 'bold', 
          fillColor: [240, 243, 246],
          cellWidth: 55,
          textColor: [40, 40, 40]
        }
      },
      margin: { left: leftMargin, right: rightMargin }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === BODY MAP IMAGES ===
  if (event.body_map_front_image_url || event.body_map_back_image_url) {
    if (currentY > 180) {
      pdf.addPage();
      currentY = await addPDFHeader(pdf, orgSettings, logoBase64);
    }
    
    await addSectionHeader('Body Map');
    
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
  }
  
  // === ATTACHMENTS INFO ===
  if (event.attachments && event.attachments.length > 0) {
    await addSectionHeader('Attachments');
    
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.text(`This event has ${event.attachments.length} file(s) attached.`, leftMargin, currentY);
    currentY += 10;
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