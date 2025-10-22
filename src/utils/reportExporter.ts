
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportOptions {
  title: string;
  data: any[];
  columns: string[];
  fileName?: string;
  branchName?: string;
  dateRange?: { from: Date; to: Date } | null;
}

export class ReportExporter {
  static exportToPDF(options: ExportOptions) {
    const { title, data, columns, fileName, branchName, dateRange } = options;
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.text(title, 20, 20);
    
    if (branchName) {
      doc.setFontSize(12);
      doc.text(`Branch: ${branchName}`, 20, 30);
    }
    
    if (dateRange) {
      doc.setFontSize(10);
      doc.text(`Period: ${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`, 20, 40);
    }
    
    // Add table
    autoTable(doc, {
      head: [columns],
      body: data.map(row => columns.map(col => row[col] || '')),
      startY: dateRange ? 50 : 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')} | Page ${i} of ${pageCount}`,
        20,
        doc.internal.pageSize.height - 10
      );
    }
    
    // Save the PDF
    const finalFileName = fileName || `${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
    doc.save(finalFileName);
  }

  static exportToPDFBlob(options: ExportOptions): Blob {
    const { title, data, columns, branchName, dateRange } = options;
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.text(title, 20, 20);
    
    if (branchName) {
      doc.setFontSize(12);
      doc.text(`Branch: ${branchName}`, 20, 30);
    }
    
    if (dateRange) {
      doc.setFontSize(10);
      doc.text(`Period: ${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`, 20, 40);
    }
    
    // Add table
    autoTable(doc, {
      head: [columns],
      body: data.map(row => columns.map(col => row[col] || '')),
      startY: dateRange ? 50 : 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')} | Page ${i} of ${pageCount}`,
        20,
        doc.internal.pageSize.height - 10
      );
    }
    
    // Return as Blob instead of saving
    return doc.output('blob');
  }

  static exportToCSV(options: ExportOptions) {
    const { title, data, columns, fileName } = options;
    
    // Create CSV content
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
    
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
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
}
