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

  /**
   * Export Organisation Calendar to professional PDF
   * - Header repeats on every page (full on page 1, compact on pages 2+)
   * - Separate columns: Date, Start, End, Client, Carer, Type, Status
   * - Reduced row heights for better density
   * - Proper pagination with no overlap
   */
  static async exportCalendarToPDF(options: ExportOptions) {
    const { title, data, columns, fileName, branchName, dateRange, branchId, metadata } = options;
    const doc = new jsPDF();
    
    // Fetch organization settings
    const orgSettings = branchId ? await fetchOrganizationSettings(branchId) : null;
    
    // Load company logo
    let logoBase64: string | null = null;
    if (orgSettings?.logo_url) {
      logoBase64 = await loadImageAsBase64(orgSettings.logo_url);
    }
    
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 12;
    const FOOTER_HEIGHT = 15;
    const HEADER_HEIGHT_FIRST = 58;
    const HEADER_HEIGHT_OTHER = 32;
    
    const getImageFormat = (base64: string): 'PNG' | 'JPEG' | 'GIF' => {
      if (base64.includes('data:image/jpeg') || base64.includes('data:image/jpg')) return 'JPEG';
      if (base64.includes('data:image/gif')) return 'GIF';
      return 'PNG';
    };
    
    /**
     * Add full header (page 1)
     */
    const addFullHeader = (): number => {
      // Blue top bar
      doc.setFillColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
      doc.rect(0, 0, pageWidth, 4, 'F');
      
      let currentY = 10;
      
      // Logo on left (smaller)
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, getImageFormat(logoBase64), margin, currentY, 28, 16);
        } catch (e) {
          console.error('Error adding logo:', e);
        }
      }
      
      // Organization details on right
      const rightX = pageWidth - margin;
      doc.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(orgSettings?.name || 'Organisation', rightX, currentY + 3, { align: 'right' });
      
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(PDF_COLORS.gray[600].r, PDF_COLORS.gray[600].g, PDF_COLORS.gray[600].b);
      
      let detailY = currentY + 7;
      if (branchName) {
        doc.text(`Branch: ${branchName}`, rightX, detailY, { align: 'right' });
        detailY += 3;
      }
      if (orgSettings?.telephone) {
        doc.text(`Tel: ${orgSettings.telephone}`, rightX, detailY, { align: 'right' });
        detailY += 3;
      }
      if (orgSettings?.email) {
        doc.text(`Email: ${orgSettings.email}`, rightX, detailY, { align: 'right' });
        detailY += 3;
      }
      if (orgSettings?.website) {
        doc.text(`Web: ${orgSettings.website}`, rightX, detailY, { align: 'right' });
        detailY += 3;
      }
      doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, rightX, detailY, { align: 'right' });
      
      // Centered title
      currentY = 32;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
      doc.text(title || 'Organisation Calendar Report', pageWidth / 2, currentY, { align: 'center' });
      
      // Date range + event count
      if (dateRange) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
        const periodText = `Period: ${format(dateRange.from, 'dd MMM yyyy')} - ${format(dateRange.to, 'dd MMM yyyy')}`;
        const eventsText = metadata?.exportedRecords ? ` | ${metadata.exportedRecords} events` : '';
        doc.text(periodText + eventsText, pageWidth / 2, currentY + 5, { align: 'center' });
      }
      
      // Separator line
      currentY = 42;
      doc.setDrawColor(PDF_COLORS.gray[200].r, PDF_COLORS.gray[200].g, PDF_COLORS.gray[200].b);
      doc.setLineWidth(0.3);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      
      return 46;
    };
    
    /**
     * Add compact header (pages 2+)
     */
    const addCompactHeader = () => {
      // Blue top bar
      doc.setFillColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
      doc.rect(0, 0, pageWidth, 3, 'F');
      
      let currentY = 8;
      
      // Logo (small)
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, getImageFormat(logoBase64), margin, currentY, 18, 10);
        } catch (e) {}
      }
      
      // Title and period on right
      const rightX = pageWidth - margin;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
      doc.text('Organisation Calendar Report', rightX, currentY + 3, { align: 'right' });
      
      if (dateRange) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
        doc.text(
          `${format(dateRange.from, 'dd MMM yyyy')} - ${format(dateRange.to, 'dd MMM yyyy')}`,
          rightX,
          currentY + 7,
          { align: 'right' }
        );
      }
      
      // Separator line
      currentY = 21;
      doc.setDrawColor(PDF_COLORS.gray[200].r, PDF_COLORS.gray[200].g, PDF_COLORS.gray[200].b);
      doc.setLineWidth(0.2);
      doc.line(margin, currentY, pageWidth - margin, currentY);
    };
    
    /**
     * Add footer
     */
    const addCalendarFooter = (pageNumber: number, totalPages: number) => {
      const footerY = pageHeight - 8;
      
      doc.setDrawColor(PDF_COLORS.gray[200].r, PDF_COLORS.gray[200].g, PDF_COLORS.gray[200].b);
      doc.setLineWidth(0.2);
      doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
      
      doc.setFontSize(6);
      doc.setTextColor(PDF_COLORS.gray[400].r, PDF_COLORS.gray[400].g, PDF_COLORS.gray[400].b);
      doc.setFont('helvetica', 'normal');
      
      doc.text('Confidential', margin, footerY);
      doc.text(`© ${orgSettings?.name || 'Organisation'}`, pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
    };
    
    // Add first page header
    addFullHeader();
    
    // Column widths optimized for 5 columns: Date & Time, Client, Carer, Type, Status
    const columnStyles: Record<number, { cellWidth: number }> = {
      0: { cellWidth: 50 },  // Date & Time (wider for combined format)
      1: { cellWidth: 48 },  // Client
      2: { cellWidth: 42 },  // Carer
      3: { cellWidth: 22 },  // Type
      4: { cellWidth: 22 },  // Status
    };
    
    // Build body data - allow text wrapping instead of truncating
    const bodyData = data.map(row => columns.map(col => row[col] || '-'));
    
    // Add data table with optimized styling and proper pagination
    autoTable(doc, {
      head: [columns],
      body: bodyData,
      startY: HEADER_HEIGHT_FIRST,
      theme: 'grid',
      showHead: 'everyPage',
      rowPageBreak: 'avoid',
      styles: { 
        fontSize: 6.5,
        cellPadding: 1.5,
        lineColor: [PDF_COLORS.gray[200].r, PDF_COLORS.gray[200].g, PDF_COLORS.gray[200].b],
        lineWidth: 0.1,
        overflow: 'linebreak',
        valign: 'middle',
        minCellHeight: 6
      },
      headStyles: { 
        fillColor: [PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 6.5,
        cellPadding: 2
      },
      alternateRowStyles: {
        fillColor: [PDF_COLORS.gray[50].r, PDF_COLORS.gray[50].g, PDF_COLORS.gray[50].b]
      },
      margin: { 
        top: HEADER_HEIGHT_OTHER + 4, 
        left: margin, 
        right: margin, 
        bottom: FOOTER_HEIGHT + 2 
      },
      columnStyles,
      didDrawPage: (data) => {
        // Add compact header on pages 2+
        if (data.pageNumber > 1) {
          addCompactHeader();
        }
      }
    });
    
    // Add footers to all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addCalendarFooter(i, pageCount);
    }
    
    // Save the PDF
    const finalFileName = fileName || `Organisation_Calendar_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
    doc.save(finalFileName);
  }

  /**
   * Export Organisation Calendar to PDF Blob (for sharing)
   * Uses identical logic to exportCalendarToPDF for consistency
   */
  static async exportCalendarToPDFBlob(options: ExportOptions): Promise<Blob> {
    const { title, data, columns, branchName, dateRange, branchId, metadata } = options;
    const doc = new jsPDF();
    
    // Fetch organization settings
    const orgSettings = branchId ? await fetchOrganizationSettings(branchId) : null;
    
    // Load company logo
    let logoBase64: string | null = null;
    if (orgSettings?.logo_url) {
      logoBase64 = await loadImageAsBase64(orgSettings.logo_url);
    }
    
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 12;
    const FOOTER_HEIGHT = 15;
    const HEADER_HEIGHT_FIRST = 58;
    const HEADER_HEIGHT_OTHER = 32;
    
    const getImageFormat = (base64: string): 'PNG' | 'JPEG' | 'GIF' => {
      if (base64.includes('data:image/jpeg') || base64.includes('data:image/jpg')) return 'JPEG';
      if (base64.includes('data:image/gif')) return 'GIF';
      return 'PNG';
    };
    
    /**
     * Add full header (page 1)
     */
    const addFullHeader = (): number => {
      doc.setFillColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
      doc.rect(0, 0, pageWidth, 4, 'F');
      
      let currentY = 10;
      
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, getImageFormat(logoBase64), margin, currentY, 28, 16);
        } catch (e) {
          console.error('Error adding logo:', e);
        }
      }
      
      const rightX = pageWidth - margin;
      doc.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(orgSettings?.name || 'Organisation', rightX, currentY + 3, { align: 'right' });
      
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(PDF_COLORS.gray[600].r, PDF_COLORS.gray[600].g, PDF_COLORS.gray[600].b);
      
      let detailY = currentY + 7;
      if (branchName) {
        doc.text(`Branch: ${branchName}`, rightX, detailY, { align: 'right' });
        detailY += 3;
      }
      if (orgSettings?.telephone) {
        doc.text(`Tel: ${orgSettings.telephone}`, rightX, detailY, { align: 'right' });
        detailY += 3;
      }
      if (orgSettings?.email) {
        doc.text(`Email: ${orgSettings.email}`, rightX, detailY, { align: 'right' });
        detailY += 3;
      }
      if (orgSettings?.website) {
        doc.text(`Web: ${orgSettings.website}`, rightX, detailY, { align: 'right' });
        detailY += 3;
      }
      doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, rightX, detailY, { align: 'right' });
      
      currentY = 32;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
      doc.text(title || 'Organisation Calendar Report', pageWidth / 2, currentY, { align: 'center' });
      
      if (dateRange) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
        const periodText = `Period: ${format(dateRange.from, 'dd MMM yyyy')} - ${format(dateRange.to, 'dd MMM yyyy')}`;
        const eventsText = metadata?.exportedRecords ? ` | ${metadata.exportedRecords} events` : '';
        doc.text(periodText + eventsText, pageWidth / 2, currentY + 5, { align: 'center' });
      }
      
      currentY = 42;
      doc.setDrawColor(PDF_COLORS.gray[200].r, PDF_COLORS.gray[200].g, PDF_COLORS.gray[200].b);
      doc.setLineWidth(0.3);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      
      return 46;
    };
    
    /**
     * Add compact header (pages 2+)
     */
    const addCompactHeader = () => {
      doc.setFillColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
      doc.rect(0, 0, pageWidth, 3, 'F');
      
      let currentY = 8;
      
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, getImageFormat(logoBase64), margin, currentY, 18, 10);
        } catch (e) {}
      }
      
      const rightX = pageWidth - margin;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
      doc.text('Organisation Calendar Report', rightX, currentY + 3, { align: 'right' });
      
      if (dateRange) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
        doc.text(
          `${format(dateRange.from, 'dd MMM yyyy')} - ${format(dateRange.to, 'dd MMM yyyy')}`,
          rightX,
          currentY + 7,
          { align: 'right' }
        );
      }
      
      currentY = 21;
      doc.setDrawColor(PDF_COLORS.gray[200].r, PDF_COLORS.gray[200].g, PDF_COLORS.gray[200].b);
      doc.setLineWidth(0.2);
      doc.line(margin, currentY, pageWidth - margin, currentY);
    };
    
    /**
     * Add footer
     */
    const addCalendarFooter = (pageNumber: number, totalPages: number) => {
      const footerY = pageHeight - 8;
      
      doc.setDrawColor(PDF_COLORS.gray[200].r, PDF_COLORS.gray[200].g, PDF_COLORS.gray[200].b);
      doc.setLineWidth(0.2);
      doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
      
      doc.setFontSize(6);
      doc.setTextColor(PDF_COLORS.gray[400].r, PDF_COLORS.gray[400].g, PDF_COLORS.gray[400].b);
      doc.setFont('helvetica', 'normal');
      
      doc.text('Confidential', margin, footerY);
      doc.text(`© ${orgSettings?.name || 'Organisation'}`, pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
    };
    
    // Add first page header
    addFullHeader();
    
    // Column widths optimized for 5 columns: Date & Time, Client, Carer, Type, Status
    const columnStyles: Record<number, { cellWidth: number }> = {
      0: { cellWidth: 50 },  // Date & Time (wider for combined format)
      1: { cellWidth: 48 },  // Client
      2: { cellWidth: 42 },  // Carer
      3: { cellWidth: 22 },  // Type
      4: { cellWidth: 22 },  // Status
    };
    
    // Build body data
    const bodyData = data.map(row => columns.map(col => row[col] || '-'));
    
    // Add data table
    autoTable(doc, {
      head: [columns],
      body: bodyData,
      startY: HEADER_HEIGHT_FIRST,
      theme: 'grid',
      showHead: 'everyPage',
      rowPageBreak: 'avoid',
      styles: { 
        fontSize: 6.5,
        cellPadding: 1.5,
        lineColor: [PDF_COLORS.gray[200].r, PDF_COLORS.gray[200].g, PDF_COLORS.gray[200].b],
        lineWidth: 0.1,
        overflow: 'linebreak',
        valign: 'middle',
        minCellHeight: 6
      },
      headStyles: { 
        fillColor: [PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 6.5,
        cellPadding: 2
      },
      alternateRowStyles: {
        fillColor: [PDF_COLORS.gray[50].r, PDF_COLORS.gray[50].g, PDF_COLORS.gray[50].b]
      },
      margin: { 
        top: HEADER_HEIGHT_OTHER + 4, 
        left: margin, 
        right: margin, 
        bottom: FOOTER_HEIGHT + 2 
      },
      columnStyles,
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          addCompactHeader();
        }
      }
    });
    
    // Add footers to all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addCalendarFooter(i, pageCount);
    }
    
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
    const { reports, clientName, branchId, branchName: inputBranchName, fileName } = options;
    const doc = new jsPDF();
    
    // Fetch organization settings
    const orgSettings = await fetchOrganizationSettings(branchId);
    const branchName = inputBranchName || 'Main Branch';
    
    // Load company logo
    let logoBase64: string | null = null;
    if (orgSettings?.logo_url) {
      logoBase64 = await loadImageAsBase64(orgSettings.logo_url);
    }
    
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const contentWidth = pageWidth - margin * 2;
    
    // Constants for page management (matching single report)
    const FOOTER_HEIGHT = 20;
    const SAFE_BOTTOM = pageHeight - FOOTER_HEIGHT;
    
    // Section colors (matching single report exactly)
    const SECTION_BG = {
      header: { r: 59, g: 130, b: 246 },
      light: { r: 248, g: 250, b: 252 },
      tasks: { r: 240, g: 253, b: 244 },
      meds: { r: 245, g: 243, b: 255 },
      vitals: { r: 254, g: 242, b: 242 },
      notes: { r: 254, g: 252, b: 232 },
      signatures: { r: 240, g: 249, b: 255 },
      goals: { r: 236, g: 253, b: 245 },
      activities: { r: 255, g: 247, b: 237 },
    };
    
    /**
     * Add compact section header (matching single report)
     */
    const addCompactSectionHeader = (
      title: string,
      currentY: number,
      bgColor: { r: number; g: number; b: number }
    ): number => {
      doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
      doc.rect(margin, currentY - 3, contentWidth, 7, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text(title, margin + 2, currentY + 1);
      
      return currentY + 6;
    };
    
    /**
     * Add two-column info box (matching single report)
     */
    const addTwoColumnBox = (
      leftData: { label: string; value: string }[],
      rightData: { label: string; value: string }[],
      currentY: number,
      bgColor: { r: number; g: number; b: number }
    ): number => {
      const boxHeight = Math.max(leftData.length, rightData.length) * 5 + 4;
      
      doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
      doc.roundedRect(margin, currentY, contentWidth, boxHeight, 1, 1, 'F');
      
      const col1X = margin + 3;
      const col2X = pageWidth / 2 + 3;
      
      doc.setFontSize(7);
      doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
      
      // Left column
      leftData.forEach((item, i) => {
        const y = currentY + 5 + (i * 5);
        doc.setFont('helvetica', 'bold');
        doc.text(`${item.label}:`, col1X, y);
        doc.setFont('helvetica', 'normal');
        doc.text(item.value, col1X + 28, y);
      });
      
      // Right column
      rightData.forEach((item, i) => {
        const y = currentY + 5 + (i * 5);
        doc.setFont('helvetica', 'bold');
        doc.text(`${item.label}:`, col2X, y);
        doc.setFont('helvetica', 'normal');
        doc.text(item.value, col2X + 28, y);
      });
      
      return currentY + boxHeight + 3;
    };
    
    /**
     * Add full page header (matching single report addFullPageHeader)
     */
    const addFullPageHeader = (
      report: any,
      reportIndex: number,
      totalReports: number
    ): number => {
      const visitDate = report.service_date 
        ? format(new Date(report.service_date), 'dd/MM/yyyy')
        : 'N/A';
      const reportId = report.id?.substring(0, 8).toUpperCase() || 'N/A';
      
      // Thin blue top strip
      doc.setFillColor(SECTION_BG.header.r, SECTION_BG.header.g, SECTION_BG.header.b);
      doc.rect(0, 0, pageWidth, 5, 'F');
      
      // LEFT SIDE: Logo
      if (logoBase64) {
        try {
          const getImageFormat = (base64: string): 'PNG' | 'JPEG' | 'GIF' => {
            if (base64.includes('data:image/jpeg') || base64.includes('data:image/jpg')) return 'JPEG';
            if (base64.includes('data:image/gif')) return 'GIF';
            return 'PNG';
          };
          doc.addImage(logoBase64, getImageFormat(logoBase64), margin, 8, 40, 22);
        } catch (e) {
          console.error('Error adding logo:', e);
        }
      }
      
      // RIGHT SIDE: Organization details
      const rightX = pageWidth - margin;
      
      doc.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(orgSettings?.name || 'Healthcare Services', rightX, 12, { align: 'right' });
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(PDF_COLORS.gray[600].r, PDF_COLORS.gray[600].g, PDF_COLORS.gray[600].b);
      
      let detailY = 17;
      if (orgSettings?.address) {
        const addressLine = orgSettings.address.split('\n')[0];
        doc.text(addressLine, rightX, detailY, { align: 'right' });
        detailY += 4;
      }
      if (orgSettings?.telephone) {
        doc.text(`Tel: ${orgSettings.telephone}`, rightX, detailY, { align: 'right' });
        detailY += 4;
      }
      if (orgSettings?.email) {
        doc.text(orgSettings.email, rightX, detailY, { align: 'right' });
        detailY += 4;
      }
      doc.text(`Branch: ${branchName}`, rightX, detailY, { align: 'right' });
      detailY += 4;
      doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, rightX, detailY, { align: 'right' });
      
      // CENTERED TITLE
      let currentY = 38;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PDF_COLORS.gray[900].r, PDF_COLORS.gray[900].g, PDF_COLORS.gray[900].b);
      doc.text('SERVICE REPORT', pageWidth / 2, currentY, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
      doc.text(`Client: ${clientName} | Report ID: ${reportId} | Report ${reportIndex + 1} of ${totalReports}`, pageWidth / 2, currentY + 5, { align: 'center' });
      
      return 48;
    };
    
    /**
     * Add professional footer (matching single report)
     */
    const addProfessionalFooter = (pageNumber: number, totalPages: number) => {
      const footerY = pageHeight - 12;
      
      // Divider line
      doc.setDrawColor(PDF_COLORS.gray[300].r, PDF_COLORS.gray[300].g, PDF_COLORS.gray[300].b);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
      
      // Footer text
      doc.setFontSize(6);
      doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
      doc.setFont('helvetica', 'normal');
      
      doc.text('Confidential - For authorised use only', margin, footerY);
      const centerText = `Generated by Laniwyn Care System | © ${orgSettings?.name || 'Healthcare Services'}`;
      doc.text(centerText, pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
    };
    
    /**
     * Check if page break needed
     */
    const checkPageBreak = (currentY: number, requiredSpace: number, report: any, reportIndex: number): number => {
      if (currentY + requiredSpace > SAFE_BOTTOM) {
        doc.addPage();
        return addFullPageHeader(report, reportIndex, reports.length);
      }
      return currentY;
    };
    
    // ========== GENERATE EACH SERVICE REPORT ==========
    reports.forEach((report, reportIndex) => {
      // Each report starts on a new page (except first)
      if (reportIndex > 0) {
        doc.addPage();
      }
      
      // Add header
      let currentY = addFullPageHeader(report, reportIndex, reports.length);
      
      // Extract data (matching single report format)
      const carerName = report.staff 
        ? `${report.staff.first_name || ''} ${report.staff.last_name || ''}`.trim() || 'N/A'
        : 'N/A';
      const visitDate = report.service_date 
        ? format(new Date(report.service_date), 'dd/MM/yyyy')
        : 'N/A';
      const startTime = report.check_in_time || 'N/A';
      const endTime = report.check_out_time || 'N/A';
      const duration = report.service_duration_minutes ? `${report.service_duration_minutes} mins` : 'N/A';
      const statusText = (report.status || 'pending').toUpperCase();
      
      // === CLIENT & CARER DETAILS (matching single report) ===
      currentY = addCompactSectionHeader('CLIENT & CARER DETAILS', currentY, SECTION_BG.light);
      currentY = addTwoColumnBox(
        [
          { label: 'Client Name', value: clientName },
          { label: 'Date of Birth', value: 'On file' },
          { label: 'Address', value: 'On file' },
        ],
        [
          { label: 'Staff Name', value: carerName },
          { label: 'Contact', value: report.staff?.email || 'N/A' },
        ],
        currentY, SECTION_BG.light
      );
      
      // === SERVICE DETAILS (matching single report) ===
      currentY += 5;
      currentY = addCompactSectionHeader('SERVICE DETAILS', currentY, SECTION_BG.light);
      currentY = addTwoColumnBox(
        [
          { label: 'Service Date', value: visitDate },
          { label: 'Start Time', value: startTime },
          { label: 'Duration', value: duration },
        ],
        [
          { label: 'End Time', value: endTime },
          { label: 'Service Type', value: 'Home Care Visit' },
          { label: 'Status', value: statusText },
        ],
        currentY, SECTION_BG.light
      );
      
      // === TASKS COMPLETED (matching single report columns) ===
      currentY += 5;
      currentY = addCompactSectionHeader('TASKS COMPLETED', currentY, SECTION_BG.tasks);
      
      if (report.tasks?.length > 0) {
        const taskData = report.tasks.map((t: any) => [
          t.task_name || t.task_category || 'N/A',
          (t.task_description || '-').substring(0, 30) + (t.task_description?.length > 30 ? '...' : ''),
          t.is_completed ? '✓' : '✗',
          t.completed_at ? format(new Date(t.completed_at), 'HH:mm') : '-',
          t.completion_time_minutes ? `${t.completion_time_minutes} mins` : '-',
        ]);
        
        autoTable(doc, {
          startY: currentY,
          head: [['Task Name', 'Description', 'Status', 'Time', 'Duration']],
          body: taskData,
          theme: 'grid',
          headStyles: { 
            fillColor: [34, 197, 94], 
            fontSize: 7, 
            fontStyle: 'bold', 
            textColor: [255, 255, 255],
            cellPadding: 1.5
          },
          styles: { fontSize: 6, cellPadding: 1.5 },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 40 },
            2: { cellWidth: 12, halign: 'center' },
            3: { cellWidth: 15, halign: 'center' },
            4: { cellWidth: 'auto', halign: 'center' }
          },
          margin: { left: margin, right: margin, bottom: FOOTER_HEIGHT + 5, top: 50 },
          alternateRowStyles: { fillColor: [240, 253, 244] },
          didDrawPage: () => {
            const pageNum = doc.getNumberOfPages();
            if (pageNum > 1) {
              addFullPageHeader(report, reportIndex, reports.length);
            }
          }
        });
        currentY = (doc as any).lastAutoTable.finalY + 3;
      } else {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
        doc.text('No data available', margin + 2, currentY + 3);
        currentY += 8;
      }
      
      // === MEDICATIONS (matching single report 6 columns) ===
      currentY += 5;
      currentY = checkPageBreak(currentY, 40, report, reportIndex);
      currentY = addCompactSectionHeader('MEDICATIONS', currentY, SECTION_BG.meds);
      
      if (report.medications?.length > 0) {
        const medData = report.medications.map((m: any) => [
          m.medication_name || 'N/A',
          m.dosage || 'N/A',
          m.prescribed_time || 'As needed',
          m.administration_method || 'N/A',
          m.is_administered ? 'Given' : m.missed_reason ? 'Missed' : 'Pending',
          (m.administration_notes || m.missed_reason || '-').substring(0, 25)
        ]);
        
        autoTable(doc, {
          startY: currentY,
          head: [['Medication', 'Dosage', 'Frequency', 'Method', 'Status', 'Notes']],
          body: medData,
          theme: 'grid',
          headStyles: { 
            fillColor: [147, 51, 234], 
            fontSize: 7, 
            fontStyle: 'bold', 
            textColor: [255, 255, 255],
            cellPadding: 1.5
          },
          styles: { fontSize: 6, cellPadding: 1.5 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 20 },
            2: { cellWidth: 20 },
            3: { cellWidth: 20 },
            4: { cellWidth: 15, halign: 'center' },
            5: { cellWidth: 'auto' }
          },
          margin: { left: margin, right: margin, bottom: FOOTER_HEIGHT + 5, top: 50 },
          alternateRowStyles: { fillColor: [245, 243, 255] },
          didDrawPage: () => {
            const pageNum = doc.getNumberOfPages();
            if (pageNum > 1) {
              addFullPageHeader(report, reportIndex, reports.length);
            }
          }
        });
        currentY = (doc as any).lastAutoTable.finalY + 3;
      } else {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
        doc.text('No data available', margin + 2, currentY + 3);
        currentY += 8;
      }
      
      // === NEWS2 & VITAL SIGNS (Table Format - matching single report) ===
      currentY += 5;
      currentY = checkPageBreak(currentY, 80, report, reportIndex);
      currentY = addCompactSectionHeader('NEWS2 & VITAL SIGNS', currentY, SECTION_BG.vitals);
      
      if (report.news2_readings?.length > 0) {
        const reading = report.news2_readings[0];
        const recordedTime = reading.reading_time ? format(new Date(reading.reading_time), 'HH:mm') : '-';
        
        // Vitals table (matching single report)
        const vitalsTableData = [
          ['Respiratory Rate', reading.respiratory_rate || '-', '/min', recordedTime],
          ['Oxygen Saturation (SpO2)', reading.oxygen_saturation || reading.spo2 || '-', '%', ''],
          ['Temperature', reading.temperature || '-', '°C', ''],
          ['Blood Pressure', reading.systolic_bp ? `${reading.systolic_bp}/${reading.diastolic_bp || '-'}` : '-', 'mmHg', ''],
          ['Heart Rate', reading.pulse_rate || reading.heart_rate || '-', 'bpm', ''],
          ['Consciousness Level', reading.consciousness_level || '-', '-', ''],
        ];
        
        autoTable(doc, {
          startY: currentY,
          head: [['Vital Sign', 'Value', 'Unit', 'Recorded Time']],
          body: vitalsTableData,
          theme: 'grid',
          headStyles: { 
            fillColor: [239, 68, 68], 
            fontSize: 7, 
            fontStyle: 'bold', 
            textColor: [255, 255, 255],
            cellPadding: 1.5
          },
          styles: { fontSize: 6, cellPadding: 1.5 },
          columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 'auto', halign: 'center' }
          },
          margin: { left: margin, right: margin, bottom: FOOTER_HEIGHT + 5, top: 50 },
          alternateRowStyles: { fillColor: [254, 242, 242] },
          didDrawPage: () => {
            const pageNum = doc.getNumberOfPages();
            if (pageNum > 1) {
              addFullPageHeader(report, reportIndex, reports.length);
            }
          }
        });
        currentY = (doc as any).lastAutoTable.finalY + 3;
        
        // NEWS2 Score line (matching single report)
        const news2Score = reading.news2_total_score || reading.total_score || 0;
        const riskLevel = news2Score >= 7 ? 'High Risk' : news2Score >= 5 ? 'Medium-High Risk' : news2Score >= 3 ? 'Low-Medium Risk' : 'Low Risk';
        const scoreColor = news2Score >= 5 ? PDF_COLORS.danger : news2Score >= 3 ? PDF_COLORS.warning : PDF_COLORS.success;
        
        doc.setFillColor(SECTION_BG.vitals.r, SECTION_BG.vitals.g, SECTION_BG.vitals.b);
        doc.roundedRect(margin, currentY, contentWidth, 8, 1, 1, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b);
        doc.text(`NEWS2 Score: ${news2Score} (${riskLevel})`, margin + 3, currentY + 5.5);
        
        currentY += 11;
      } else {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
        doc.text('No vital signs recorded', margin + 2, currentY + 3);
        currentY += 8;
      }
      
      // === CARE PLAN GOALS & ACTIVITIES (Side-by-Side - matching single report) ===
      currentY += 5;
      currentY = checkPageBreak(currentY, 60, report, reportIndex);
      
      const halfWidth = (contentWidth - 5) / 2;
      const leftX = margin;
      const rightX = margin + halfWidth + 5;
      
      // Left Column Header: CARE PLAN GOALS
      doc.setFillColor(SECTION_BG.goals.r, SECTION_BG.goals.g, SECTION_BG.goals.b);
      doc.roundedRect(leftX, currentY - 3, halfWidth, 7, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('CARE PLAN GOALS', leftX + 2, currentY + 1);
      
      // Right Column Header: ACTIVITIES
      doc.setFillColor(SECTION_BG.activities.r, SECTION_BG.activities.g, SECTION_BG.activities.b);
      doc.roundedRect(rightX, currentY - 3, halfWidth, 7, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('ACTIVITIES', rightX + 2, currentY + 1);
      
      currentY += 6;
      const goalsContentY = currentY;
      
      // Left Column Content: Care Plan Goals
      let leftColumnHeight = 0;
      doc.setFillColor(240, 253, 244);
      
      if (report.care_plan_goals?.length > 0) {
        const goalLines: string[] = [];
        report.care_plan_goals.forEach((g: any, idx: number) => {
          const goalText = `${idx + 1}. ${(g.description || g.goal_name || 'N/A').substring(0, 45)}${(g.description || g.goal_name)?.length > 45 ? '...' : ''}`;
          const statusText = `   Status: ${g.status || 'In Progress'}${g.progress ? ` (${g.progress}%)` : ''}`;
          goalLines.push(goalText, statusText);
        });
        leftColumnHeight = goalLines.length * 4 + 4;
        
        doc.roundedRect(leftX, goalsContentY, halfWidth, leftColumnHeight, 1, 1, 'F');
        doc.setFontSize(6);
        doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
        
        goalLines.forEach((line, idx) => {
          if (line.startsWith('   Status:')) {
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
          } else {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
          }
          doc.text(line, leftX + 2, goalsContentY + 4 + (idx * 4));
        });
      } else {
        leftColumnHeight = 10;
        doc.roundedRect(leftX, goalsContentY, halfWidth, leftColumnHeight, 1, 1, 'F');
        doc.setFontSize(6);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
        doc.text('No goals recorded', leftX + 2, goalsContentY + 6);
      }
      
      // Right Column Content: Activities
      let rightColumnHeight = 0;
      doc.setFillColor(255, 247, 237);
      
      const activities = report.activities || report.activities_list || [];
      if (activities.length > 0) {
        const activityLines: string[] = [];
        activities.forEach((a: any, idx: number) => {
          const actName = `${idx + 1}. ${(a.name || a.activity_name || 'N/A').substring(0, 40)}`;
          const actDesc = `   ${(a.description || '-').substring(0, 40)}${a.description?.length > 40 ? '...' : ''}`;
          activityLines.push(actName, actDesc);
        });
        rightColumnHeight = activityLines.length * 4 + 4;
        
        doc.roundedRect(rightX, goalsContentY, halfWidth, rightColumnHeight, 1, 1, 'F');
        doc.setFontSize(6);
        doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
        
        activityLines.forEach((line, idx) => {
          if (line.startsWith('   ')) {
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
          } else {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
          }
          doc.text(line, rightX + 2, goalsContentY + 4 + (idx * 4));
        });
      } else if (report.activities_undertaken) {
        const activitiesText = doc.splitTextToSize(report.activities_undertaken, halfWidth - 6);
        rightColumnHeight = activitiesText.length * 4 + 4;
        doc.roundedRect(rightX, goalsContentY, halfWidth, rightColumnHeight, 1, 1, 'F');
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
        doc.text(activitiesText, rightX + 2, goalsContentY + 4);
      } else {
        rightColumnHeight = 10;
        doc.roundedRect(rightX, goalsContentY, halfWidth, rightColumnHeight, 1, 1, 'F');
        doc.setFontSize(6);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
        doc.text('No activities recorded', rightX + 2, goalsContentY + 6);
      }
      
      currentY = goalsContentY + Math.max(leftColumnHeight, rightColumnHeight) + 3;
      
      // === INCIDENTS / EVENTS (Table Format - matching single report) ===
      currentY += 5;
      currentY = checkPageBreak(currentY, 40, report, reportIndex);
      const hasIncidents = report.incident_occurred || report.incidents?.length > 0 || report.accidents?.length > 0;
      
      currentY = addCompactSectionHeader('INCIDENTS / EVENTS', currentY, { r: 254, g: 226, b: 226 });
      
      if (hasIncidents) {
        const allIncidents = [
          ...(report.incidents || []), 
          ...(report.accidents || []),
          ...(report.incident_occurred ? [{ 
            event_type: 'incident',
            event_description: report.incident_details || 'Incident occurred',
            severity: 'Medium'
          }] : [])
        ];
        
        const incidentData = allIncidents.map((inc: any) => [
          inc.event_time ? format(new Date(inc.event_time), 'dd/MM HH:mm') : '-',
          inc.event_type === 'accident' ? 'Accident' : 'Incident',
          (inc.event_description || inc.event_title || 'No description').substring(0, 40),
          inc.severity || 'Low',
          (inc.immediate_action_taken || 'None documented').substring(0, 30),
        ]);
        
        autoTable(doc, {
          startY: currentY,
          head: [['Date/Time', 'Type', 'Description', 'Severity', 'Action Taken']],
          body: incidentData,
          theme: 'grid',
          headStyles: { 
            fillColor: [239, 68, 68], 
            fontSize: 7, 
            fontStyle: 'bold', 
            textColor: [255, 255, 255],
            cellPadding: 1.5
          },
          styles: { fontSize: 6, cellPadding: 1.5 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 18 },
            2: { cellWidth: 50 },
            3: { cellWidth: 18, halign: 'center' },
            4: { cellWidth: 'auto' }
          },
          margin: { left: margin, right: margin, bottom: FOOTER_HEIGHT + 5, top: 50 },
          alternateRowStyles: { fillColor: [254, 226, 226] },
          didDrawPage: () => {
            const pageNum = doc.getNumberOfPages();
            if (pageNum > 1) {
              addFullPageHeader(report, reportIndex, reports.length);
            }
          }
        });
        currentY = (doc as any).lastAutoTable.finalY + 3;
      } else {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
        doc.text('No data available', margin + 2, currentY + 3);
        currentY += 8;
      }
      
      // === SERVICE NOTES & OBSERVATIONS (matching single report) ===
      currentY += 5;
      currentY = checkPageBreak(currentY, 50, report, reportIndex);
      const hasNotes = report.carer_observations || report.client_mood || 
                       report.client_feedback || report.next_visit_preparations;
      
      currentY = addCompactSectionHeader('SERVICE NOTES & OBSERVATIONS', currentY, SECTION_BG.notes);
      
      if (hasNotes || report.observations?.length > 0) {
        doc.setFillColor(SECTION_BG.notes.r, SECTION_BG.notes.g, SECTION_BG.notes.b);
        
        doc.setFontSize(7);
        doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
        
        const noteItems: string[] = [];
        if (report.client_mood) noteItems.push(`Client Mood: ${report.client_mood}`);
        if (report.carer_observations) noteItems.push(`Observations: ${report.carer_observations.substring(0, 80)}`);
        if (report.client_feedback) noteItems.push(`Feedback: ${report.client_feedback.substring(0, 60)}`);
        if (report.next_visit_preparations) noteItems.push(`Next Visit: ${report.next_visit_preparations.substring(0, 50)}`);
        
        report.observations?.slice(0, 2).forEach((obs: any) => {
          noteItems.push(`Observation: ${(obs.event_description || '').substring(0, 60)}`);
        });
        
        if (noteItems.length > 0) {
          const boxHeight = noteItems.length * 5 + 4;
          doc.roundedRect(margin, currentY, contentWidth, boxHeight, 1, 1, 'F');
          
          noteItems.forEach((note, i) => {
            doc.text(`• ${note}`, margin + 3, currentY + 4 + (i * 5));
          });
          currentY += boxHeight + 3;
        } else {
          doc.setFont('helvetica', 'italic');
          doc.text('No data available', margin + 2, currentY + 3);
          currentY += 8;
        }
      } else {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
        doc.text('No data available', margin + 2, currentY + 3);
        currentY += 8;
      }
      
      // === SIGNATURES (matching single report) ===
      if (report.staff_signature_data || report.client_signature_data || report.visit_record?.staff_signature_data) {
        currentY += 5;
        currentY = checkPageBreak(currentY, 35, report, reportIndex);
        currentY = addCompactSectionHeader('SIGNATURES', currentY, SECTION_BG.signatures);
        
        const sigBoxWidth = (contentWidth - 5) / 2;
        const sigBoxHeight = 25;
        
        // Staff signature box (left)
        doc.setFillColor(SECTION_BG.signatures.r, SECTION_BG.signatures.g, SECTION_BG.signatures.b);
        doc.roundedRect(margin, currentY, sigBoxWidth, sigBoxHeight, 1, 1, 'F');
        
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
        doc.text('STAFF SIGNATURE', margin + 2, currentY + 4);
        
        const staffSig = report.staff_signature_data || report.visit_record?.staff_signature_data;
        if (staffSig) {
          try {
            doc.addImage(staffSig, 'PNG', margin + 5, currentY + 6, 40, 12);
          } catch (e) { console.error('Error adding staff signature:', e); }
        }
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${carerName}`, margin + 2, currentY + 21);
        doc.text(`Date: ${visitDate}`, margin + 50, currentY + 21);
        
        // Client signature box (right)
        const rightBoxX = margin + sigBoxWidth + 5;
        doc.roundedRect(rightBoxX, currentY, sigBoxWidth, sigBoxHeight, 1, 1, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.text('CLIENT / REP SIGNATURE', rightBoxX + 2, currentY + 4);
        
        const clientSig = report.client_signature_data || report.visit_record?.client_signature_data;
        if (clientSig) {
          try {
            doc.addImage(clientSig, 'PNG', rightBoxX + 5, currentY + 6, 40, 12);
          } catch (e) { console.error('Error adding client signature:', e); }
        }
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${clientName}`, rightBoxX + 2, currentY + 21);
        doc.text(`Date: ${visitDate}`, rightBoxX + 50, currentY + 21);
        
        currentY += sigBoxHeight + 3;
      }
      
      // === ADMIN REVIEW (matching single report) ===
      if (report.reviewed_at && report.review_notes) {
        currentY = checkPageBreak(currentY, 20, report, reportIndex);
        currentY = addCompactSectionHeader('ADMIN REVIEW', currentY, SECTION_BG.light);
        
        doc.setFillColor(SECTION_BG.light.r, SECTION_BG.light.g, SECTION_BG.light.b);
        doc.roundedRect(margin, currentY, contentWidth, 12, 1, 1, 'F');
        
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
        doc.text('Status:', margin + 2, currentY + 4);
        
        const statusColor = report.status === 'approved' ? PDF_COLORS.success : 
                           report.status === 'rejected' ? PDF_COLORS.danger : PDF_COLORS.warning;
        doc.setTextColor(statusColor.r, statusColor.g, statusColor.b);
        doc.text((report.status || 'pending').toUpperCase(), margin + 15, currentY + 4);
        
        doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
        doc.setFont('helvetica', 'normal');
        const reviewNote = (report.review_notes || '').substring(0, 100);
        doc.text(`Notes: ${reviewNote}`, margin + 2, currentY + 9);
        
        currentY += 15;
      }
    });
    
    // Add professional footers to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addProfessionalFooter(i, totalPages);
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
