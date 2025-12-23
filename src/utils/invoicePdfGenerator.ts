
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { EnhancedClientBilling } from '@/hooks/useEnhancedClientBilling';
import { formatCurrency } from './currencyFormatter';
import { groupLineItemsByWeek, formatVisitDate } from './invoiceWeekGrouping';

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

// Format duration from decimal hours to readable format (e.g., 0.5 -> "30m", 1.25 -> "1h 15m")
const formatDurationFromHours = (hours: number): string => {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return '0m';
};

export interface InvoiceExpenseEntryForPdf {
  id: string;
  expense_type_name: string;
  date: string | null;
  amount: number;
  description: string | null;
  staff_name: string | null;
  booking_reference?: string | null;
}

export interface InvoiceExtraTimeEntryForPdf {
  id: string;
  work_date: string;
  extra_time_minutes: number;
  total_cost: number;
  reason: string | null;
  staff_name?: string | null;
  booking_id?: string | null;
}

export interface InvoiceCancelledBookingForPdf {
  id: string;
  start_time: string;
  cancellation_reason: string | null;
  staff_name?: string | null;
  staff_payment_amount: number | null;
}

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
  expenseEntries?: InvoiceExpenseEntryForPdf[];
  extraTimeEntries?: InvoiceExtraTimeEntryForPdf[];
  cancelledBookings?: InvoiceCancelledBookingForPdf[];
}

export const generateInvoicePDF = (data: InvoicePdfData) => {
  try {
    console.log('Starting PDF generation with data:', data);
    
    const { invoice, clientName, clientAddress, clientEmail, clientPhone, organizationInfo, expenseEntries = [], extraTimeEntries = [], cancelledBookings = [] } = data;
    
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

    // ===== HEADER SECTION (Logo left, Company details right-aligned) =====
    const logoWidth = 40;
    const logoHeight = 40;
    const headerStartY = yPosition;
    const rightAlignX = pageWidth - margin;

    // Add logo on the LEFT
    if (organizationInfo.logoBase64) {
      try {
        const getImageFormat = (base64: string): 'PNG' | 'JPEG' | 'GIF' => {
          if (base64.includes('data:image/jpeg') || base64.includes('data:image/jpg')) return 'JPEG';
          if (base64.includes('data:image/gif')) return 'GIF';
          return 'PNG';
        };
        const imgFormat = getImageFormat(organizationInfo.logoBase64);
        doc.addImage(organizationInfo.logoBase64, imgFormat, margin, yPosition - 5, logoWidth, logoHeight);
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }
    }

    // Company details on the RIGHT (right-aligned)
    let rightYPos = headerStartY;

    // Company name (bold, larger) - right aligned
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkBlueRgb[0], darkBlueRgb[1], darkBlueRgb[2]);
    doc.text(organizationInfo.name, rightAlignX, rightYPos, { align: 'right' });
    rightYPos += 6;

    // Company address - right aligned
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(grayRgb[0], grayRgb[1], grayRgb[2]);
    if (organizationInfo.address) {
      const addressLines = doc.splitTextToSize(organizationInfo.address, 80);
      addressLines.forEach((line: string) => {
        doc.text(line, rightAlignX, rightYPos, { align: 'right' });
        rightYPos += 4;
      });
    }

    // Email - right aligned
    if (organizationInfo.email) {
      doc.text(`Email: ${organizationInfo.email}`, rightAlignX, rightYPos, { align: 'right' });
      rightYPos += 4;
    }

    // Phone - right aligned
    if (organizationInfo.phone) {
      doc.text(`Tel: ${organizationInfo.phone}`, rightAlignX, rightYPos, { align: 'right' });
      rightYPos += 4;
    }

    // Website (if available) - right aligned
    if (organizationInfo.website) {
      doc.text(`Web: ${organizationInfo.website}`, rightAlignX, rightYPos, { align: 'right' });
      rightYPos += 4;
    }

    // Registration number (if available) - right aligned
    if (organizationInfo.registrationNumber) {
      doc.text(`Reg No: ${organizationInfo.registrationNumber}`, rightAlignX, rightYPos, { align: 'right' });
      rightYPos += 4;
    }

    // Ensure we're past both the logo height and company details
    yPosition = Math.max(rightYPos + 5, headerStartY + logoHeight + 5);

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

    // ===== LINE ITEMS TABLE - GROUPED BY WEEK =====
    
    // Determine if invoice has VAT at the invoice level - use stored value
    const invoiceHasVat = invoice.vat_amount != null && invoice.vat_amount > 0;
    const storedVatAmount = invoice.vat_amount || 0;
    
    // Calculate net subtotal first to determine VAT proportion per line
    const rawNetSubtotal = invoice.line_items?.reduce((sum, item) => {
      const unitPrice = item.unit_price || 0;
      const quantity = item.quantity || 1;
      return sum + (unitPrice * quantity);
    }, 0) || 0;
    
    // Use stored invoice values for totals
    const netSubtotal = invoice.net_amount || rawNetSubtotal;
    const vatTotal = storedVatAmount;
    const servicesGrossTotal = invoice.total_amount || (netSubtotal + vatTotal);

    // Group line items by week
    const weekGroups = groupLineItemsByWeek(invoice.line_items || []);
    
    // Build dynamic headers based on whether VAT applies
    const tableHeaders = invoiceHasVat 
      ? [['Date', 'Service', 'Rate (£)', 'Duration', 'Net (£)', 'VAT (£)', 'Total (£)']]
      : [['Date', 'Service', 'Rate (£)', 'Duration', 'Net (£)', 'Total (£)']];
    
    const columnStyles = invoiceHasVat ? {
      0: { cellWidth: 28 }, // Date
      1: { cellWidth: 48 }, // Service
      2: { halign: 'right' as const, cellWidth: 20 }, // Rate
      3: { halign: 'center' as const, cellWidth: 18 }, // Duration
      4: { halign: 'right' as const, cellWidth: 20 }, // Net
      5: { halign: 'right' as const, cellWidth: 20 }, // VAT
      6: { halign: 'right' as const, cellWidth: 22, fontStyle: 'bold' as const } // Total
    } : {
      0: { cellWidth: 30 }, // Date
      1: { cellWidth: 60 }, // Service (wider when no VAT column)
      2: { halign: 'right' as const, cellWidth: 25 }, // Rate
      3: { halign: 'center' as const, cellWidth: 20 }, // Duration
      4: { halign: 'right' as const, cellWidth: 25 }, // Net
      5: { halign: 'right' as const, cellWidth: 25, fontStyle: 'bold' as const } // Total
    };

    // Render each week as a separate section
    weekGroups.forEach((week, weekIndex) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = margin;
      }

      // Week Header (blue background)
      doc.setFillColor(lightBlueRgb[0], lightBlueRgb[1], lightBlueRgb[2]);
      doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 8, 1, 1, 'F');
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(darkBlueRgb[0], darkBlueRgb[1], darkBlueRgb[2]);
      doc.text(week.weekLabel, margin + 4, yPosition + 5.5);
      yPosition += 10;
      
      // Prepare week table data
      const weekTableData = week.items.map(item => {
        const unitPrice = item.unit_price || 0;
        const quantity = item.quantity || 1;
        const netAmount = unitPrice * quantity;
        
        // Calculate proportional VAT from stored invoice-level VAT
        const vatAmount = invoiceHasVat && rawNetSubtotal > 0
          ? (netAmount / rawNetSubtotal) * storedVatAmount
          : 0;
        
        // Format duration from quantity (hours)
        const totalMinutes = Math.round(quantity * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        const durationStr = h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `${h}h` : `${m}m`;
        
        const row = [
          formatVisitDate(item.visit_date),
          item.description || 'Service',
          unitPrice.toFixed(2),
          durationStr,
          netAmount.toFixed(2),
        ];
        if (invoiceHasVat) {
          row.push(vatAmount.toFixed(2));
        }
        row.push((netAmount + vatAmount).toFixed(2));
        return row;
      });

      // Week Line Items Table
      autoTable(doc, {
        startY: yPosition,
        head: tableHeaders,
        body: weekTableData,
        theme: 'plain',
        headStyles: {
          fillColor: [245, 245, 245],
          textColor: darkGrayRgb,
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 2
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [55, 65, 81],
          cellPadding: 2
        },
        columnStyles,
        margin: { left: margin, right: margin },
        didDrawCell: (data) => {
          if (data.section === 'body') {
            doc.setDrawColor(240, 240, 240);
            doc.setLineWidth(0.1);
          }
        }
      });

      yPosition = (doc as any).lastAutoTable?.finalY + 2 || yPosition + 30;
      
      // Week Summary Row
      const weekVat = invoiceHasVat && rawNetSubtotal > 0
        ? (week.weekSubtotal / rawNetSubtotal) * storedVatAmount
        : 0;
      
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 7, 'F');
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(grayRgb[0], grayRgb[1], grayRgb[2]);
      doc.text(`Total Visits: ${week.visitCount}`, margin + 4, yPosition + 4.5);
      
      doc.setFont(undefined, 'bold');
      const weekTotalText = invoiceHasVat 
        ? `Week ${weekIndex + 1} Subtotal: £${week.weekSubtotal.toFixed(2)} (+ £${weekVat.toFixed(2)} VAT)`
        : `Week ${weekIndex + 1} Subtotal: £${week.weekSubtotal.toFixed(2)}`;
      doc.text(weekTotalText, pageWidth - margin - 4, yPosition + 4.5, { align: 'right' });
      
      yPosition += 12;
    });

    yPosition += 3;

    // ===== SERVICES SUMMARY (Subtotal, VAT, Total) =====
    const summaryBoxWidth = 85;
    const summaryBoxX = pageWidth - margin - summaryBoxWidth;
    
    // Subtotal (Net)
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(grayRgb[0], grayRgb[1], grayRgb[2]);
    doc.text('Subtotal (Net):', summaryBoxX, yPosition);
    doc.text(`£${netSubtotal.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 5;

    // VAT (20%) - Only show if invoice has VAT
    if (invoiceHasVat) {
      doc.text('VAT (20%):', summaryBoxX, yPosition);
      doc.text(`£${vatTotal.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 5;
    }

    // Divider line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(summaryBoxX, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;

    // Services Total
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkBlueRgb[0], darkBlueRgb[1], darkBlueRgb[2]);
    doc.text('Services Total:', summaryBoxX, yPosition);
    doc.text(`£${(invoice.total_amount || servicesGrossTotal).toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 12;

    // Track services total for grand total calculation
    const servicesTotal = invoice.total_amount || servicesGrossTotal;

    // ===== ADDITIONAL EXPENSES SECTION =====
    let expensesTotal = 0;
    if (expenseEntries && expenseEntries.length > 0) {
      // Add section header
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(darkGrayRgb[0], darkGrayRgb[1], darkGrayRgb[2]);
      doc.text('Additional Expenses', margin, yPosition);
      yPosition += 8;

      // Prepare expense table data
      const expenseTableData = expenseEntries.map(expense => {
        expensesTotal += expense.amount;
        return [
          expense.date ? formatDateSafe(expense.date) : '-',
          expense.expense_type_name || 'Expense',
          expense.description || '-',
          expense.booking_reference || '-',
          expense.amount.toFixed(2)
        ];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [['Date', 'Type', 'Description', 'Reference', 'Amount (£)']],
        body: expenseTableData,
        theme: 'plain',
        headStyles: {
          fillColor: [254, 243, 199], // Amber-100
          textColor: [180, 83, 9], // Amber-700
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
          0: { cellWidth: 25 }, // Date
          1: { cellWidth: 35 }, // Type
          2: { cellWidth: 60 }, // Description
          3: { cellWidth: 30 }, // Reference
          4: { halign: 'right', cellWidth: 25, fontStyle: 'bold' } // Amount
        },
        margin: { left: margin, right: margin },
      });

      yPosition = (doc as any).lastAutoTable?.finalY + 5 || yPosition + 30;

      // Expenses subtotal
      const expensesTotalBoxWidth = 70;
      const expensesTotalBoxX = pageWidth - margin - expensesTotalBoxWidth;
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(grayRgb[0], grayRgb[1], grayRgb[2]);
      doc.text('Expenses Subtotal:', expensesTotalBoxX, yPosition);
      doc.setFont(undefined, 'bold');
      doc.text(`£${expensesTotal.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
      
      yPosition += 10;
    }

    // ===== EXTRA TIME CHARGES SECTION =====
    let extraTimeTotal = 0;
    if (extraTimeEntries && extraTimeEntries.length > 0) {
      // Add section header
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(darkGrayRgb[0], darkGrayRgb[1], darkGrayRgb[2]);
      doc.text('Extra Time Charges', margin, yPosition);
      yPosition += 8;

      // Prepare extra time table data
      const extraTimeTableData = extraTimeEntries.map(record => {
        extraTimeTotal += record.total_cost;
        const hours = Math.floor(record.extra_time_minutes / 60);
        const mins = record.extra_time_minutes % 60;
        const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        
        return [
          record.work_date ? formatDateSafe(record.work_date) : '-',
          durationStr,
          record.reason || '-',
          record.staff_name || '-',
          record.total_cost.toFixed(2)
        ];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [['Date', 'Duration', 'Reason', 'Staff', 'Amount (£)']],
        body: extraTimeTableData,
        theme: 'plain',
        headStyles: {
          fillColor: [219, 234, 254], // Blue-100
          textColor: [29, 78, 216], // Blue-700
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
          0: { cellWidth: 25 }, // Date
          1: { cellWidth: 25 }, // Duration
          2: { cellWidth: 60 }, // Reason
          3: { cellWidth: 40 }, // Staff
          4: { halign: 'right', cellWidth: 25, fontStyle: 'bold' } // Amount
        },
        margin: { left: margin, right: margin },
      });

      yPosition = (doc as any).lastAutoTable?.finalY + 5 || yPosition + 30;

      // Extra time subtotal
      const extraTimeTotalBoxWidth = 70;
      const extraTimeTotalBoxX = pageWidth - margin - extraTimeTotalBoxWidth;
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(grayRgb[0], grayRgb[1], grayRgb[2]);
      doc.text('Extra Time Subtotal:', extraTimeTotalBoxX, yPosition);
      doc.setFont(undefined, 'bold');
      doc.text(`£${extraTimeTotal.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
      
      yPosition += 10;
    }

    // ===== CANCELLED BOOKINGS SECTION =====
    let cancelledBookingFees = 0;
    if (cancelledBookings && cancelledBookings.length > 0) {
      // Add section header
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(153, 27, 27); // Red-800
      doc.text('Cancelled Booking Fees', margin, yPosition);
      yPosition += 8;

      // Prepare cancelled bookings table data
      const cancelledTableData = cancelledBookings.map(booking => {
        const feeAmount = booking.staff_payment_amount || 0;
        cancelledBookingFees += feeAmount;
        return [
          booking.start_time ? formatDateSafe(booking.start_time) : '-',
          booking.staff_name || '-',
          booking.cancellation_reason || 'No reason provided',
          feeAmount.toFixed(2)
        ];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [['Date', 'Staff', 'Reason', 'Fee (£)']],
        body: cancelledTableData,
        theme: 'plain',
        headStyles: {
          fillColor: [254, 226, 226], // Red-100
          textColor: [153, 27, 27], // Red-800
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
          0: { cellWidth: 30 }, // Date
          1: { cellWidth: 40 }, // Staff
          2: { cellWidth: 80 }, // Reason
          3: { halign: 'right', cellWidth: 25, fontStyle: 'bold' } // Fee
        },
        margin: { left: margin, right: margin },
      });

      yPosition = (doc as any).lastAutoTable?.finalY + 5 || yPosition + 30;

      // Cancelled bookings subtotal
      const cancelledTotalBoxWidth = 70;
      const cancelledTotalBoxX = pageWidth - margin - cancelledTotalBoxWidth;
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(grayRgb[0], grayRgb[1], grayRgb[2]);
      doc.text('Cancellation Fees Subtotal:', cancelledTotalBoxX, yPosition);
      doc.setFont(undefined, 'bold');
      doc.text(`£${cancelledBookingFees.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
      
      yPosition += 10;
    }

    // ===== COMPREHENSIVE INVOICE SUMMARY SECTION =====
    yPosition += 5;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkGrayRgb[0], darkGrayRgb[1], darkGrayRgb[2]);
    doc.text('Invoice Total Summary', margin, yPosition);
    yPosition += 10;

    const summaryX = pageWidth - margin - 100;
    const valueX = pageWidth - margin;
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(grayRgb[0], grayRgb[1], grayRgb[2]);

    // Service Charges
    doc.text('Service Charges:', summaryX, yPosition);
    doc.text(`£${servicesTotal.toFixed(2)}`, valueX, yPosition, { align: 'right' });
    yPosition += 6;

    // Additional Expenses (if any)
    if (expensesTotal > 0) {
      doc.text('Additional Expenses:', summaryX, yPosition);
      doc.text(`£${expensesTotal.toFixed(2)}`, valueX, yPosition, { align: 'right' });
      yPosition += 6;
    }

    // Extra Time Charges (if any)
    if (extraTimeTotal > 0) {
      doc.text('Extra Time Charges:', summaryX, yPosition);
      doc.text(`£${extraTimeTotal.toFixed(2)}`, valueX, yPosition, { align: 'right' });
      yPosition += 6;
    }

    // Cancelled Booking Fees (if any)
    if (cancelledBookingFees > 0) {
      doc.text('Cancelled Booking Fees:', summaryX, yPosition);
      doc.text(`£${cancelledBookingFees.toFixed(2)}`, valueX, yPosition, { align: 'right' });
      yPosition += 6;
    }

    // Divider line before grand total
    yPosition += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(summaryX, yPosition, valueX, yPosition);
    yPosition += 6;

    // Grand Total box
    const grandTotal = servicesTotal + expensesTotal + extraTimeTotal + cancelledBookingFees;
    const totalBoxWidth = 100;
    const totalBoxHeight = 14;
    const totalBoxX = pageWidth - margin - totalBoxWidth;
    
    doc.setFillColor(lightBlueRgb[0], lightBlueRgb[1], lightBlueRgb[2]);
    doc.roundedRect(totalBoxX, yPosition, totalBoxWidth, totalBoxHeight, 2, 2, 'F');
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkBlueRgb[0], darkBlueRgb[1], darkBlueRgb[2]);
    doc.text('GRAND TOTAL:', totalBoxX + 5, yPosition + 9);
    doc.text(formatCurrency(invoice.total_amount || grandTotal), totalBoxX + totalBoxWidth - 5, yPosition + 9, { align: 'right' });

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
