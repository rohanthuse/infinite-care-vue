import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  location?: string;
  description?: string;
  event_date?: string;
  event_time?: string;
  created_at: string;
  updated_at?: string;
  recorded_by_staff_name?: string;
  
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

export const exportEventsToCSV = (events: ExportableEvent[], filename: string = 'events-logs') => {
  const headers = [
    'Title',
    'Client',
    'Type',
    'Category',
    'Severity', 
    'Status',
    'Reporter',
    'Location',
    'Event Date',
    'Event Time',
    'Recorded Date',
    'Recorded By',
    'Description'
  ];

  const csvData = events.map(event => [
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
    format(new Date(event.created_at), 'yyyy-MM-dd HH:mm'),
    event.recorded_by_staff_name || '',
    (event.description || '').replace(/[\r\n]+/g, ' ')
  ]);

  const csvContent = [headers, ...csvData]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const exportEventToPDF = (event: ExportableEvent, filename?: string) => {
  const pdf = new jsPDF();
  let currentY = 20;
  
  // Header
  pdf.setFontSize(20);
  pdf.text('Event Log Report', 20, currentY);
  currentY += 10;
  
  pdf.setFontSize(12);
  pdf.text(`Generated: ${format(new Date(), 'PPP')}`, 20, currentY);
  currentY += 15;
  
  // === BASIC EVENT DETAILS ===
  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  pdf.text('Event Information', 20, currentY);
  currentY += 5;
  
  const basicEventData = [
    ['Title', event.title || ''],
    ['Client', event.client_name || ''],
    ['Event Type', event.event_type || ''],
    ['Category', event.category || ''],
    ['Severity', event.severity || ''],
    ['Status', event.status || ''],
    ['Reporter', event.reporter || ''],
    ['Location', event.location || 'Not specified'],
    ['Event Date', event.event_date || ''],
    ['Event Time', event.event_time || ''],
    ['Recorded Date', format(new Date(event.created_at), 'PPP')],
    ['Recorded By', event.recorded_by_staff_name || ''],
    ['Last Updated', event.updated_at ? format(new Date(event.updated_at), 'PPP p') : 'N/A']
  ];

  autoTable(pdf, {
    head: [['Field', 'Value']],
    body: basicEventData,
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 50 } },
    margin: { left: 20, right: 20 }
  });

  currentY = (pdf as any).lastAutoTable.finalY + 10;
  
  // === DESCRIPTION ===
  if (event.description) {
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Description', 20, currentY);
    currentY += 5;
    
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    const splitDescription = pdf.splitTextToSize(event.description, 170);
    pdf.text(splitDescription, 20, currentY);
    currentY += (splitDescription.length * 5) + 10;
  }
  
  // === STAFF INFORMATION ===
  if ((event.staff_present && event.staff_present.length > 0) || 
      (event.staff_aware && event.staff_aware.length > 0) || 
      (event.other_people_present && event.other_people_present.length > 0)) {
    
    // Check if we need a new page
    if (currentY > 240) {
      pdf.addPage();
      currentY = 20;
    }
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Staff & People Information', 20, currentY);
    currentY += 5;
    
    const staffData = [];
    if (event.staff_present && event.staff_present.length > 0) {
      staffData.push(['Staff Present', event.staff_present.join(', ')]);
    }
    if (event.staff_aware && event.staff_aware.length > 0) {
      staffData.push(['Staff Aware', event.staff_aware.join(', ')]);
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
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 50 } },
      margin: { left: 20, right: 20 }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === FOLLOW-UP INFORMATION ===
  if (event.action_required || event.follow_up_date || event.follow_up_assigned_to || event.follow_up_notes) {
    if (currentY > 240) {
      pdf.addPage();
      currentY = 20;
    }
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Follow-Up Details', 20, currentY);
    currentY += 5;
    
    const followUpData = [
      ['Action Required', event.action_required ? 'Yes' : 'No'],
      ['Follow-up Date', event.follow_up_date || 'Not set'],
      ['Assigned To', event.follow_up_assigned_to || 'Not assigned'],
      ['Follow-up Notes', event.follow_up_notes || 'No notes']
    ];
    
    autoTable(pdf, {
      body: followUpData,
      startY: currentY,
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 50 } },
      margin: { left: 20, right: 20 }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === ACTIONS TAKEN ===
  if (event.immediate_actions_taken || event.investigation_required || event.lessons_learned) {
    if (currentY > 240) {
      pdf.addPage();
      currentY = 20;
    }
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Actions & Investigation', 20, currentY);
    currentY += 5;
    
    const actionsData = [];
    if (event.immediate_actions_taken) {
      actionsData.push(['Immediate Actions', event.immediate_actions_taken]);
    }
    actionsData.push(['Investigation Required', event.investigation_required ? 'Yes' : 'No']);
    if (event.investigation_assigned_to) {
      actionsData.push(['Investigation Assigned To', event.investigation_assigned_to]);
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
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 50 } },
      margin: { left: 20, right: 20 }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === RISK ASSESSMENT ===
  if (event.risk_level || event.contributing_factors || event.environmental_factors || event.preventable !== undefined) {
    if (currentY > 240) {
      pdf.addPage();
      currentY = 20;
    }
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Risk Assessment', 20, currentY);
    currentY += 5;
    
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
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 50 } },
      margin: { left: 20, right: 20 }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === COMPLIANCE & NOTIFICATIONS ===
  if (event.family_notified || event.gp_notified || event.insurance_notified || event.external_reporting_required) {
    if (currentY > 240) {
      pdf.addPage();
      currentY = 20;
    }
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Compliance & Notifications', 20, currentY);
    currentY += 5;
    
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
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 50 } },
      margin: { left: 20, right: 20 }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === BODY MAP & ATTACHMENTS ===
  if ((event.body_map_points && Array.isArray(event.body_map_points) && event.body_map_points.length > 0) ||
      (event.attachments && event.attachments.length > 0)) {
    
    if (currentY > 240) {
      pdf.addPage();
      currentY = 20;
    }
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Additional Information', 20, currentY);
    currentY += 5;
    
    const additionalData = [];
    
    if (event.body_map_points && Array.isArray(event.body_map_points) && event.body_map_points.length > 0) {
      additionalData.push(['Body Map Points', `${event.body_map_points.length} point(s) marked`]);
    }
    
    if (event.attachments && event.attachments.length > 0) {
      additionalData.push(['Attachments', `${event.attachments.length} file(s) attached`]);
    }
    
    autoTable(pdf, {
      body: additionalData,
      startY: currentY,
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 50 } },
      margin: { left: 20, right: 20 }
    });
  }

  const pdfFilename = filename || `event-${event.id}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  pdf.save(pdfFilename);
};

export const exportEventToPDFBlob = (event: ExportableEvent): Blob => {
  const pdf = new jsPDF();
  let currentY = 20;
  
  // Header
  pdf.setFontSize(20);
  pdf.text('Event Log Report', 20, currentY);
  currentY += 10;
  
  pdf.setFontSize(12);
  pdf.text(`Generated: ${format(new Date(), 'PPP')}`, 20, currentY);
  currentY += 15;
  
  // === BASIC EVENT DETAILS ===
  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  pdf.text('Event Information', 20, currentY);
  currentY += 5;
  
  const basicEventData = [
    ['Title', event.title || ''],
    ['Client', event.client_name || ''],
    ['Event Type', event.event_type || ''],
    ['Category', event.category || ''],
    ['Severity', event.severity || ''],
    ['Status', event.status || ''],
    ['Reporter', event.reporter || ''],
    ['Location', event.location || 'Not specified'],
    ['Event Date', event.event_date || ''],
    ['Event Time', event.event_time || ''],
    ['Recorded Date', format(new Date(event.created_at), 'PPP')],
    ['Recorded By', event.recorded_by_staff_name || ''],
    ['Last Updated', event.updated_at ? format(new Date(event.updated_at), 'PPP p') : 'N/A']
  ];

  autoTable(pdf, {
    head: [['Field', 'Value']],
    body: basicEventData,
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 50 } },
    margin: { left: 20, right: 20 }
  });

  currentY = (pdf as any).lastAutoTable.finalY + 10;
  
  // === DESCRIPTION ===
  if (event.description) {
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Description', 20, currentY);
    currentY += 5;
    
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    const splitDescription = pdf.splitTextToSize(event.description, 170);
    pdf.text(splitDescription, 20, currentY);
    currentY += (splitDescription.length * 5) + 10;
  }
  
  // === STAFF INFORMATION ===
  if ((event.staff_present && event.staff_present.length > 0) || 
      (event.staff_aware && event.staff_aware.length > 0) || 
      (event.other_people_present && event.other_people_present.length > 0)) {
    
    // Check if we need a new page
    if (currentY > 240) {
      pdf.addPage();
      currentY = 20;
    }
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Staff & People Information', 20, currentY);
    currentY += 5;
    
    const staffData = [];
    if (event.staff_present && event.staff_present.length > 0) {
      staffData.push(['Staff Present', event.staff_present.join(', ')]);
    }
    if (event.staff_aware && event.staff_aware.length > 0) {
      staffData.push(['Staff Aware', event.staff_aware.join(', ')]);
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
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 50 } },
      margin: { left: 20, right: 20 }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === FOLLOW-UP INFORMATION ===
  if (event.action_required || event.follow_up_date || event.follow_up_assigned_to || event.follow_up_notes) {
    if (currentY > 240) {
      pdf.addPage();
      currentY = 20;
    }
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Follow-Up Details', 20, currentY);
    currentY += 5;
    
    const followUpData = [
      ['Action Required', event.action_required ? 'Yes' : 'No'],
      ['Follow-up Date', event.follow_up_date || 'Not set'],
      ['Assigned To', event.follow_up_assigned_to || 'Not assigned'],
      ['Follow-up Notes', event.follow_up_notes || 'No notes']
    ];
    
    autoTable(pdf, {
      body: followUpData,
      startY: currentY,
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 50 } },
      margin: { left: 20, right: 20 }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === ACTIONS TAKEN ===
  if (event.immediate_actions_taken || event.investigation_required || event.lessons_learned) {
    if (currentY > 240) {
      pdf.addPage();
      currentY = 20;
    }
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Actions & Investigation', 20, currentY);
    currentY += 5;
    
    const actionsData = [];
    if (event.immediate_actions_taken) {
      actionsData.push(['Immediate Actions', event.immediate_actions_taken]);
    }
    actionsData.push(['Investigation Required', event.investigation_required ? 'Yes' : 'No']);
    if (event.investigation_assigned_to) {
      actionsData.push(['Investigation Assigned To', event.investigation_assigned_to]);
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
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 50 } },
      margin: { left: 20, right: 20 }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === RISK ASSESSMENT ===
  if (event.risk_level || event.contributing_factors || event.environmental_factors || event.preventable !== undefined) {
    if (currentY > 240) {
      pdf.addPage();
      currentY = 20;
    }
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Risk Assessment', 20, currentY);
    currentY += 5;
    
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
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 50 } },
      margin: { left: 20, right: 20 }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === COMPLIANCE & NOTIFICATIONS ===
  if (event.family_notified || event.gp_notified || event.insurance_notified || event.external_reporting_required) {
    if (currentY > 240) {
      pdf.addPage();
      currentY = 20;
    }
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Compliance & Notifications', 20, currentY);
    currentY += 5;
    
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
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 50 } },
      margin: { left: 20, right: 20 }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // === BODY MAP & ATTACHMENTS ===
  if ((event.body_map_points && Array.isArray(event.body_map_points) && event.body_map_points.length > 0) ||
      (event.attachments && event.attachments.length > 0)) {
    
    if (currentY > 240) {
      pdf.addPage();
      currentY = 20;
    }
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Additional Information', 20, currentY);
    currentY += 5;
    
    const additionalData = [];
    
    if (event.body_map_points && Array.isArray(event.body_map_points) && event.body_map_points.length > 0) {
      additionalData.push(['Body Map Points', `${event.body_map_points.length} point(s) marked`]);
    }
    
    if (event.attachments && event.attachments.length > 0) {
      additionalData.push(['Attachments', `${event.attachments.length} file(s) attached`]);
    }
    
    autoTable(pdf, {
      body: additionalData,
      startY: currentY,
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 50 } },
      margin: { left: 20, right: 20 }
    });
  }
  
  // Return as Blob for sharing
  return pdf.output('blob');
};

export const exportEventsListToPDF = (events: ExportableEvent[], filename: string = 'events-logs') => {
  const pdf = new jsPDF();
  
  // Header
  pdf.setFontSize(20);
  pdf.text('Events & Logs Report', 20, 20);
  
  pdf.setFontSize(12);
  pdf.text(`Generated: ${format(new Date(), 'PPP')}`, 20, 30);
  pdf.text(`Total Events: ${events.length}`, 20, 40);

  // Events table
  const tableData = events.map(event => [
    event.title || '',
    event.client_name || '',
    event.event_type || '',
    event.severity || '',
    event.status || '',
    event.event_date || '',
    format(new Date(event.created_at), 'MM/dd/yy')
  ]);

  autoTable(pdf, {
    head: [['Title', 'Client', 'Type', 'Severity', 'Status', 'Event Date', 'Recorded']],
    body: tableData,
    startY: 50,
    theme: 'grid',
    styles: { fontSize: 8 },
    columnStyles: { 
      0: { cellWidth: 40 },
      1: { cellWidth: 25 },
      2: { cellWidth: 20 },
      3: { cellWidth: 15 },
      4: { cellWidth: 15 },
      5: { cellWidth: 20 },
      6: { cellWidth: 20 }
    }
  });

  pdf.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};