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
    dateRange: { from: Date; to: Date };
    fileName: string;
    metadata: {
      totalRecords: number;
      exportedRecords: number;
      filters: Record<string, string>;
    };
  }) {
    const { reports, clientName, branchId, dateRange, fileName, metadata } = options;
    const doc = new jsPDF(); // Portrait mode for vertical card layout
    
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
    
    // Add cover page
    let currentY = await addPDFHeader(doc, orgSettings, logoBase64);
    currentY = addDocumentTitle(doc, 'Service Reports', 
      `Client: ${clientName} | Period: ${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`, 
      currentY);
    
    // Export information on cover page
    currentY = addSectionHeader(doc, 'Export Summary', currentY);
    doc.setFontSize(9);
    doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
    doc.text(`Total Reports in System: ${metadata.totalRecords}`, leftMargin, currentY);
    currentY += 6;
    doc.text(`Reports in this Export: ${metadata.exportedRecords}`, leftMargin, currentY);
    currentY += 6;
    doc.text(`Export Date: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, leftMargin, currentY);
    currentY += 6;
    doc.text(`Date Range: ${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`, leftMargin, currentY);
    currentY += 15;
    
    // Table of contents
    currentY = addSectionHeader(doc, 'Contents', currentY);
    doc.setFontSize(9);
    reports.forEach((report, index) => {
      const reportDate = format(new Date(report.service_date), 'dd/MM/yyyy');
      const carerName = report.staff ? `${report.staff.first_name || ""} ${report.staff.last_name || ""}`.trim() : "Unknown";
      doc.text(`${index + 1}. Service Report - ${reportDate} (${carerName})`, leftMargin + 5, currentY);
      currentY += 6;
    });
    
    // Add footer to cover page
    addPDFFooter(doc, orgSettings, 1, reports.length + 1);
    
    // Process each report on a new page
    reports.forEach((report, reportIndex) => {
      doc.addPage();
      const pageNum = reportIndex + 2;
      
      currentY = 20;
      
      // Report header section
      doc.setFillColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
      doc.rect(leftMargin, currentY, contentWidth, 15, 'F');
      
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(`Service Report #${report.id?.slice(0, 8) || reportIndex + 1}`, leftMargin + 3, currentY + 6);
      
      doc.setFontSize(10);
      const serviceDate = format(new Date(report.service_date), 'EEEE, dd MMMM yyyy');
      doc.text(serviceDate, leftMargin + 3, currentY + 11);
      
      // Status badge
      const status = (report.status || 'pending').toLowerCase();
      let statusColor = PDF_COLORS.gray[500];
      if (status === 'approved') statusColor = { r: 21, g: 128, b: 61 };
      else if (status === 'pending') statusColor = { r: 161, g: 98, b: 7 };
      else if (status === 'rejected') statusColor = { r: 185, g: 28, b: 28 };
      
      doc.setFillColor(statusColor.r, statusColor.g, statusColor.b);
      doc.roundedRect(pageWidth - rightMargin - 30, currentY + 3, 25, 8, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(status.charAt(0).toUpperCase() + status.slice(1), pageWidth - rightMargin - 27, currentY + 8.5);
      
      currentY += 20;
      
      // Service Details Section (2-column layout)
      currentY = addSectionHeader(doc, 'Service Details', currentY);
      
      const colWidth = contentWidth / 2;
      const labelColor = PDF_COLORS.gray[600];
      const valueColor = PDF_COLORS.gray[900];
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(labelColor.r, labelColor.g, labelColor.b);
      
      // Left column
      let leftY = currentY;
      const rowHeight = 6;
      
      // Carer Name
      doc.text('Carer Name:', leftMargin + 2, leftY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(valueColor.r, valueColor.g, valueColor.b);
      const carerName = report.staff 
        ? `${report.staff.first_name || ''} ${report.staff.last_name || ''}`.trim() || 'Unknown Carer'
        : 'Unknown Carer';
      doc.text(carerName, leftMargin + 30, leftY);
      leftY += rowHeight;
      
      // Duration
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(labelColor.r, labelColor.g, labelColor.b);
      doc.text('Duration:', leftMargin + 2, leftY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(valueColor.r, valueColor.g, valueColor.b);
      doc.text(report.service_duration_minutes ? `${report.service_duration_minutes} minutes` : "-", leftMargin + 30, leftY);
      leftY += rowHeight;
      
      // Client Mood
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(labelColor.r, labelColor.g, labelColor.b);
      doc.text('Client Mood:', leftMargin + 2, leftY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(valueColor.r, valueColor.g, valueColor.b);
      doc.text(report.client_mood || "-", leftMargin + 30, leftY);
      leftY += rowHeight;
      
      // Client Engagement
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(labelColor.r, labelColor.g, labelColor.b);
      doc.text('Client Engagement:', leftMargin + 2, leftY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(valueColor.r, valueColor.g, valueColor.b);
      doc.text(report.client_engagement || "-", leftMargin + 30, leftY);
      leftY += rowHeight;
      
      // Right column
      let rightY = currentY;
      const rightColX = leftMargin + colWidth + 5;
      
      // Services Provided
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(labelColor.r, labelColor.g, labelColor.b);
      doc.text('Services Provided:', rightColX, rightY);
      rightY += rowHeight - 1;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(valueColor.r, valueColor.g, valueColor.b);
      doc.setFontSize(7);
      const services = report.services_provided || [];
      if (services.length > 0) {
        services.forEach((service: string) => {
          doc.text(`• ${service}`, rightColX + 2, rightY);
          rightY += 4;
        });
      } else {
        doc.text('-', rightColX + 2, rightY);
        rightY += 4;
      }
      doc.setFontSize(8);
      
      // Medication Administered
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(labelColor.r, labelColor.g, labelColor.b);
      doc.text('Medication Administered:', rightColX, rightY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(valueColor.r, valueColor.g, valueColor.b);
      doc.text(report.medication_administered ? 'Yes' : 'No', rightColX + 40, rightY);
      rightY += rowHeight;
      
      // Incident Occurred
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(labelColor.r, labelColor.g, labelColor.b);
      doc.text('Incident Occurred:', rightColX, rightY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(valueColor.r, valueColor.g, valueColor.b);
      doc.text(report.incident_occurred ? 'Yes' : 'No', rightColX + 40, rightY);
      
      currentY = Math.max(leftY, rightY) + 5;
      
      // Tasks Section
      if (report.tasks && report.tasks.length > 0) {
        if (currentY > pageHeight - 50) {
          doc.addPage();
          currentY = 20;
        }
        
        currentY = addSectionHeader(doc, 'Tasks Completed During Visit', currentY);
        
        const taskTableData = report.tasks.map((task: any) => [
          task.task_name || '-',
          task.task_category || '-',
          task.is_completed ? 'Complete' : 'Pending',
          task.completed_at ? (() => {
            try {
              return format(new Date(task.completed_at), 'HH:mm');
            } catch {
              return '-';
            }
          })() : '-',
          task.completion_notes || '-'
        ]);
        
        autoTable(doc, {
          head: [['Task', 'Category', 'Status', 'Completed At', 'Notes']],
          body: taskTableData,
          startY: currentY,
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 2,
            lineWidth: 0.1,
            lineColor: [PDF_COLORS.gray[300].r, PDF_COLORS.gray[300].g, PDF_COLORS.gray[300].b],
          },
          headStyles: {
            fillColor: [PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8,
          },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 25 },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 60 },
          },
          didParseCell: function(data) {
            if (data.column.index === 2 && data.section === 'body') {
              if (data.cell.text[0]?.includes('Complete')) {
                data.cell.styles.textColor = [21, 128, 61];
                data.cell.styles.fontStyle = 'bold';
              } else {
                data.cell.styles.textColor = [107, 114, 128];
              }
            }
          },
          margin: { left: leftMargin, right: rightMargin },
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFontSize(9);
        doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
        doc.setFont('helvetica', 'italic');
        doc.text('No tasks recorded for this visit', leftMargin + 2, currentY);
        currentY += 10;
      }
      
      // Medication Details Section
      if (report.medications && report.medications.length > 0) {
        if (currentY > pageHeight - 50) {
          doc.addPage();
          currentY = 20;
        }
        
        currentY = addSectionHeader(doc, 'Medication Details', currentY);
        
        report.medications.forEach((med: any, medIndex: number) => {
          if (currentY > pageHeight - 40) {
            doc.addPage();
            currentY = 20;
          }
          
          // Medication card background
          const cardHeight = med.is_administered ? 22 : 20;
          doc.setFillColor(249, 250, 251);
          doc.roundedRect(leftMargin, currentY, contentWidth, cardHeight, 2, 2, 'F');
          doc.setDrawColor(229, 231, 235);
          doc.setLineWidth(0.3);
          doc.roundedRect(leftMargin, currentY, contentWidth, cardHeight, 2, 2, 'S');
          
          // Medication name
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
          doc.text(`${med.medication_name || 'Unknown'} - ${med.dosage || 'N/A'}`, leftMargin + 2, currentY + 5);
          
          // Details
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(labelColor.r, labelColor.g, labelColor.b);
          
          let medY = currentY + 11;
          doc.text('Scheduled Time:', leftMargin + 3, medY);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(valueColor.r, valueColor.g, valueColor.b);
          doc.text(med.prescribed_time || '-', leftMargin + 35, medY);
          
          medY += 5;
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(labelColor.r, labelColor.g, labelColor.b);
          doc.text('Administered:', leftMargin + 3, medY);
          doc.setFont('helvetica', 'normal');
          
          if (med.is_administered) {
            doc.setTextColor(21, 128, 61);
            doc.text(`Yes at ${med.administration_time || 'N/A'}`, leftMargin + 35, medY);
            
            if (med.administration_notes) {
              medY += 5;
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(labelColor.r, labelColor.g, labelColor.b);
              doc.text('Notes:', leftMargin + 3, medY);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(valueColor.r, valueColor.g, valueColor.b);
              const notesLines = doc.splitTextToSize(med.administration_notes, contentWidth - 30);
              doc.text(notesLines, leftMargin + 35, medY);
            }
          } else {
            doc.setTextColor(185, 28, 28);
            doc.text('Missed', leftMargin + 35, medY);
            
            if (med.missed_reason) {
              medY += 5;
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(labelColor.r, labelColor.g, labelColor.b);
              doc.text('Reason:', leftMargin + 3, medY);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(185, 28, 28);
              const reasonLines = doc.splitTextToSize(med.missed_reason, contentWidth - 30);
              doc.text(reasonLines, leftMargin + 35, medY);
            }
          }
          
          currentY += cardHeight + 3;
        });
        
        currentY += 5;
      } else {
        doc.setFontSize(9);
        doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
        doc.setFont('helvetica', 'italic');
        doc.text('No medications administered during this visit', leftMargin + 2, currentY);
        currentY += 10;
      }
      
      // Activities & Observations Section
      if (currentY > pageHeight - 40) {
        doc.addPage();
        currentY = 20;
      }
      
      currentY = addSectionHeader(doc, 'Activities & Observations', currentY);
      
      // Activities Undertaken
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(labelColor.r, labelColor.g, labelColor.b);
      doc.text('Activities Undertaken:', leftMargin + 2, currentY);
      currentY += 6;
      
      doc.setFillColor(249, 250, 251);
      const activitiesText = report.activities_undertaken || 'No activities recorded';
      const activitiesLines = doc.splitTextToSize(activitiesText, contentWidth - 6);
      const activitiesHeight = activitiesLines.length * 5 + 4;
      doc.roundedRect(leftMargin, currentY - 3, contentWidth, activitiesHeight, 2, 2, 'FD');
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(valueColor.r, valueColor.g, valueColor.b);
      doc.setFontSize(8);
      doc.text(activitiesLines, leftMargin + 3, currentY);
      currentY += activitiesHeight + 5;
      
      // Carer Observations
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(labelColor.r, labelColor.g, labelColor.b);
      doc.text('Carer Observations:', leftMargin + 2, currentY);
      currentY += 6;
      
      doc.setFillColor(239, 246, 255);
      const observationsText = report.carer_observations || 'No observations recorded';
      const observationsLines = doc.splitTextToSize(observationsText, contentWidth - 6);
      const observationsHeight = observationsLines.length * 5 + 4;
      doc.roundedRect(leftMargin, currentY - 3, contentWidth, observationsHeight, 2, 2, 'FD');
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(valueColor.r, valueColor.g, valueColor.b);
      doc.setFontSize(8);
      doc.text(observationsLines, leftMargin + 3, currentY);
      currentY += observationsHeight + 5;
      
      // Additional Notes
      if (report.review_notes || report.client_feedback) {
        if (currentY > pageHeight - 25) {
          doc.addPage();
          currentY = 20;
        }
        
        currentY = addSectionHeader(doc, 'Additional Notes', currentY);
        
        if (report.review_notes) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(labelColor.r, labelColor.g, labelColor.b);
          doc.text('Review Notes:', leftMargin + 2, currentY);
          currentY += 5;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(valueColor.r, valueColor.g, valueColor.b);
          const reviewLines = doc.splitTextToSize(report.review_notes, contentWidth - 4);
          doc.text(reviewLines, leftMargin + 2, currentY);
          currentY += reviewLines.length * 4 + 5;
        }
      }
      
      // Incident Details (if applicable)
      if (report.incident_occurred && report.incident_details) {
        if (currentY > pageHeight - 25) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setDrawColor(220, 38, 38);
        doc.setLineWidth(0.5);
        doc.setFillColor(254, 242, 242);
        doc.roundedRect(leftMargin, currentY, contentWidth, 20, 2, 2, 'FD');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(185, 28, 28);
        doc.text('WARNING: Incident Report', leftMargin + 3, currentY + 6);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        currentY += 11;
        const incidentLines = doc.splitTextToSize(report.incident_details, contentWidth - 6);
        doc.text(incidentLines, leftMargin + 3, currentY);
      }
      
      // Add footer to each report page
      addPDFFooter(doc, orgSettings, pageNum, reports.length + 1);
    });
    
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
