import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { 
  fetchOrganizationSettings, 
  getLogoForPDF, 
  addPDFHeader, 
  addPDFFooter,
  addDocumentTitle,
  addSectionHeader,
  PDF_COLORS
} from '@/lib/pdfExportHelpers';

export interface HandoverSummaryPdfData {
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
  lastUpdated?: Date;
  priorityAlerts: Array<{ 
    type: string; 
    severity: string; 
    description?: string | null; 
    date: string 
  }>;
  warnings: string[];
  instructions: string[];
  recentVisits: Array<{ 
    carerName: string; 
    date: string; 
    notes?: string | null; 
    summary?: string | null 
  }>;
  moodSummary: Record<string, number>;
  moodReportCount: number;
  clientNotes: Array<{ 
    title: string; 
    content?: string | null; 
    author?: string | null; 
    date: string 
  }>;
}

export async function generateHandoverSummaryPDF(
  data: HandoverSummaryPdfData,
  branchId?: string
): Promise<Blob> {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const leftMargin = 20;
  const rightMargin = pageWidth - 20;
  
  // Fetch organization settings
  const orgSettings = branchId ? await fetchOrganizationSettings(branchId) : null;
  const logoBase64 = await getLogoForPDF(orgSettings);
  
  // Add header
  let yPosition = await addPDFHeader(pdf, orgSettings, logoBase64);
  
  // Add document title
  yPosition = addDocumentTitle(
    pdf,
    'HANDOVER SUMMARY',
    `Generated on ${format(new Date(), 'dd MMMM yyyy, HH:mm')}`,
    yPosition
  );
  
  // Client Details Section
  yPosition = addSectionHeader(pdf, 'Client Details', yPosition, PDF_COLORS.gray[100]);
  yPosition += 2;
  
  pdf.setFontSize(10);
  pdf.setFont("helvetica", 'normal');
  
  const clientDetails = [
    ['Name', data.clientName || 'N/A'],
    ['Phone', data.clientPhone || 'N/A'],
    ['Address', data.clientAddress || 'N/A'],
    ['Last Updated', data.lastUpdated ? format(data.lastUpdated, 'dd MMM yyyy, HH:mm') : 'N/A']
  ];
  
  autoTable(pdf, {
    startY: yPosition,
    head: [],
    body: clientDetails,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' }
    },
    margin: { left: leftMargin, right: 20 }
  });
  
  yPosition = (pdf as any).lastAutoTable.finalY + 10;
  
  // Priority Alerts Section (if any)
  if (data.priorityAlerts.length > 0 || data.warnings.length > 0) {
    yPosition = addSectionHeader(pdf, 'Priority Alerts', yPosition, { r: 254, g: 226, b: 226 }); // Light red
    yPosition += 2;
    
    const alertRows: string[][] = [];
    
    // Add open events
    data.priorityAlerts.forEach(alert => {
      alertRows.push([
        alert.type,
        alert.severity.toUpperCase(),
        alert.description || '-',
        alert.date
      ]);
    });
    
    // Add warnings
    data.warnings.forEach(warning => {
      alertRows.push([
        'Warning',
        'STANDING',
        warning,
        '-'
      ]);
    });
    
    if (alertRows.length > 0) {
      autoTable(pdf, {
        startY: yPosition,
        head: [['Type', 'Severity', 'Description', 'Date']],
        body: alertRows,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 30 }
        },
        margin: { left: leftMargin, right: 20 }
      });
      
      yPosition = (pdf as any).lastAutoTable.finalY + 10;
    }
  }
  
  // Standing Instructions Section (if any)
  if (data.instructions.length > 0) {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = await addPDFHeader(pdf, orgSettings, logoBase64);
    }
    
    yPosition = addSectionHeader(pdf, 'Standing Instructions', yPosition, { r: 219, g: 234, b: 254 }); // Light blue
    yPosition += 2;
    
    const instructionRows = data.instructions.map((instruction, idx) => [
      `${idx + 1}.`,
      instruction
    ]);
    
    autoTable(pdf, {
      startY: yPosition,
      head: [],
      body: instructionRows,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 'auto' }
      },
      margin: { left: leftMargin, right: 20 }
    });
    
    yPosition = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // Recent Visit Notes Section
  if (data.recentVisits.length > 0) {
    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = await addPDFHeader(pdf, orgSettings, logoBase64);
    }
    
    yPosition = addSectionHeader(pdf, 'Recent Visit Notes', yPosition, PDF_COLORS.gray[100]);
    yPosition += 2;
    
    const visitRows = data.recentVisits.map(visit => [
      visit.carerName,
      visit.date,
      visit.notes || visit.summary || 'No notes recorded'
    ]);
    
    autoTable(pdf, {
      startY: yPosition,
      head: [['Carer', 'Date/Time', 'Notes']],
      body: visitRows,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 40 },
        2: { cellWidth: 'auto' }
      },
      margin: { left: leftMargin, right: 20 },
      didDrawPage: () => {
        // Add footer on each page
      }
    });
    
    yPosition = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // Mood & Engagement Section
  if (data.moodReportCount > 0 && Object.keys(data.moodSummary).length > 0) {
    // Check if we need a new page
    if (yPosition > pageHeight - 50) {
      pdf.addPage();
      yPosition = await addPDFHeader(pdf, orgSettings, logoBase64);
    }
    
    yPosition = addSectionHeader(pdf, 'Mood & Engagement Summary', yPosition, { r: 236, g: 253, b: 245 }); // Light green
    yPosition += 2;
    
    const moodRows = Object.entries(data.moodSummary).map(([mood, count]) => [
      mood,
      `${count} visit${count > 1 ? 's' : ''}`
    ]);
    
    autoTable(pdf, {
      startY: yPosition,
      head: [['Mood', 'Frequency']],
      body: moodRows,
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 60 }
      },
      margin: { left: leftMargin, right: 20 }
    });
    
    yPosition = (pdf as any).lastAutoTable.finalY + 5;
    
    pdf.setFontSize(8);
    pdf.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
    pdf.text(`Based on last ${data.moodReportCount} service report${data.moodReportCount > 1 ? 's' : ''}`, leftMargin, yPosition);
    pdf.setTextColor(0, 0, 0);
    
    yPosition += 10;
  }
  
  // Client Notes Section
  if (data.clientNotes.length > 0) {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = await addPDFHeader(pdf, orgSettings, logoBase64);
    }
    
    yPosition = addSectionHeader(pdf, 'Recent Client Notes', yPosition, PDF_COLORS.gray[100]);
    yPosition += 2;
    
    const noteRows = data.clientNotes.map(note => [
      note.title,
      note.content || '-',
      note.author || '-',
      note.date
    ]);
    
    autoTable(pdf, {
      startY: yPosition,
      head: [['Title', 'Content', 'Author', 'Date']],
      body: noteRows,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30 },
        3: { cellWidth: 35 }
      },
      margin: { left: leftMargin, right: 20 }
    });
  }
  
  // Add footer to all pages
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addPDFFooter(pdf, orgSettings, i, totalPages, true);
  }
  
  return pdf.output('blob');
}

export function downloadHandoverSummaryPDF(blob: Blob, clientName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Handover_Summary_${clientName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
