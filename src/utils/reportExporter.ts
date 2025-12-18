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
    const BULK_HEADER_HEIGHT = 48;
    
    // Section colors for visual hierarchy
    const SECTION_COLORS = {
      visitInfo: { r: 248, g: 250, b: 252 },
      visitSummary: { r: 254, g: 252, b: 232 },
      tasks: { r: 240, g: 253, b: 244 },
      medications: { r: 245, g: 243, b: 255 },
      news2: { r: 254, g: 242, b: 242 },
      events: { r: 254, g: 226, b: 226 },
      goals: { r: 236, g: 253, b: 245 },
      activities: { r: 255, g: 247, b: 237 },
      notes: { r: 239, g: 246, b: 255 }
    };
    
    /**
     * Add colored section header
     */
    const addBulkSectionHeader = (title: string, currentY: number, bgColor: {r: number, g: number, b: number}): number => {
      doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
      doc.roundedRect(leftMargin, currentY, contentWidth, 8, 1, 1, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text(title, leftMargin + 4, currentY + 5.5);
      
      return currentY + 10;
    };
    
    /**
     * Add header for each service report page - Logo on LEFT with report indicator
     */
    const addReportHeader = (report: any, reportIndex: number, totalReports: number): number => {
      const serviceDate = format(new Date(report.service_date), 'dd MMMM yyyy');
      const carerName = report.staff 
        ? `${report.staff.first_name || ''} ${report.staff.last_name || ''}`.trim() || 'Unknown Carer'
        : 'Unknown Carer';
      
      // Blue top strip
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 5, 'F');
      
      // Logo on LEFT (larger, more visible)
      if (logoBase64) {
        try {
          const getImageFormat = (base64: string): 'PNG' | 'JPEG' | 'GIF' => {
            if (base64.includes('data:image/jpeg') || base64.includes('data:image/jpg')) return 'JPEG';
            if (base64.includes('data:image/gif')) return 'GIF';
            return 'PNG';
          };
          doc.addImage(logoBase64, getImageFormat(logoBase64), leftMargin, 8, 40, 22);
        } catch (e) {
          console.error('Error adding logo:', e);
        }
      }
      
      // Organization & Branch name next to logo
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
      doc.text(orgSettings?.name || 'Healthcare Services', leftMargin + 45, 14);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(PDF_COLORS.gray[600].r, PDF_COLORS.gray[600].g, PDF_COLORS.gray[600].b);
      doc.text(`Branch: ${branchName || 'N/A'}`, leftMargin + 45, 20);
      
      // Document title on right
      const rightX = pageWidth - rightMargin;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
      doc.text('SERVICE REPORT', rightX, 14, { align: 'right' });
      
      // Client name, service date, carer on right
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
      doc.text(`Client: ${clientName}`, rightX, 20, { align: 'right' });
      doc.text(`Service Date: ${serviceDate}`, rightX, 26, { align: 'right' });
      doc.text(`Carer: ${carerName}`, rightX, 32, { align: 'right' });
      
      // Report indicator (e.g., "Report 3 of 12")
      doc.setFontSize(7);
      doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
      doc.text(`Report ${reportIndex + 1} of ${totalReports}`, rightX, 38, { align: 'right' });
      
      // Divider line
      doc.setDrawColor(PDF_COLORS.gray[200].r, PDF_COLORS.gray[200].g, PDF_COLORS.gray[200].b);
      doc.setLineWidth(0.5);
      doc.line(leftMargin, 42, pageWidth - rightMargin, 42);
      
      return BULK_HEADER_HEIGHT;
    };
    
    /**
     * Check if page break needed and add header to new page
     */
    const checkPageBreak = (currentY: number, requiredSpace: number, report: any, reportIndex: number): number => {
      if (currentY + requiredSpace > BULK_SAFE_BOTTOM) {
        doc.addPage();
        return addReportHeader(report, reportIndex, reports.length);
      }
      return currentY;
    };
    
    // ========== START DIRECTLY WITH SERVICE REPORTS (No cover page) ==========
    
    reports.forEach((report, reportIndex) => {
      // Each report starts on a new page (except the first)
      if (reportIndex > 0) {
        doc.addPage();
      }
      
      // Add header with this report's specific data and indicator
      let currentY = addReportHeader(report, reportIndex, reports.length);
      
      const serviceDate = format(new Date(report.service_date), 'EEEE, dd MMMM yyyy');
      const carerName = report.staff 
        ? `${report.staff.first_name || ''} ${report.staff.last_name || ''}`.trim() || 'Unknown Carer'
        : 'Unknown Carer';
      const checkInTime = report.check_in_time || '--:--';
      const checkOutTime = report.check_out_time || '--:--';
      const duration = report.service_duration_minutes ? `${report.service_duration_minutes} min` : '--';
      const status = (report.status || 'pending').toLowerCase();
      
      // ========== 1. VISIT INFORMATION SECTION (Two-Column Card) ==========
      currentY = addBulkSectionHeader('VISIT INFORMATION', currentY, SECTION_COLORS.visitInfo);
      
      // Two-column layout box
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(PDF_COLORS.gray[200].r, PDF_COLORS.gray[200].g, PDF_COLORS.gray[200].b);
      doc.roundedRect(leftMargin, currentY, contentWidth, 28, 2, 2, 'FD');
      
      // Left column
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
      doc.text('Client:', leftMargin + 4, currentY + 7);
      doc.setFont('helvetica', 'normal');
      doc.text(clientName, leftMargin + 28, currentY + 7);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Service Date:', leftMargin + 4, currentY + 14);
      doc.setFont('helvetica', 'normal');
      doc.text(serviceDate, leftMargin + 28, currentY + 14);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Time:', leftMargin + 4, currentY + 21);
      doc.setFont('helvetica', 'normal');
      doc.text(`${checkInTime} - ${checkOutTime} (${duration})`, leftMargin + 28, currentY + 21);
      
      // Right column
      const rightCol = pageWidth / 2 + 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Carer:', rightCol, currentY + 7);
      doc.setFont('helvetica', 'normal');
      doc.text(carerName, rightCol + 20, currentY + 7);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Status:', rightCol, currentY + 14);
      // Status badge
      let badgeColor = { r: 107, g: 114, b: 128 };
      if (status === 'approved') badgeColor = { r: 21, g: 128, b: 61 };
      else if (status === 'pending') badgeColor = { r: 161, g: 98, b: 7 };
      else if (status === 'rejected') badgeColor = { r: 185, g: 28, b: 28 };
      
      doc.setFillColor(badgeColor.r, badgeColor.g, badgeColor.b);
      doc.roundedRect(rightCol + 20, currentY + 10, 24, 6, 2, 2, 'F');
      doc.setFontSize(6);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(status.toUpperCase(), rightCol + 22, currentY + 14);
      
      doc.setFontSize(8);
      doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
      doc.setFont('helvetica', 'bold');
      doc.text('Location:', rightCol, currentY + 21);
      doc.setFont('helvetica', 'normal');
      doc.text(report.location || 'Not specified', rightCol + 20, currentY + 21);
      
      currentY += 33;
      
      // ========== 2. VISIT SUMMARY SECTION ==========
      if (report.activities_undertaken || report.visit_summary) {
        currentY = checkPageBreak(currentY, 30, report, reportIndex);
        currentY = addBulkSectionHeader('VISIT SUMMARY', currentY, SECTION_COLORS.visitSummary);
        
        doc.setFillColor(254, 252, 232);
        const summaryText = report.visit_summary || report.activities_undertaken || 'No summary';
        const summaryLines = doc.splitTextToSize(summaryText, contentWidth - 8);
        const summaryHeight = Math.max(summaryLines.length * 4 + 8, 15);
        doc.roundedRect(leftMargin, currentY, contentWidth, summaryHeight, 2, 2, 'F');
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
        doc.text(summaryLines, leftMargin + 4, currentY + 6);
        currentY += summaryHeight + 5;
      }
      
      // ========== 3. TASK DETAILS SECTION (autoTable Format) ==========
      if (report.tasks && report.tasks.length > 0) {
        currentY = checkPageBreak(currentY, 40, report, reportIndex);
        currentY = addBulkSectionHeader('TASK DETAILS', currentY, SECTION_COLORS.tasks);
        
        const taskTableData = report.tasks.map((task: any) => {
          let taskTime = '-';
          if (task.completed_at) {
            try {
              taskTime = format(new Date(task.completed_at), 'HH:mm');
            } catch { /* ignore */ }
          }
          return [
            task.task_name || 'Task',
            task.task_category || '-',
            task.is_completed ? '✓ Completed' : '○ Pending',
            taskTime,
            (task.completion_notes || '-').substring(0, 40)
          ];
        });
        
        autoTable(doc, {
          startY: currentY,
          head: [['Task', 'Category', 'Status', 'Time', 'Notes']],
          body: taskTableData,
          theme: 'grid',
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 30 },
            2: { cellWidth: 25 },
            3: { cellWidth: 18 },
            4: { cellWidth: 'auto' }
          },
          margin: { left: leftMargin, right: rightMargin },
          didDrawPage: () => {
            const pageNum = doc.getNumberOfPages();
            if (pageNum > 1) {
              addReportHeader(report, reportIndex, reports.length);
            }
          }
        });
        currentY = (doc as any).lastAutoTable.finalY + 5;
      }
      
      // ========== 4. MEDICATION DETAILS SECTION (autoTable Format) ==========
      if (report.medications && report.medications.length > 0) {
        currentY = checkPageBreak(currentY, 40, report, reportIndex);
        currentY = addBulkSectionHeader('MEDICATION DETAILS', currentY, SECTION_COLORS.medications);
        
        const medTableData = report.medications.map((med: any) => {
          const statusText = med.is_administered 
            ? '✓ Administered' 
            : `✗ ${med.missed_reason || 'Missed'}`;
          return [
            med.medication_name || 'Unknown',
            med.dosage || '-',
            med.administration_time || med.prescribed_time || '-',
            statusText,
            (med.administration_notes || '-').substring(0, 30)
          ];
        });
        
        autoTable(doc, {
          startY: currentY,
          head: [['Medication', 'Dosage', 'Time', 'Status', 'Notes']],
          body: medTableData,
          theme: 'grid',
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 45 },
            1: { cellWidth: 25 },
            2: { cellWidth: 18 },
            3: { cellWidth: 30 },
            4: { cellWidth: 'auto' }
          },
          margin: { left: leftMargin, right: rightMargin },
          didDrawPage: () => {
            const pageNum = doc.getNumberOfPages();
            if (pageNum > 1) {
              addReportHeader(report, reportIndex, reports.length);
            }
          }
        });
        currentY = (doc as any).lastAutoTable.finalY + 5;
      }
      
      // ========== 5. NEWS2 & VITAL SIGNS SECTION ==========
      if (report.news2_readings?.length > 0 || report.vital_signs) {
        currentY = checkPageBreak(currentY, 55, report, reportIndex);
        currentY = addBulkSectionHeader('NEWS2 & VITAL SIGNS', currentY, SECTION_COLORS.news2);
        
        const news2 = report.news2_readings?.[0] || report.vital_signs;
        
        if (news2) {
          // NEWS2 Score display box
          doc.setFillColor(254, 226, 226);
          doc.roundedRect(leftMargin, currentY, 45, 25, 2, 2, 'F');
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(185, 28, 28);
          doc.text('NEWS2 Score', leftMargin + 5, currentY + 8);
          
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          const totalScore = news2.total_score || news2.news2_score || 0;
          doc.text(String(totalScore), leftMargin + 18, currentY + 20);
          
          // Vital signs grid (3x2 layout)
          const vitals = [
            { label: 'Resp Rate', value: news2.respiration_rate || '-', unit: '/min' },
            { label: 'SpO2', value: news2.spo2 || '-', unit: '%' },
            { label: 'Temperature', value: news2.temperature || '-', unit: '°C' },
            { label: 'Blood Pressure', value: news2.systolic_bp && news2.diastolic_bp ? `${news2.systolic_bp}/${news2.diastolic_bp}` : '-', unit: 'mmHg' },
            { label: 'Pulse', value: news2.pulse || news2.heart_rate || '-', unit: 'bpm' },
            { label: 'Consciousness', value: news2.consciousness || news2.avpu || '-', unit: '' }
          ];
          
          const vitalStartX = leftMargin + 52;
          const vitalWidth = (contentWidth - 52) / 3;
          
          vitals.forEach((vital, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const x = vitalStartX + (col * vitalWidth);
            const y = currentY + (row * 13);
            
            doc.setFillColor(249, 250, 251);
            doc.roundedRect(x, y, vitalWidth - 3, 12, 1, 1, 'F');
            
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
            doc.text(vital.label, x + 2, y + 4);
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
            doc.text(`${vital.value} ${vital.unit}`, x + 2, y + 10);
          });
          
          currentY += 32;
        }
      }
      
      // ========== 6. EVENTS & INCIDENTS SECTION ==========
      if (report.incident_occurred || report.events?.length > 0) {
        currentY = checkPageBreak(currentY, 35, report, reportIndex);
        currentY = addBulkSectionHeader('EVENTS & INCIDENTS', currentY, SECTION_COLORS.events);
        
        if (report.incident_occurred) {
          doc.setFillColor(254, 226, 226);
          doc.setDrawColor(220, 38, 38);
          doc.setLineWidth(0.5);
          const incidentText = report.incident_details || 'Incident occurred - no details provided';
          const incidentLines = doc.splitTextToSize(incidentText, contentWidth - 10);
          const incidentHeight = Math.max(incidentLines.length * 4 + 12, 20);
          doc.roundedRect(leftMargin, currentY, contentWidth, incidentHeight, 2, 2, 'FD');
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(185, 28, 28);
          doc.text('⚠ INCIDENT REPORTED', leftMargin + 4, currentY + 7);
          
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(55, 65, 81);
          doc.text(incidentLines, leftMargin + 4, currentY + 14);
          currentY += incidentHeight + 5;
        }
        
        if (report.events?.length > 0) {
          report.events.forEach((event: any) => {
            currentY = checkPageBreak(currentY, 15, report, reportIndex);
            doc.setFillColor(255, 251, 235);
            doc.roundedRect(leftMargin, currentY, contentWidth, 12, 1, 1, 'F');
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
            doc.text(event.event_type || 'Event', leftMargin + 4, currentY + 5);
            
            doc.setFont('helvetica', 'normal');
            doc.text(event.description?.substring(0, 80) || '-', leftMargin + 4, currentY + 10);
            currentY += 14;
          });
        }
      }
      
      // ========== 7. CARE PLAN GOALS SECTION (Two-Column Layout) ==========
      if (report.care_plan_goals?.length > 0) {
        currentY = checkPageBreak(currentY, 40, report, reportIndex);
        currentY = addBulkSectionHeader('CARE PLAN GOALS', currentY, SECTION_COLORS.goals);
        
        const halfWidth = (contentWidth - 5) / 2;
        const leftGoals = report.care_plan_goals.filter((_: any, i: number) => i % 2 === 0);
        const rightGoals = report.care_plan_goals.filter((_: any, i: number) => i % 2 === 1);
        
        let maxY = currentY;
        
        // Left column goals
        let leftY = currentY;
        leftGoals.forEach((goal: any) => {
          doc.setFillColor(236, 253, 245);
          doc.roundedRect(leftMargin, leftY, halfWidth, 14, 1, 1, 'F');
          
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(PDF_COLORS.gray[800].r, PDF_COLORS.gray[800].g, PDF_COLORS.gray[800].b);
          doc.text(`• ${(goal.goal_name || goal.description || 'Goal').substring(0, 40)}`, leftMargin + 2, leftY + 5);
          
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(PDF_COLORS.gray[600].r, PDF_COLORS.gray[600].g, PDF_COLORS.gray[600].b);
          doc.text(`Progress: ${goal.progress || 'N/A'}`, leftMargin + 2, leftY + 11);
          leftY += 16;
        });
        maxY = Math.max(maxY, leftY);
        
        // Right column goals
        let rightY = currentY;
        rightGoals.forEach((goal: any) => {
          doc.setFillColor(236, 253, 245);
          doc.roundedRect(leftMargin + halfWidth + 5, rightY, halfWidth, 14, 1, 1, 'F');
          
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(PDF_COLORS.gray[800].r, PDF_COLORS.gray[800].g, PDF_COLORS.gray[800].b);
          doc.text(`• ${(goal.goal_name || goal.description || 'Goal').substring(0, 40)}`, leftMargin + halfWidth + 7, rightY + 5);
          
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(PDF_COLORS.gray[600].r, PDF_COLORS.gray[600].g, PDF_COLORS.gray[600].b);
          doc.text(`Progress: ${goal.progress || 'N/A'}`, leftMargin + halfWidth + 7, rightY + 11);
          rightY += 16;
        });
        maxY = Math.max(maxY, rightY);
        
        currentY = maxY + 5;
      }
      
      // ========== 8. ACTIVITIES PERFORMED SECTION (Two-Column Layout) ==========
      if (report.activities?.length > 0 || report.activities_list?.length > 0) {
        currentY = checkPageBreak(currentY, 35, report, reportIndex);
        currentY = addBulkSectionHeader('ACTIVITIES PERFORMED', currentY, SECTION_COLORS.activities);
        
        const activities = report.activities || report.activities_list || [];
        const halfWidth = (contentWidth - 5) / 2;
        const leftActivities = activities.filter((_: any, i: number) => i % 2 === 0);
        const rightActivities = activities.filter((_: any, i: number) => i % 2 === 1);
        
        let maxY = currentY;
        
        // Left column activities
        let leftY = currentY;
        leftActivities.forEach((activity: any) => {
          doc.setFillColor(255, 247, 237);
          doc.roundedRect(leftMargin, leftY, halfWidth, 10, 1, 1, 'F');
          
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
          const activityName = typeof activity === 'string' ? activity : (activity.name || activity.activity_name || 'Activity');
          doc.text(`• ${activityName.substring(0, 45)}`, leftMargin + 2, leftY + 6);
          leftY += 12;
        });
        maxY = Math.max(maxY, leftY);
        
        // Right column activities
        let rightY = currentY;
        rightActivities.forEach((activity: any) => {
          doc.setFillColor(255, 247, 237);
          doc.roundedRect(leftMargin + halfWidth + 5, rightY, halfWidth, 10, 1, 1, 'F');
          
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
          const activityName = typeof activity === 'string' ? activity : (activity.name || activity.activity_name || 'Activity');
          doc.text(`• ${activityName.substring(0, 45)}`, leftMargin + halfWidth + 7, rightY + 6);
          rightY += 12;
        });
        maxY = Math.max(maxY, rightY);
        
        currentY = maxY + 5;
      }
      
      // ========== 9. SERVICE NOTES & OBSERVATIONS SECTION ==========
      currentY = checkPageBreak(currentY, 40, report, reportIndex);
      currentY = addBulkSectionHeader('SERVICE NOTES & OBSERVATIONS', currentY, SECTION_COLORS.notes);
      
      // Notes text box
      doc.setFillColor(239, 246, 255);
      const notesText = report.carer_observations || report.notes || 'No additional notes recorded';
      const notesLines = doc.splitTextToSize(notesText, contentWidth - 8);
      const notesHeight = Math.max(notesLines.length * 4 + 8, 15);
      doc.roundedRect(leftMargin, currentY, contentWidth, notesHeight, 2, 2, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
      doc.text(notesLines, leftMargin + 4, currentY + 6);
      currentY += notesHeight + 5;
      
      // Client mood/engagement if available
      if (report.client_mood || report.client_engagement) {
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(leftMargin, currentY, contentWidth, 10, 1, 1, 'F');
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(PDF_COLORS.gray[600].r, PDF_COLORS.gray[600].g, PDF_COLORS.gray[600].b);
        const moodText = [
          report.client_mood ? `Mood: ${report.client_mood}` : '',
          report.client_engagement ? `Engagement: ${report.client_engagement}` : ''
        ].filter(Boolean).join(' | ');
        doc.text(moodText, leftMargin + 4, currentY + 6);
        currentY += 12;
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
