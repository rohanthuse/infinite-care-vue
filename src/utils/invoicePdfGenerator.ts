
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
  clientPhone?: string;
  organizationInfo: {
    name: string;
    address: string;
    email: string;
    phone?: string;
    website?: string;
    registrationNumber?: string;
    logoBase64?: string | null;
  };
}

export const generateInvoicePDF = (data: InvoicePdfData) => {
  try {
    console.log('Starting PDF generation with data:', data);
    
    const { invoice, clientName, clientAddress, clientEmail, clientPhone, organizationInfo } = data;
    
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
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPosition = margin;

    // Colors (Blue theme matching HTML template)
    const blueRgb: [number, number, number] = [59, 130, 246]; // #3b82f6
    const darkBlueRgb: [number, number, number] = [29, 78, 216]; // #1d4ed8
    const lightBlueRgb: [number, number, number] = [219, 234, 254]; // #dbeafe
    const grayRgb: [number, number, number] = [107, 114, 128]; // #6b7280
    const darkGrayRgb: [number, number, number] = [31, 41, 55]; // #1f2937

    // ===== HEADER SECTION (Two-column: Logo left, Company details right) =====
    const logoWidth = 35;
    const logoHeight = 35;
    let headerStartY = yPosition;
    let textStartX = margin;

    // Add logo if available
    if (organizationInfo.logoBase64) {
      try {
        const getImageFormat = (base64: string): 'PNG' | 'JPEG' | 'GIF' => {
          if (base64.includes('data:image/jpeg') || base64.includes('data:image/jpg')) return 'JPEG';
          if (base64.includes('data:image/gif')) return 'GIF';
          return 'PNG';
        };
        const format = getImageFormat(organizationInfo.logoBase64);
        doc.addImage(organizationInfo.logoBase64, format, margin, yPosition - 5, logoWidth, logoHeight);
        textStartX = margin + logoWidth + 10; // Move text to the right of logo
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }
    }

    // Company name (bold, larger)
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkGrayRgb[0], darkGrayRgb[1], darkGrayRgb[2]);
    doc.text(organizationInfo.name, textStartX, yPosition + 2);
    yPosition += 7;

    // Company address
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(grayRgb[0], grayRgb[1], grayRgb[2]);
    if (organizationInfo.address) {
      const addressLines = doc.splitTextToSize(organizationInfo.address, pageWidth - textStartX - margin - 10);
      addressLines.forEach((line: string) => {
        doc.text(line, textStartX, yPosition);
        yPosition += 4;
      });
    }

    // Contact line (Email | Phone)
    const contactParts = [];
    if (organizationInfo.email) contactParts.push(`Email: ${organizationInfo.email}`);
    if (organizationInfo.phone) contactParts.push(`Tel: ${organizationInfo.phone}`);
    if (contactParts.length > 0) {
      doc.text(contactParts.join(' | '), textStartX, yPosition);
      yPosition += 4;
    }

    // Website (if available)
    if (organizationInfo.website) {
      doc.text(`Web: ${organizationInfo.website}`, textStartX, yPosition);
      yPosition += 4;
    }

    // Registration number (if available)
    if (organizationInfo.registrationNumber) {
      doc.text(`Reg No: ${organizationInfo.registrationNumber}`, textStartX, yPosition);
      yPosition += 4;
    }

    // Ensure we're past the logo height
    yPosition = Math.max(yPosition, headerStartY + logoHeight + 5);

    // Header border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // ===== INVOICE TITLE (Centered, Blue) =====
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(blueRgb[0], blueRgb[1], blueRgb[2]);
    const invoiceTitleWidth = doc.getTextWidth('INVOICE');
    doc.text('INVOICE', (pageWidth - invoiceTitleWidth) / 2, yPosition);
    yPosition += 12;

    // ===== DATE RANGE BANNER (Blue gradient background) =====
    const bannerHeight = 10;
    doc.setFillColor(blueRgb[0], blueRgb[1], blueRgb[2]);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, bannerHeight, 2, 2, 'F');
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(255, 255, 255);
    const dateRangeText = `From: ${formatDateSafe(invoice.start_date || invoice.invoice_date)} | Until: ${formatDateSafe(invoice.end_date || invoice.due_date)}`;
    const dateRangeWidth = doc.getTextWidth(dateRangeText);
    doc.text(dateRangeText, (pageWidth - dateRangeWidth) / 2, yPosition + 6.5);
    yPosition += bannerHeight + 12;

    // ===== TWO-COLUMN LAYOUT: Invoice Info & Client Info =====
    const leftColX = margin;
    const rightColX = pageWidth - margin;
    const colYStart = yPosition;

    // LEFT COLUMN - Invoice Details
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('Invoice Number: ', leftColX, colYStart);
    doc.setFont(undefined, 'normal');
    doc.text(invoice.invoice_number, leftColX + 35, colYStart);

    doc.setFont(undefined, 'bold');
    doc.text('Invoice Date: ', leftColX, colYStart + 5);
    doc.setFont(undefined, 'normal');
    doc.text(formatDateSafe(invoice.invoice_date), leftColX + 35, colYStart + 5);

    doc.setFont(undefined, 'bold');
    doc.text('Due Date: ', leftColX, colYStart + 10);
    doc.setFont(undefined, 'normal');
    doc.text(formatDateSafe(invoice.due_date), leftColX + 35, colYStart + 10);

    // RIGHT COLUMN - Client Details (Right-aligned)
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkGrayRgb[0], darkGrayRgb[1], darkGrayRgb[2]);
    doc.text(clientName || 'Client', rightColX, colYStart, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(grayRgb[0], grayRgb[1], grayRgb[2]);
    if (clientAddress) {
      doc.text(clientAddress, rightColX, colYStart + 5, { align: 'right' });
    }
    if (clientPhone) {
      doc.text(`Contact: ${clientPhone}`, rightColX, colYStart + 10, { align: 'right' });
    }

    yPosition = colYStart + 20;

    // ===== LINE ITEMS TABLE (With separate VAT column) =====
    const tableData = invoice.line_items?.map(item => {
      const basePrice = item.unit_price || 0;
      const quantity = item.quantity || 1;
      const lineTotal = item.line_total || (basePrice * quantity);
      
      // Calculate VAT (assuming 20% if not specified, or calculate from line_total)
      const vatRate = 0.20; // 20% VAT
      const priceWithoutVat = lineTotal / (1 + vatRate);
      const vatAmount = lineTotal - priceWithoutVat;

      // Format the date with day name and week number
      const serviceDate = item.visit_date ? new Date(item.visit_date) : new Date();
      const dayName = format(serviceDate, 'EEEE');
      const weekNum = format(serviceDate, 'w');
      const formattedDate = `${dayName} - ${formatDateSafe(serviceDate)} (Week ${weekNum})`;

      return [
        formattedDate,
        item.description || 'Service',
        priceWithoutVat.toFixed(2),
        vatAmount.toFixed(2),
        lineTotal.toFixed(2)
      ];
    }) || [];

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Service', 'Price/Rate (£)', 'VAT (£)', 'Total (£)']],
      body: tableData,
      theme: 'plain',
      headStyles: {
        fillColor: lightBlueRgb,
        textColor: darkBlueRgb,
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [55, 65, 81],
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 55 }, // Date
        1: { cellWidth: 60 }, // Service
        2: { halign: 'right', cellWidth: 25 }, // Price
        3: { halign: 'right', cellWidth: 20 }, // VAT
        4: { halign: 'right', cellWidth: 25, fontStyle: 'bold' } // Total
      },
      margin: { left: margin, right: margin },
      didDrawCell: (data) => {
        // Add subtle borders
        if (data.section === 'body') {
          doc.setDrawColor(240, 240, 240);
          doc.setLineWidth(0.1);
        }
      }
    });

    yPosition = (doc as any).lastAutoTable?.finalY + 10 || yPosition + 50;

    // ===== GRAND TOTAL SECTION (Blue background box) =====
    const totalBoxWidth = 70;
    const totalBoxHeight = 12;
    const totalBoxX = pageWidth - margin - totalBoxWidth;
    
    doc.setFillColor(lightBlueRgb[0], lightBlueRgb[1], lightBlueRgb[2]);
    doc.roundedRect(totalBoxX, yPosition, totalBoxWidth, totalBoxHeight, 2, 2, 'F');
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkBlueRgb[0], darkBlueRgb[1], darkBlueRgb[2]);
    doc.text('Grand Total:', totalBoxX + 5, yPosition + 8);
    doc.text(formatCurrency(invoice.total_amount || invoice.amount || 0), totalBoxX + totalBoxWidth - 5, yPosition + 8, { align: 'right' });

    yPosition += totalBoxHeight + 15;

    // ===== TERMS & CONDITIONS SECTION =====
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkGrayRgb[0], darkGrayRgb[1], darkGrayRgb[2]);
    doc.text('Terms & Conditions', margin, yPosition);
    yPosition += 7;

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(grayRgb[0], grayRgb[1], grayRgb[2]);
    const termsText = `Payment is due within ${invoice.payment_terms || '15 days'} from the invoice date. Late payments may be subject to additional charges. Please make payments via bank transfer or the payment methods specified in your account section.`;
    const splitTerms = doc.splitTextToSize(termsText, pageWidth - 2 * margin);
    doc.text(splitTerms, margin, yPosition);

    // ===== FOOTER =====
    const footerY = pageHeight - 20;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setFontSize(8);
    doc.setTextColor(grayRgb[0], grayRgb[1], grayRgb[2]);
    const thankYouText = 'Thank you for choosing our healthcare services!';
    const thankYouWidth = doc.getTextWidth(thankYouText);
    doc.text(thankYouText, (pageWidth - thankYouWidth) / 2, footerY);

    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    const copyrightText = `© ${new Date().getFullYear()} ${organizationInfo.name}. All rights reserved.`;
    const copyrightWidth = doc.getTextWidth(copyrightText);
    doc.text(copyrightText, (pageWidth - copyrightWidth) / 2, footerY + 4);

    // Download the PDF
    console.log('Saving PDF document...');
    doc.save(`Invoice-${invoice.invoice_number}.pdf`);
    console.log('PDF generated successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
