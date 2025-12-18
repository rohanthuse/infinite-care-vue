import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { WeeklyStat } from "@/data/hooks/useBranchChartData";
import { 
  fetchOrganizationSettings, 
  loadImageAsBase64, 
  addPDFHeader, 
  addPDFFooter,
  addSectionHeader,
  addDocumentTitle,
  PDF_COLORS
} from "@/lib/pdfExportHelpers";
export interface ExportOptions {
  title: string;
  data: any[];
  columns: string[];
  fileName?: string;
  branchName?: string;
  branchId?: string;
  dateRange?: { from: Date; to: Date } | null;
  metadata?: {
    filters?: Record<string, any>;
    exportedBy?: string;
    totalRecords?: number;
    exportedRecords?: number;
  };
}

export class ReportExporter {
  static async exportToPDF(options: ExportOptions) {
    const { title, data, columns, fileName, branchName, dateRange, branchId, metadata } = options;
    const doc = new jsPDF();
    
    // Fetch organization settings if branchId provided
    const orgSettings = branchId ? await fetchOrganizationSettings(branchId) : null;
    
    // Load company logo
    let logoBase64: string | null = null;
    if (orgSettings?.logo_url) {
      logoBase64 = await loadImageAsBase64(orgSettings.logo_url);
    }
    
    const pageWidth = doc.internal.pageSize.width;
    const leftMargin = 20;
    
    // Add professional header
    let currentY = await addPDFHeader(doc, orgSettings, logoBase64);
    
    // Add document title
    const subtitle = [
      branchName ? `Branch: ${branchName}` : '',
      dateRange ? `Period: ${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}` : ''
    ].filter(Boolean).join(' | ');
    
    currentY = addDocumentTitle(doc, title, subtitle, currentY);
    
    // Add summary statistics and metadata if available
    if (data.length > 0 || metadata) {
      currentY = addSectionHeader(doc, 'Export Information', currentY);
      
      doc.setFontSize(9);
      doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
      
      // Add metadata information
      if (metadata) {
        if (metadata.exportedBy) {
          doc.text(`Exported By: ${metadata.exportedBy}`, leftMargin, currentY);
          currentY += 6;
        }
        if (metadata.totalRecords !== undefined) {
          doc.text(`Total Available Records: ${metadata.totalRecords}`, leftMargin, currentY);
          currentY += 6;
        }
        if (metadata.exportedRecords !== undefined) {
          doc.text(`Records in Export: ${metadata.exportedRecords}`, leftMargin, currentY);
          currentY += 6;
        }
        if (metadata.filters && Object.keys(metadata.filters).length > 0) {
          doc.text('Active Filters:', leftMargin, currentY);
          currentY += 6;
          Object.entries(metadata.filters).forEach(([key, value]) => {
            if (value && value !== 'all') {
              doc.text(`  • ${key}: ${value}`, leftMargin + 5, currentY);
              currentY += 6;
            }
          });
        }
      } else {
        doc.text(`Total Records: ${data.length}`, leftMargin, currentY);
        currentY += 6;
      }
      
      currentY += 2;
    }
    
    // Add data table with enhanced styling
    currentY = addSectionHeader(doc, 'Report Data', currentY);
    
    autoTable(doc, {
      head: [columns],
      body: data.map(row => columns.map(col => row[col] || '')),
      startY: currentY,
      theme: 'striped',
      styles: { 
        fontSize: 8,
        cellPadding: 3,
        lineColor: [PDF_COLORS.gray[200].r, PDF_COLORS.gray[200].g, PDF_COLORS.gray[200].b],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: [PDF_COLORS.gray[50].r, PDF_COLORS.gray[50].g, PDF_COLORS.gray[50].b]
      },
      margin: { left: leftMargin, right: leftMargin }
    });
    
    // Add professional footers to all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addPDFFooter(doc, orgSettings, i, pageCount);
    }
    
    // Save the PDF
    const finalFileName = fileName || `${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
    doc.save(finalFileName);
  }

  static async exportToPDFBlob(options: ExportOptions): Promise<Blob> {
    const { title, data, columns, branchName, dateRange, branchId } = options;
    const doc = new jsPDF();
    
    // Fetch organization settings if branchId provided
    const orgSettings = branchId ? await fetchOrganizationSettings(branchId) : null;
    
    // Load company logo
    let logoBase64: string | null = null;
    if (orgSettings?.logo_url) {
      logoBase64 = await loadImageAsBase64(orgSettings.logo_url);
    }
    
    const leftMargin = 20;
    
    // Add professional header
    let currentY = await addPDFHeader(doc, orgSettings, logoBase64);
    
    // Add document title
    const subtitle = [
      branchName ? `Branch: ${branchName}` : '',
      dateRange ? `Period: ${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}` : ''
    ].filter(Boolean).join(' | ');
    
    currentY = addDocumentTitle(doc, title, subtitle, currentY);
    
    // Add data table with enhanced styling
    autoTable(doc, {
      head: [columns],
      body: data.map(row => columns.map(col => row[col] || '')),
      startY: currentY,
      theme: 'striped',
      styles: { 
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: { 
        fillColor: [PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [PDF_COLORS.gray[50].r, PDF_COLORS.gray[50].g, PDF_COLORS.gray[50].b]
      },
      margin: { left: leftMargin, right: leftMargin }
    });
    
    // Add professional footers to all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addPDFFooter(doc, orgSettings, i, pageCount);
    }
    
    // Return as Blob instead of saving
    return doc.output('blob');
  }

  static exportToCSV(options: ExportOptions) {
    const { title, data, columns, fileName, metadata } = options;
    
    // Create CSV content with optional metadata header
    const metadataRows: string[] = [];
    if (metadata) {
      metadataRows.push(`Report: ${title}`);
      metadataRows.push(`Exported: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`);
      if (metadata.exportedBy) {
        metadataRows.push(`Exported By: ${metadata.exportedBy}`);
      }
      if (metadata.totalRecords !== undefined) {
        metadataRows.push(`Total Available Records: ${metadata.totalRecords}`);
      }
      if (metadata.exportedRecords !== undefined) {
        metadataRows.push(`Records in Export: ${metadata.exportedRecords}`);
      }
      if (metadata.filters && Object.keys(metadata.filters).length > 0) {
        const activeFilters = Object.entries(metadata.filters)
          .filter(([_, value]) => value && value !== 'all')
          .map(([key, value]) => `${key}: ${value}`)
          .join('; ');
        if (activeFilters) {
          metadataRows.push(`Active Filters: ${activeFilters}`);
        }
      }
      metadataRows.push(''); // Empty row separator
    }
    
    const csvHeaders = columns.join(',');
    const csvRows = data.map(row => 
      columns.map(col => {
        const value = row[col] || '';
        // Escape quotes and wrap in quotes if contains comma
        return typeof value === 'string' && value.includes(',') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    );
    
    const csvContent = [...metadataRows, csvHeaders, ...csvRows].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const finalFileName = fileName || `${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    link.setAttribute('download', finalFileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static exportToExcel(options: ExportOptions) {
    // For now, we'll export as CSV since Excel export requires additional libraries
    // This can be enhanced later with libraries like xlsx
    this.exportToCSV({
      ...options,
      fileName: options.fileName?.replace('.csv', '.xls') || `${options.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.xls`
    });
  }

  static printReport(elementId: string) {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;
    
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .no-print { display: none; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  static async generateServiceReportsPDF(options: {
    reports: any[];
    clientName: string;
    branchId: string;
    branchName?: string;
    dateRange: { from: Date; to: Date };
    fileName: string;
    metadata: {
      totalRecords: number;
      exportedRecords: number;
      exportedBy?: string;
      filters: Record<string, string>;
    };
  }) {
    const { reports, clientName, branchId, branchName, fileName } = options;
    const doc = new jsPDF();
    
    // Fetch organization settings
    const orgSettings = await fetchOrganizationSettings(branchId);
    
    // Load company logo
    let logoBase64: string | null = null;
    if (orgSettings?.logo_url) {
      logoBase64 = await loadImageAsBase64(orgSettings.logo_url);
    }
    
    const leftMargin = 15;
    const rightMargin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    
    // Constants for page management
    const BULK_FOOTER_SPACE = 20;
    const BULK_SAFE_BOTTOM = pageHeight - BULK_FOOTER_SPACE;
    const BULK_HEADER_HEIGHT = 38;
    
    /**
     * Add header for each service report page - Logo on LEFT
     */
    const addReportHeader = (report: any): number => {
      const serviceDate = format(new Date(report.service_date), 'dd MMMM yyyy');
      const carerName = report.staff 
        ? `${report.staff.first_name || ''} ${report.staff.last_name || ''}`.trim() || 'Unknown Carer'
        : 'Unknown Carer';
      
      // Logo on LEFT (as per requirement)
      if (logoBase64) {
        try {
          const getImageFormat = (base64: string): 'PNG' | 'JPEG' | 'GIF' => {
            if (base64.includes('data:image/jpeg') || base64.includes('data:image/jpg')) return 'JPEG';
            if (base64.includes('data:image/gif')) return 'GIF';
            return 'PNG';
          };
          doc.addImage(logoBase64, getImageFormat(logoBase64), leftMargin, 8, 28, 14);
        } catch (e) {
          console.error('Error adding logo:', e);
        }
      }
      
      // Organization & Branch name next to logo
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
      doc.text(orgSettings?.name || 'Healthcare Services', leftMargin + 32, 12);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(PDF_COLORS.gray[600].r, PDF_COLORS.gray[600].g, PDF_COLORS.gray[600].b);
      doc.text(`Branch: ${branchName || 'N/A'}`, leftMargin + 32, 17);
      
      // Document title on right
      const rightX = pageWidth - rightMargin;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
      doc.text('SERVICE REPORT', rightX, 12, { align: 'right' });
      
      // Client name, service date, carer on right
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
      doc.text(`Client: ${clientName}`, rightX, 18, { align: 'right' });
      doc.text(`Service Date: ${serviceDate}`, rightX, 23, { align: 'right' });
      doc.text(`Carer: ${carerName}`, rightX, 28, { align: 'right' });
      
      // Divider line
      doc.setDrawColor(PDF_COLORS.gray[200].r, PDF_COLORS.gray[200].g, PDF_COLORS.gray[200].b);
      doc.setLineWidth(0.5);
      doc.line(leftMargin, 32, pageWidth - rightMargin, 32);
      
      return BULK_HEADER_HEIGHT;
    };
    
    /**
     * Check if page break needed and add header to new page
     */
    const checkPageBreak = (currentY: number, requiredSpace: number, report: any): number => {
      if (currentY + requiredSpace > BULK_SAFE_BOTTOM) {
        doc.addPage();
        return addReportHeader(report);
      }
      return currentY;
    };
    
    // ========== START DIRECTLY WITH SERVICE REPORTS (No cover page) ==========
    let isFirstPage = true;
    
    reports.forEach((report, reportIndex) => {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;
      
      // Add header with this report's specific data
      let currentY = addReportHeader(report);
      
      const serviceDate = format(new Date(report.service_date), 'EEEE, dd MMMM yyyy');
      const carerName = report.staff 
        ? `${report.staff.first_name || ''} ${report.staff.last_name || ''}`.trim() || 'Unknown Carer'
        : 'Unknown Carer';
      
      // ========== VISIT INFORMATION CARD ==========
      // Card-style visit info layout (matching reference image)
      const visitCardHeight = 35;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(PDF_COLORS.gray[200].r, PDF_COLORS.gray[200].g, PDF_COLORS.gray[200].b);
      doc.roundedRect(leftMargin, currentY, contentWidth, visitCardHeight, 3, 3, 'FD');
      
      // Left section - Date and Time
      const leftColX = leftMargin + 5;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
      doc.text(serviceDate, leftColX, currentY + 10);
      
      // Time in/out with icons
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(PDF_COLORS.gray[600].r, PDF_COLORS.gray[600].g, PDF_COLORS.gray[600].b);
      const checkInTime = report.check_in_time || '--:--';
      const checkOutTime = report.check_out_time || '--:--';
      doc.text(`In: ${checkInTime}  |  Out: ${checkOutTime}`, leftColX, currentY + 18);
      
      // Duration
      const duration = report.service_duration_minutes ? `${report.service_duration_minutes} minutes` : '--';
      doc.text(`Duration: ${duration}`, leftColX, currentY + 26);
      
      // Middle section - Carer with status badge
      const midColX = leftMargin + 85;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
      doc.text(carerName, midColX, currentY + 10);
      
      // Status badge
      const status = (report.status || 'pending').toLowerCase();
      let badgeColor = { r: 107, g: 114, b: 128 }; // gray
      if (status === 'approved') badgeColor = { r: 21, g: 128, b: 61 }; // green
      else if (status === 'pending') badgeColor = { r: 161, g: 98, b: 7 }; // amber
      else if (status === 'rejected') badgeColor = { r: 185, g: 28, b: 28 }; // red
      
      doc.setFillColor(badgeColor.r, badgeColor.g, badgeColor.b);
      doc.roundedRect(midColX, currentY + 14, 28, 7, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(status.toUpperCase(), midColX + 2, currentY + 19);
      
      // Client mood/engagement
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(PDF_COLORS.gray[600].r, PDF_COLORS.gray[600].g, PDF_COLORS.gray[600].b);
      if (report.client_mood) {
        doc.text(`Mood: ${report.client_mood}`, midColX, currentY + 30);
      }
      
      // Right section - Visit summary/type
      const rightColX = leftMargin + 135;
      const visitType = report.services_provided?.[0] || 'Care Visit';
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
      doc.text(visitType, rightColX, currentY + 10);
      
      // Brief summary
      if (report.activities_undertaken || report.carer_observations) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(PDF_COLORS.gray[600].r, PDF_COLORS.gray[600].g, PDF_COLORS.gray[600].b);
        const briefSummary = (report.activities_undertaken || report.carer_observations || '').substring(0, 80);
        const summaryLines = doc.splitTextToSize(briefSummary + (briefSummary.length >= 80 ? '...' : ''), 45);
        doc.text(summaryLines, rightColX, currentY + 17);
      }
      
      currentY += visitCardHeight + 8;
      
      // ========== TIMELINE-STYLE MEDICATIONS ==========
      if (report.medications && report.medications.length > 0) {
        currentY = checkPageBreak(currentY, 30, report);
        
        // Section header
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(PDF_COLORS.gray[800].r, PDF_COLORS.gray[800].g, PDF_COLORS.gray[800].b);
        doc.text('Medications', leftMargin, currentY);
        currentY += 6;
        
        report.medications.forEach((med: any) => {
          currentY = checkPageBreak(currentY, 12, report);
          
          // Timeline dot and line
          doc.setFillColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
          doc.circle(leftMargin + 3, currentY + 2, 2, 'F');
          
          // Timestamp
          doc.setFontSize(7);
          doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
          doc.text(med.administration_time || med.prescribed_time || '--:--', leftMargin + 8, currentY + 3);
          
          // Medication badge
          const isAdministered = med.is_administered;
          const medBadgeColor = isAdministered ? { r: 21, g: 128, b: 61 } : { r: 239, g: 68, b: 68 };
          doc.setFillColor(medBadgeColor.r, medBadgeColor.g, medBadgeColor.b);
          doc.roundedRect(leftMargin + 28, currentY - 2, 85, 8, 2, 2, 'F');
          
          doc.setFontSize(7);
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          const medText = `${isAdministered ? '+' : '×'} ${med.medication_name || 'Unknown'} ${med.dosage || ''}`;
          doc.text(medText.substring(0, 40), leftMargin + 30, currentY + 3);
          
          // Status/reason on the right
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(PDF_COLORS.gray[600].r, PDF_COLORS.gray[600].g, PDF_COLORS.gray[600].b);
          if (!isAdministered && med.missed_reason) {
            doc.setTextColor(185, 28, 28);
            doc.text(`• ${med.missed_reason.substring(0, 30)}`, leftMargin + 118, currentY + 3);
          } else if (isAdministered && med.administration_notes) {
            doc.text(`• ${med.administration_notes.substring(0, 30)}`, leftMargin + 118, currentY + 3);
          }
          
          currentY += 10;
        });
        
        currentY += 5;
      }
      
      // ========== TIMELINE-STYLE TASKS ==========
      if (report.tasks && report.tasks.length > 0) {
        currentY = checkPageBreak(currentY, 30, report);
        
        // Section header
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(PDF_COLORS.gray[800].r, PDF_COLORS.gray[800].g, PDF_COLORS.gray[800].b);
        doc.text('Tasks Completed', leftMargin, currentY);
        currentY += 6;
        
        report.tasks.forEach((task: any) => {
          currentY = checkPageBreak(currentY, 12, report);
          
          // Timeline dot
          const isCompleted = task.is_completed;
          const taskDotColor = isCompleted ? { r: 21, g: 128, b: 61 } : { r: 107, g: 114, b: 128 };
          doc.setFillColor(taskDotColor.r, taskDotColor.g, taskDotColor.b);
          doc.circle(leftMargin + 3, currentY + 2, 2, 'F');
          
          // Timestamp
          doc.setFontSize(7);
          doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
          let taskTime = '--:--';
          if (task.completed_at) {
            try {
              taskTime = format(new Date(task.completed_at), 'HH:mm');
            } catch { /* ignore */ }
          }
          doc.text(taskTime, leftMargin + 8, currentY + 3);
          
          // Task badge
          const taskBadgeColor = { r: 59, g: 130, b: 246 }; // blue
          doc.setFillColor(taskBadgeColor.r, taskBadgeColor.g, taskBadgeColor.b);
          doc.roundedRect(leftMargin + 28, currentY - 2, 90, 8, 2, 2, 'F');
          
          doc.setFontSize(7);
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          const checkMark = isCompleted ? '✓' : '○';
          const taskText = `${checkMark} ${task.task_name || 'Task'}`;
          doc.text(taskText.substring(0, 45), leftMargin + 30, currentY + 3);
          
          // Category on the right
          if (task.task_category) {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
            doc.text(`[${task.task_category}]`, leftMargin + 122, currentY + 3);
          }
          
          currentY += 10;
        });
        
        currentY += 5;
      }
      
      // ========== ACTIVITIES & OBSERVATIONS ==========
      currentY = checkPageBreak(currentY, 40, report);
      
      // Section header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.gray[800].r, PDF_COLORS.gray[800].g, PDF_COLORS.gray[800].b);
      doc.text('Service Notes & Observations', leftMargin, currentY);
      currentY += 6;
      
      // Activities box
      doc.setFillColor(249, 250, 251);
      const activitiesText = report.activities_undertaken || 'No activities recorded';
      const activitiesLines = doc.splitTextToSize(activitiesText, contentWidth - 8);
      const activitiesHeight = Math.max(activitiesLines.length * 4 + 8, 15);
      doc.roundedRect(leftMargin, currentY, contentWidth, activitiesHeight, 2, 2, 'F');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
      doc.text(activitiesLines, leftMargin + 4, currentY + 6);
      currentY += activitiesHeight + 5;
      
      // Observations box
      if (report.carer_observations) {
        currentY = checkPageBreak(currentY, 25, report);
        
        doc.setFillColor(239, 246, 255);
        const observationsText = report.carer_observations;
        const observationsLines = doc.splitTextToSize(observationsText, contentWidth - 8);
        const observationsHeight = Math.max(observationsLines.length * 4 + 8, 15);
        doc.roundedRect(leftMargin, currentY, contentWidth, observationsHeight, 2, 2, 'F');
        
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
        doc.text(observationsLines, leftMargin + 4, currentY + 6);
        currentY += observationsHeight + 5;
      }
      
      // ========== INCIDENT ALERT (if applicable) ==========
      if (report.incident_occurred && report.incident_details) {
        currentY = checkPageBreak(currentY, 30, report);
        
        doc.setDrawColor(220, 38, 38);
        doc.setLineWidth(1);
        doc.setFillColor(254, 242, 242);
        const incidentLines = doc.splitTextToSize(report.incident_details, contentWidth - 10);
        const incidentHeight = Math.max(incidentLines.length * 4 + 15, 25);
        doc.roundedRect(leftMargin, currentY, contentWidth, incidentHeight, 2, 2, 'FD');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(185, 28, 28);
        doc.text('⚠ INCIDENT REPORT', leftMargin + 4, currentY + 8);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(incidentLines, leftMargin + 4, currentY + 15);
        currentY += incidentHeight + 5;
      }
      
      // ========== VISUAL SEPARATOR BETWEEN REPORTS ==========
      if (reportIndex < reports.length - 1) {
        currentY += 5;
        doc.setDrawColor(PDF_COLORS.gray[300].r, PDF_COLORS.gray[300].g, PDF_COLORS.gray[300].b);
        doc.setLineWidth(0.5);
        doc.setLineDashPattern([3, 3], 0);
        doc.line(leftMargin + 30, currentY, pageWidth - rightMargin - 30, currentY);
        doc.setLineDashPattern([], 0);
      }
    });
    
    // Add footers to all pages at the end
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addPDFFooter(doc, orgSettings, i, totalPages);
    }
    
    // Save the PDF
    doc.save(fileName);
  }

  static exportChartData(options: {
    title: string;
    weeklyStats: WeeklyStat[];
    fileName?: string;
    branchName?: string;
    format: 'pdf' | 'csv';
  }) {
    const { title, weeklyStats, fileName, branchName, format } = options;
    
    const columns = ['Day', 'Visits', 'Bookings', 'Revenue (£)'];
    const data = weeklyStats.map(stat => ({
      Day: stat.day,
      Visits: stat.visits,
      Bookings: stat.bookings,
      'Revenue (£)': `£${stat.revenue.toFixed(2)}`
    }));

    const exportOptions: ExportOptions = {
      title,
      data,
      columns,
      fileName,
      branchName
    };

    if (format === 'pdf') {
      this.exportToPDF(exportOptions);
    } else {
      this.exportToCSV(exportOptions);
    }
  }
}
