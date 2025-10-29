import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportableEvent {
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
  recorded_by_staff_name?: string;
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
  
  // Header
  pdf.setFontSize(20);
  pdf.text('Event Log Report', 20, 20);
  
  pdf.setFontSize(12);
  pdf.text(`Generated: ${format(new Date(), 'PPP')}`, 20, 30);
  
  // Event details
  const eventData = [
    ['Title', event.title || ''],
    ['Client', event.client_name || ''],
    ['Event Type', event.event_type || ''],
    ['Category', event.category || ''],
    ['Severity', event.severity || ''],
    ['Status', event.status || ''],
    ['Reporter', event.reporter || ''],
    ['Location', event.location || ''],
    ['Event Date', event.event_date || ''],
    ['Event Time', event.event_time || ''],
    ['Recorded Date', format(new Date(event.created_at), 'PPP')],
    ['Recorded By', event.recorded_by_staff_name || '']
  ];

  autoTable(pdf, {
    head: [['Field', 'Value']],
    body: eventData,
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
  });

  // Description section
  if (event.description) {
    const finalY = (pdf as any).lastAutoTable?.finalY || 40;
    pdf.setFontSize(14);
    pdf.text('Description:', 20, finalY + 20);
    
    pdf.setFontSize(10);
    const splitDescription = pdf.splitTextToSize(event.description, 170);
    pdf.text(splitDescription, 20, finalY + 30);
  }

  const pdfFilename = filename || `event-${event.id}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  pdf.save(pdfFilename);
};

export const exportEventToPDFBlob = (event: ExportableEvent): Blob => {
  const pdf = new jsPDF();
  
  // Header
  pdf.setFontSize(20);
  pdf.text('Event Log Report', 20, 20);
  
  pdf.setFontSize(12);
  pdf.text(`Generated: ${format(new Date(), 'PPP')}`, 20, 30);
  
  // Event details
  const eventData = [
    ['Title', event.title || ''],
    ['Client', event.client_name || ''],
    ['Event Type', event.event_type || ''],
    ['Category', event.category || ''],
    ['Severity', event.severity || ''],
    ['Status', event.status || ''],
    ['Reporter', event.reporter || ''],
    ['Location', event.location || ''],
    ['Event Date', event.event_date || ''],
    ['Event Time', event.event_time || ''],
    ['Recorded Date', format(new Date(event.created_at), 'PPP')],
    ['Recorded By', event.recorded_by_staff_name || '']
  ];

  autoTable(pdf, {
    head: [['Field', 'Value']],
    body: eventData,
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
  });

  // Description section
  if (event.description) {
    const finalY = (pdf as any).lastAutoTable?.finalY || 40;
    pdf.setFontSize(14);
    pdf.text('Description:', 20, finalY + 20);
    
    pdf.setFontSize(10);
    const splitDescription = pdf.splitTextToSize(event.description, 170);
    pdf.text(splitDescription, 20, finalY + 30);
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