
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { EnhancedClientBilling } from '@/hooks/useEnhancedClientBilling';
import { formatCurrency } from './currencyFormatter';

// Safe date formatting function
const formatDateSafe = (date: string | Date, formatString: string = 'dd/MM/yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
};

export interface InvoicePdfData {
  invoice: EnhancedClientBilling;
  clientName: string;
  clientAddress?: string;
  clientEmail?: string;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export const generateInvoicePDF = (data: InvoicePdfData) => {
  try {
    console.log('Starting PDF generation with data:', data);
    
    const { invoice, clientName, clientAddress, clientEmail, companyInfo } = data;
    
    // Validate required data
    if (!invoice) {
      throw new Error('Invoice data is required');
    }
    
    if (!invoice.invoice_number) {
      throw new Error('Invoice number is required');
    }
    
    console.log('Creating PDF document...');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPosition = margin;

  // Colors (convert to RGB for jsPDF)
  const primaryColorRgb: [number, number, number] = [37, 99, 235]; // #2563eb
  const grayColorRgb: [number, number, number] = [107, 114, 128]; // #6b7280

  // Header
  doc.setFontSize(24);
  doc.setTextColor(primaryColorRgb[0], primaryColorRgb[1], primaryColorRgb[2]);
  doc.text('INVOICE', margin, yPosition);
  
  doc.setFontSize(10);
  doc.setTextColor(grayColorRgb[0], grayColorRgb[1], grayColorRgb[2]);
  doc.text(`Invoice #${invoice.invoice_number}`, pageWidth - margin - 60, yPosition);
  
  yPosition += 20;

  // Company Info (if provided)
  if (companyInfo) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(companyInfo.name, margin, yPosition);
    yPosition += 6;
    
    doc.setFontSize(10);
    doc.setTextColor(grayColorRgb[0], grayColorRgb[1], grayColorRgb[2]);
    doc.text(companyInfo.address, margin, yPosition);
    yPosition += 5;
    doc.text(`Phone: ${companyInfo.phone}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Email: ${companyInfo.email}`, margin, yPosition);
    yPosition += 15;
  }

  // Invoice Info Box
  const infoBoxY = yPosition;
  doc.setDrawColor(primaryColorRgb[0], primaryColorRgb[1], primaryColorRgb[2]);
  doc.setLineWidth(0.5);
  doc.rect(pageWidth - margin - 80, infoBoxY, 80, 40);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Invoice Date:', pageWidth - margin - 75, infoBoxY + 8);
  doc.text(formatDateSafe(invoice.invoice_date), pageWidth - margin - 75, infoBoxY + 15);
  
  doc.text('Due Date:', pageWidth - margin - 75, infoBoxY + 23);
  doc.text(formatDateSafe(invoice.due_date), pageWidth - margin - 75, infoBoxY + 30);
  
  doc.text('Status:', pageWidth - margin - 75, infoBoxY + 38);
  doc.setTextColor(invoice.status === 'paid' ? 22 : 220, invoice.status === 'paid' ? 163 : 38, invoice.status === 'paid' ? 74 : 38);
  doc.text((invoice.status || 'pending').toUpperCase(), pageWidth - margin - 35, infoBoxY + 38);

  // Bill To Section
  yPosition += 50;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Bill To:', margin, yPosition);
  yPosition += 8;
  
  doc.setFontSize(11);
  doc.text(clientName || 'Client', margin, yPosition);
  yPosition += 6;
  
  if (clientAddress) {
    doc.setFontSize(10);
    doc.setTextColor(grayColorRgb[0], grayColorRgb[1], grayColorRgb[2]);
    const addressLines = clientAddress.split('\n');
    addressLines.forEach(line => {
      if (line.trim()) {
        doc.text(line.trim(), margin, yPosition);
        yPosition += 5;
      }
    });
  }
  
  if (clientEmail) {
    doc.text(clientEmail, margin, yPosition);
    yPosition += 5;
  }

  yPosition += 15;

  // Line Items Table
  const tableData = invoice.line_items?.map(item => [
    item.description || 'Service',
    (item.quantity || 1).toString(),
    formatCurrency(item.unit_price || 0),
    formatCurrency(item.discount_amount || 0),
    formatCurrency(item.line_total || (item.quantity || 1) * (item.unit_price || 0))
  ]) || [];

  autoTable(doc, {
    startY: yPosition,
    head: [['Description', 'Qty', 'Unit Price', 'Discount', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColorRgb,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [0, 0, 0]
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });

  // Get the Y position after the table
  yPosition = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : yPosition + 50;

  // Totals Section
  const totalsX = pageWidth - margin - 80;
  const subtotal = invoice.line_items?.reduce((sum, item) => sum + (item.line_total || 0), 0) || invoice.amount || 0;
  const totalDiscounts = invoice.line_items?.reduce((sum, item) => sum + (item.discount_amount || 0), 0) || 0;
  const taxPercentage = invoice.tax_amount || 0;
  const taxAmount = subtotal * (taxPercentage / 100);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Subtotal
  doc.text('Subtotal:', totalsX, yPosition);
  doc.text(formatCurrency(subtotal + totalDiscounts), totalsX + 50, yPosition);
  yPosition += 8;
  
  // Total Discounts
  if (totalDiscounts > 0) {
    doc.text('Total Discounts:', totalsX, yPosition);
    doc.text('-' + formatCurrency(totalDiscounts), totalsX + 50, yPosition);
    yPosition += 8;
  }
  
  // Tax
  if (taxPercentage > 0) {
    doc.text(`Tax (${taxPercentage}%):`, totalsX, yPosition);
    doc.text(formatCurrency(taxAmount), totalsX + 50, yPosition);
    yPosition += 8;
  }
  
  // Total
  doc.setDrawColor(grayColorRgb[0], grayColorRgb[1], grayColorRgb[2]);
  doc.line(totalsX, yPosition, totalsX + 70, yPosition);
  yPosition += 8;
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Total:', totalsX, yPosition);
  doc.text(formatCurrency(subtotal - totalDiscounts + taxAmount), totalsX + 50, yPosition);

  // Payment History (if any)
  if (invoice.payment_records && invoice.payment_records.length > 0) {
    yPosition += 20;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Payment History:', margin, yPosition);
    yPosition += 10;
    
    const paymentData = invoice.payment_records.map(payment => [
      formatDateSafe(payment.payment_date),
      payment.payment_method,
      formatCurrency(payment.payment_amount),
      payment.transaction_id || '-'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Method', 'Amount', 'Transaction ID']],
      body: paymentData,
      theme: 'striped',
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [0, 0, 0],
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8
      },
      margin: { left: margin, right: margin }
    });
  }

  // Notes Section
  if (invoice.notes) {
    yPosition = (doc as any).lastAutoTable?.finalY + 15 || yPosition + 15;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Notes:', margin, yPosition);
    yPosition += 8;
    
    doc.setFont(undefined, 'normal');
    doc.setTextColor(grayColorRgb[0], grayColorRgb[1], grayColorRgb[2]);
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin, yPosition);
  }

  // Footer
  const footerY = doc.internal.pageSize.height - 30;
  doc.setFontSize(8);
  doc.setTextColor(grayColorRgb[0], grayColorRgb[1], grayColorRgb[2]);
  doc.text('Thank you for your business!', margin, footerY);
  doc.text(`Generated on ${formatDateSafe(new Date())}`, pageWidth - margin - 60, footerY);

    // Download the PDF
    console.log('Saving PDF document...');
    doc.save(`Invoice-${invoice.invoice_number}.pdf`);
    console.log('PDF generated successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
