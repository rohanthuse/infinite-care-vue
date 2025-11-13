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
    const doc = new jsPDF('landscape'); // Use landscape for better column width
    
    // Fetch organization settings
    const orgSettings = await fetchOrganizationSettings(branchId);
    
    // Load company logo
    let logoBase64: string | null = null;
    if (orgSettings?.logo_url) {
      logoBase64 = await loadImageAsBase64(orgSettings.logo_url);
    }
    
    const leftMargin = 15;
    
    // Add professional header
    let currentY = await addPDFHeader(doc, orgSettings, logoBase64);
    
    // Add document title
    const subtitle = `Client: ${clientName} | Period: ${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`;
    currentY = addDocumentTitle(doc, 'Service Reports', subtitle, currentY);
    
    // Add export information
    currentY = addSectionHeader(doc, 'Export Information', currentY);
    doc.setFontSize(9);
    doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
    doc.text(`Total Records: ${metadata.totalRecords}`, leftMargin, currentY);
    currentY += 6;
    doc.text(`Exported Records: ${metadata.exportedRecords}`, leftMargin, currentY);
    currentY += 6;
    doc.text(`Export Date: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, leftMargin, currentY);
    currentY += 10;
    
    // Add data table header
    currentY = addSectionHeader(doc, 'Service Report Details', currentY);
    
    // Transform data for table
    const tableData = reports.map((report) => [
      format(new Date(report.service_date), "dd/MM/yyyy"),
      format(new Date(report.submitted_at), "dd/MM/yyyy HH:mm"),
      report.staff ? `${report.staff.first_name || ""} ${report.staff.last_name || ""}`.trim() : "-",
      report.service_duration_minutes ? `${report.service_duration_minutes} mins` : "-",
      report.services_provided?.join(", ") || "-",
      report.client_mood || "-",
      report.client_engagement || "-",
      report.status || "-",
      report.medication_administered ? "✓" : "✗",
      report.incident_occurred ? "✓" : "✗",
      report.activities_undertaken || "-",
      report.carer_observations || "-",
      report.review_notes || "-",
    ]);
    
    // Define columns with specific configuration
    autoTable(doc, {
      head: [[
        'Service Date',
        'Submitted',
        'Carer Name',
        'Duration',
        'Services',
        'Client Mood',
        'Engagement',
        'Status',
        'Medication',
        'Incident',
        'Activities',
        'Observations',
        'Review Notes'
      ]],
      body: tableData,
      startY: currentY,
      theme: 'grid',
      styles: { 
        fontSize: 7,
        cellPadding: 2,
        lineColor: [PDF_COLORS.gray[300].r, PDF_COLORS.gray[300].g, PDF_COLORS.gray[300].b],
        lineWidth: 0.1,
        minCellHeight: 8,
        valign: 'middle',
        overflow: 'linebreak',
      },
      headStyles: { 
        fillColor: [PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 7,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [PDF_COLORS.gray[50].r, PDF_COLORS.gray[50].g, PDF_COLORS.gray[50].b]
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' }, // Service Date
        1: { cellWidth: 28, halign: 'center', fontSize: 6 }, // Submitted
        2: { cellWidth: 25, halign: 'left' }, // Carer Name
        3: { cellWidth: 15, halign: 'center' }, // Duration
        4: { cellWidth: 30, halign: 'left', fontSize: 6 }, // Services
        5: { cellWidth: 18, halign: 'center', fontSize: 6 }, // Client Mood
        6: { cellWidth: 18, halign: 'center', fontSize: 6 }, // Engagement
        7: { cellWidth: 16, halign: 'center', fontSize: 7 }, // Status
        8: { cellWidth: 12, halign: 'center' }, // Medication
        9: { cellWidth: 12, halign: 'center' }, // Incident
        10: { cellWidth: 30, halign: 'left', fontSize: 6 }, // Activities
        11: { cellWidth: 35, halign: 'left', fontSize: 6 }, // Observations
        12: { cellWidth: 25, halign: 'left', fontSize: 6 }, // Review Notes
      },
      didParseCell: function(data) {
        // Style status column with colors
        if (data.column.index === 7 && data.section === 'body') {
          const status = data.cell.text[0]?.toLowerCase();
          if (status === 'approved') {
            data.cell.styles.fillColor = [220, 252, 231]; // green-100
            data.cell.styles.textColor = [21, 128, 61]; // green-700
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'pending') {
            data.cell.styles.fillColor = [254, 249, 195]; // yellow-100
            data.cell.styles.textColor = [161, 98, 7]; // yellow-700
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'rejected') {
            data.cell.styles.fillColor = [254, 226, 226]; // red-100
            data.cell.styles.textColor = [185, 28, 28]; // red-700
            data.cell.styles.fontStyle = 'bold';
          }
        }
        
        // Style Yes/No columns (Medication and Incident)
        if ((data.column.index === 8 || data.column.index === 9) && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          if (data.cell.text[0] === '✓') {
            data.cell.styles.textColor = [21, 128, 61]; // green-700
          } else {
            data.cell.styles.textColor = [107, 114, 128]; // gray-500
          }
        }
      },
      margin: { left: leftMargin, right: leftMargin },
      showHead: 'firstPage',
      rowPageBreak: 'avoid',
    });
    
    // Add professional footers to all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addPDFFooter(doc, orgSettings, i, pageCount);
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
