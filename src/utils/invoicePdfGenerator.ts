
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { EnhancedClientBilling } from '@/hooks/useEnhancedClientBilling';
import { formatCurrency } from './currencyFormatter';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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
  const { invoice, clientName, clientAddress, clientEmail, companyInfo } = data;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPosition = margin;

  // Colors
  const primaryColor = '#2563eb';
  const grayColor = '#6b7280';

  // Header
  doc.setFontSize(24);
  doc.setTextColor(primaryColor);
  doc.text('INVOICE', margin, yPosition);
  
  doc.setFontSize(10);
  doc.setTextColor(grayColor);
  doc.text(`Invoice #${invoice.invoice_number}`, pageWidth - margin - 60, yPosition);
  
  yPosition += 20;

  // Company Info (if provided)
  if (companyInfo) {
    doc.setFontSize(12);
    doc.setTextColor('#000000');
    doc.text(companyInfo.name, margin, yPosition);
    yPosition += 6;
    
    doc.setFontSize(10);
    doc.setTextColor(grayColor);
    doc.text(companyInfo.address, margin, yPosition);
    yPosition += 5;
    doc.text(`Phone: ${companyInfo.phone}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Email: ${companyInfo.email}`, margin, yPosition);
    yPosition += 15;
  }

  // Invoice Info Box
  const infoBoxY = yPosition;
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.rect(pageWidth - margin - 80, infoBoxY, 80, 40);
  
  doc.setFontSize(10);
  doc.setTextColor('#000000');
  doc.text('Invoice Date:', pageWidth - margin - 75, infoBoxY + 8);
  doc.text(format(new Date(invoice.invoice_date), 'dd/MM/yyyy'), pageWidth - margin - 75, infoBoxY + 15);
  
  doc.text('Due Date:', pageWidth - margin - 75, infoBoxY + 23);
  doc.text(format(new Date(invoice.due_date), 'dd/MM/yyyy'), pageWidth - margin - 75, infoBoxY + 30);
  
  doc.text('Status:', pageWidth - margin - 75, infoBoxY + 38);
  doc.setTextColor(invoice.status === 'paid' ? '#16a34a' : '#dc2626');
  doc.text(invoice.status.toUpperCase(), pageWidth - margin - 35, infoBoxY + 38);

  // Bill To Section
  yPosition += 50;
  doc.setFontSize(12);
  doc.setTextColor('#000000');
  doc.text('Bill To:', margin, yPosition);
  yPosition += 8;
  
  doc.setFontSize(11);
  doc.text(clientName, margin, yPosition);
  yPosition += 6;
  
  if (clientAddress) {
    doc.setFontSize(10);
    doc.setTextColor(grayColor);
    const addressLines = clientAddress.split('\n');
    addressLines.forEach(line => {
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });
  }
  
  if (clientEmail) {
    doc.text(clientEmail, margin, yPosition);
    yPosition += 5;
  }

  yPosition += 15;

  // Line Items Table
  const tableData = invoice.line_items?.map(item => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unit_price),
    formatCurrency(item.discount_amount),
    formatCurrency(item.line_total)
  ]) || [];

  doc.autoTable({
    startY: yPosition,
    head: [['Description', 'Qty', 'Unit Price', 'Discount', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: '#ffffff',
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: '#000000'
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
  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Totals Section
  const totalsX = pageWidth - margin - 80;
  const subtotal = invoice.line_items?.reduce((sum, item) => sum + item.line_total, 0) || invoice.amount;
  
  doc.setFontSize(10);
  doc.setTextColor('#000000');
  
  // Subtotal
  doc.text('Subtotal:', totalsX, yPosition);
  doc.text(formatCurrency(subtotal), totalsX + 50, yPosition);
  yPosition += 8;
  
  // Tax
  if (invoice.tax_amount > 0) {
    doc.text('Tax:', totalsX, yPosition);
    doc.text(formatCurrency(invoice.tax_amount), totalsX + 50, yPosition);
    yPosition += 8;
  }
  
  // Total
  doc.setDrawColor(grayColor);
  doc.line(totalsX, yPosition, totalsX + 70, yPosition);
  yPosition += 8;
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Total:', totalsX, yPosition);
  doc.text(formatCurrency(invoice.total_amount || invoice.amount), totalsX + 50, yPosition);

  // Payment History (if any)
  if (invoice.payment_records && invoice.payment_records.length > 0) {
    yPosition += 20;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor('#000000');
    doc.text('Payment History:', margin, yPosition);
    yPosition += 10;
    
    const paymentData = invoice.payment_records.map(payment => [
      format(new Date(payment.payment_date), 'dd/MM/yyyy'),
      payment.payment_method,
      formatCurrency(payment.payment_amount),
      payment.transaction_id || '-'
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Date', 'Method', 'Amount', 'Transaction ID']],
      body: paymentData,
      theme: 'striped',
      headStyles: {
        fillColor: '#f3f4f6',
        textColor: '#000000',
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
    doc.setTextColor('#000000');
    doc.text('Notes:', margin, yPosition);
    yPosition += 8;
    
    doc.setFont(undefined, 'normal');
    doc.setTextColor(grayColor);
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin, yPosition);
  }

  // Footer
  const footerY = doc.internal.pageSize.height - 30;
  doc.setFontSize(8);
  doc.setTextColor(grayColor);
  doc.text('Thank you for your business!', margin, footerY);
  doc.text(`Generated on ${format(new Date(), 'dd/MM/yyyy')}`, pageWidth - margin - 60, footerY);

  // Download the PDF
  doc.save(`Invoice-${invoice.invoice_number}.pdf`);
};
