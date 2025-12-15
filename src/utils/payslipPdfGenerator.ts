import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface PayrollRecord {
  id: string;
  staff_id: string;
  pay_period_start: string;
  pay_period_end: string;
  regular_hours: number;
  overtime_hours: number;
  hourly_rate: number;
  overtime_rate?: number;
  basic_salary: number;
  overtime_pay: number;
  bonus: number;
  gross_pay: number;
  tax_deduction: number;
  ni_deduction: number;
  pension_deduction: number;
  other_deductions: number;
  net_pay: number;
  payment_status: string;
  payment_method: string;
  payment_date?: string;
  payment_reference?: string;
  notes?: string;
  staff?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface OrganizationInfo {
  name: string;
  address: string;
  email: string;
  phone?: string;
  logoBase64?: string | null;
  registrationNumber?: string;
}

export interface PayslipBookingDetail {
  bookingId: string;
  date: string;
  shiftTime: string;
  clientName: string;
  serviceName: string;
  duration: string;
  hoursWorked: number;
  rate: number;
  amount: number;
  status: string;
}

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

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
};

// Payment method labels
const paymentMethodLabels: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  cheque: "Cheque",
  other: "Other"
};

export const exportPayrollPayslip = (
  record: PayrollRecord, 
  organizationInfo?: OrganizationInfo,
  bookingDetails?: PayslipBookingDetail[]
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let yPosition = margin;

  // Colors (Blue theme matching Invoice PDF)
  const blueRgb: [number, number, number] = [59, 130, 246]; // #3b82f6
  const darkBlueRgb: [number, number, number] = [29, 78, 216]; // #1d4ed8
  const lightBlueRgb: [number, number, number] = [219, 234, 254]; // #dbeafe
  const grayRgb: [number, number, number] = [107, 114, 128]; // #6b7280
  const darkGrayRgb: [number, number, number] = [31, 41, 55]; // #1f2937
  const lightRedRgb: [number, number, number] = [254, 226, 226]; // #fee2e2
  const darkRedRgb: [number, number, number] = [220, 38, 38]; // #dc2626
  const greenRgb: [number, number, number] = [34, 197, 94]; // #22c55e

  // Employee details
  const employeeName = record.staff 
    ? `${record.staff.first_name} ${record.staff.last_name}`
    : 'Unknown Employee';
  const employeeEmail = record.staff?.email || 'N/A';

  // Calculate totals
  const totalEarnings = record.gross_pay;
  const totalDeductions = 
    record.tax_deduction + 
    record.ni_deduction + 
    record.pension_deduction + 
    record.other_deductions;

  // ===== HEADER SECTION (Logo left, Company details right-aligned) =====
  const logoWidth = 40;
  const logoHeight = 40;
  const headerStartY = yPosition;
  const rightAlignX = pageWidth - margin;

  // Add logo on the LEFT
  if (organizationInfo?.logoBase64) {
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
  doc.text(organizationInfo?.name || 'Company Name', rightAlignX, rightYPos, { align: 'right' });
  rightYPos += 6;

  // Company address - right aligned
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(grayRgb[0], grayRgb[1], grayRgb[2]);
  if (organizationInfo?.address) {
    const addressLines = doc.splitTextToSize(organizationInfo.address, 80);
    addressLines.forEach((line: string) => {
      doc.text(line, rightAlignX, rightYPos, { align: 'right' });
      rightYPos += 4;
    });
  }

  // Email - right aligned
  if (organizationInfo?.email) {
    doc.text(`Email: ${organizationInfo.email}`, rightAlignX, rightYPos, { align: 'right' });
    rightYPos += 4;
  }

  // Phone - right aligned
  if (organizationInfo?.phone) {
    doc.text(`Tel: ${organizationInfo.phone}`, rightAlignX, rightYPos, { align: 'right' });
    rightYPos += 4;
  }

  // Registration number (if available) - right aligned
  if (organizationInfo?.registrationNumber) {
    doc.text(`Reg No: ${organizationInfo.registrationNumber}`, rightAlignX, rightYPos, { align: 'right' });
    rightYPos += 4;
  }

  // Ensure we're past both the logo height and company details
  yPosition = Math.max(rightYPos + 5, headerStartY + logoHeight + 5);

  // Header border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5; // Reduced from 10 to 5 for less vertical spacing

  // ===== PAYSLIP TITLE (Centered, Blue) =====
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(blueRgb[0], blueRgb[1], blueRgb[2]);
  const titleText = 'PAYSLIP';
  const titleWidth = doc.getTextWidth(titleText);
  doc.text(titleText, (pageWidth - titleWidth) / 2, yPosition);
  yPosition += 10; // Reduced from 12

  // ===== PAY PERIOD BANNER (Blue gradient background) =====
  const bannerHeight = 10;
  doc.setFillColor(blueRgb[0], blueRgb[1], blueRgb[2]);
  doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, bannerHeight, 2, 2, 'F');
  
  const periodMonth = format(new Date(record.pay_period_start), 'MMMM yyyy');
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(255, 255, 255);
  const bannerText = `${periodMonth} Pay Statement`;
  const bannerTextWidth = doc.getTextWidth(bannerText);
  doc.text(bannerText, (pageWidth - bannerTextWidth) / 2, yPosition + 6.5);
  yPosition += bannerHeight + 10; // Reduced from 12

  // ===== TWO-COLUMN LAYOUT: Employee Info & Payroll Info =====
  const leftColX = margin;
  const rightColX = pageWidth - margin;
  const colYStart = yPosition;

  // LEFT COLUMN - Employee Details (without Staff ID)
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text('Employee Name: ', leftColX, colYStart);
  doc.setFont(undefined, 'normal');
  doc.text(employeeName, leftColX + 32, colYStart);

  doc.setFont(undefined, 'bold');
  doc.text('Email: ', leftColX, colYStart + 5);
  doc.setFont(undefined, 'normal');
  doc.text(employeeEmail, leftColX + 32, colYStart + 5);

  // RIGHT COLUMN - Payroll Details (Right-aligned)
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(darkGrayRgb[0], darkGrayRgb[1], darkGrayRgb[2]);
  doc.text(`Pay Period: ${formatDateSafe(record.pay_period_start)} - ${formatDateSafe(record.pay_period_end)}`, rightColX, colYStart, { align: 'right' });

  doc.setFont(undefined, 'normal');
  doc.setTextColor(grayRgb[0], grayRgb[1], grayRgb[2]);
  doc.text(`Payment Date: ${record.payment_date ? formatDateSafe(record.payment_date) : 'Not set'}`, rightColX, colYStart + 5, { align: 'right' });
  doc.text(`Payment Method: ${paymentMethodLabels[record.payment_method] || record.payment_method}`, rightColX, colYStart + 10, { align: 'right' });
  if (record.payment_reference) {
    doc.text(`Ref: ${record.payment_reference}`, rightColX, colYStart + 15, { align: 'right' });
  }

  yPosition = colYStart + 20; // Reduced from 25

  // ===== BOOKING DETAILS TABLE (if available) =====
  if (bookingDetails && bookingDetails.length > 0) {
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkGrayRgb[0], darkGrayRgb[1], darkGrayRgb[2]);
    doc.text('BOOKING DETAILS', margin, yPosition);
    yPosition += 6;

    const bookingTableData = bookingDetails.map(booking => [
      booking.date,
      booking.shiftTime,
      booking.clientName.length > 15 ? booking.clientName.substring(0, 15) + '...' : booking.clientName,
      booking.serviceName.length > 12 ? booking.serviceName.substring(0, 12) + '...' : booking.serviceName,
      booking.duration,
      formatCurrency(booking.rate).replace('£', ''),
      formatCurrency(booking.amount).replace('£', ''),
      booking.status === 'cancelled' ? 'Paid' : ''
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Time', 'Client', 'Service', 'Hrs', 'Rate (£)', 'Amt (£)', '']],
      body: bookingTableData,
      theme: 'plain',
      headStyles: {
        fillColor: lightBlueRgb,
        textColor: darkBlueRgb,
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
      columnStyles: {
        0: { cellWidth: 20 }, // Date
        1: { cellWidth: 28 }, // Time
        2: { cellWidth: 28 }, // Client
        3: { cellWidth: 25 }, // Service
        4: { cellWidth: 15, halign: 'center' }, // Hrs
        5: { cellWidth: 18, halign: 'right' }, // Rate
        6: { cellWidth: 20, halign: 'right', fontStyle: 'bold' }, // Amount
        7: { cellWidth: 16, halign: 'center', textColor: grayRgb, fontStyle: 'italic' } // Status
      },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable?.finalY + 3 || yPosition + 40;

    // Booking Total Row
    const bookingTotal = bookingDetails.reduce((sum, b) => sum + b.amount, 0);
    doc.setFillColor(lightBlueRgb[0], lightBlueRgb[1], lightBlueRgb[2]);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 8, 1, 1, 'F');
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkBlueRgb[0], darkBlueRgb[1], darkBlueRgb[2]);
    doc.text('TOTAL BOOKINGS', margin + 5, yPosition + 5.5);
    doc.text(formatCurrency(bookingTotal), pageWidth - margin - 5, yPosition + 5.5, { align: 'right' });
    yPosition += 15;
  }

  // ===== EARNINGS TABLE (Invoice-style) =====
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(darkGrayRgb[0], darkGrayRgb[1], darkGrayRgb[2]);
  doc.text('EARNINGS', margin, yPosition);
  yPosition += 6;

  const earningsData = [
    ['Regular Pay', record.regular_hours.toString(), formatCurrency(record.hourly_rate).replace('£', ''), formatCurrency(record.basic_salary).replace('£', '')],
    ['Overtime Pay', record.overtime_hours.toString(), formatCurrency(record.overtime_rate || record.hourly_rate * 1.5).replace('£', ''), formatCurrency(record.overtime_pay).replace('£', '')],
    ['Bonus / Allowances', '-', '-', formatCurrency(record.bonus).replace('£', '')]
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Description', 'Hours', 'Rate (£)', 'Amount (£)']],
    body: earningsData,
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
      0: { cellWidth: 70 }, // Description
      1: { halign: 'center', cellWidth: 30 }, // Hours
      2: { halign: 'right', cellWidth: 35 }, // Rate
      3: { halign: 'right', cellWidth: 35, fontStyle: 'bold' } // Amount
    },
    margin: { left: margin, right: margin },
    didDrawCell: (data) => {
      if (data.section === 'body') {
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.1);
      }
    }
  });

  yPosition = (doc as any).lastAutoTable?.finalY + 3 || yPosition + 40;

  // Earnings Total Row
  doc.setFillColor(lightBlueRgb[0], lightBlueRgb[1], lightBlueRgb[2]);
  doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 8, 1, 1, 'F');
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(darkBlueRgb[0], darkBlueRgb[1], darkBlueRgb[2]);
  doc.text('TOTAL EARNINGS', margin + 5, yPosition + 5.5);
  doc.text(formatCurrency(totalEarnings), pageWidth - margin - 5, yPosition + 5.5, { align: 'right' });
  yPosition += 15;

  // ===== DEDUCTIONS TABLE (Invoice-style with red theme) =====
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(darkGrayRgb[0], darkGrayRgb[1], darkGrayRgb[2]);
  doc.text('DEDUCTIONS', margin, yPosition);
  yPosition += 6;

  const deductionsData = [
    ['Income Tax (PAYE)', formatCurrency(record.tax_deduction).replace('£', '')],
    ['National Insurance', formatCurrency(record.ni_deduction).replace('£', '')],
    ['Pension Contribution', formatCurrency(record.pension_deduction).replace('£', '')],
    ['Other Deductions', formatCurrency(record.other_deductions).replace('£', '')]
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Deduction', 'Amount (£)']],
    body: deductionsData,
    theme: 'plain',
    headStyles: {
      fillColor: lightRedRgb,
      textColor: darkRedRgb,
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
      0: { cellWidth: 100 }, // Description
      1: { halign: 'right', cellWidth: 70, fontStyle: 'bold' } // Amount
    },
    margin: { left: margin, right: margin },
    didDrawCell: (data) => {
      if (data.section === 'body') {
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.1);
      }
    }
  });

  yPosition = (doc as any).lastAutoTable?.finalY + 3 || yPosition + 35;

  // Footer reserved space - ensure content doesn't overlap
  const footerReservedY = pageHeight - 40;

  // Deductions Total Row
  doc.setFillColor(lightRedRgb[0], lightRedRgb[1], lightRedRgb[2]);
  doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 8, 1, 1, 'F');
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(darkRedRgb[0], darkRedRgb[1], darkRedRgb[2]);
  doc.text('TOTAL DEDUCTIONS', margin + 5, yPosition + 5.5);
  doc.text(`-${formatCurrency(totalDeductions)}`, pageWidth - margin - 5, yPosition + 5.5, { align: 'right' });
  yPosition += 12; // Reduced from 18

  // ===== PAYMENT SUMMARY (Right-aligned box) =====
  const summaryBoxWidth = 85;
  const summaryBoxX = pageWidth - margin - summaryBoxWidth;
  
  // Check if we have enough space before footer
  const summaryContentHeight = 35; // Approximate height needed for summary
  if (yPosition + summaryContentHeight > footerReservedY) {
    doc.addPage();
    yPosition = margin;
  }
  
  // Gross Pay
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(grayRgb[0], grayRgb[1], grayRgb[2]);
  doc.text('Total Earnings:', summaryBoxX, yPosition);
  doc.text(formatCurrency(totalEarnings), pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 5;

  // Total Deductions
  doc.text('Total Deductions:', summaryBoxX, yPosition);
  doc.setTextColor(darkRedRgb[0], darkRedRgb[1], darkRedRgb[2]);
  doc.text(`-${formatCurrency(totalDeductions)}`, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 5;

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(summaryBoxX, yPosition, pageWidth - margin, yPosition);
  yPosition += 6; // Reduced from 7

  // NET PAY Box (Highlighted)
  const netPayBoxHeight = 12;
  doc.setFillColor(lightBlueRgb[0], lightBlueRgb[1], lightBlueRgb[2]);
  doc.roundedRect(summaryBoxX, yPosition - 2, summaryBoxWidth, netPayBoxHeight, 2, 2, 'F');
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(darkBlueRgb[0], darkBlueRgb[1], darkBlueRgb[2]);
  doc.text('NET PAY:', summaryBoxX + 5, yPosition + 6);
  doc.text(formatCurrency(record.net_pay), pageWidth - margin - 5, yPosition + 6, { align: 'right' });
  
  yPosition += netPayBoxHeight + 10; // Reduced from 15

  // ===== NOTES SECTION (if available) =====
  if (record.notes) {
    // Check if notes would overlap with footer
    const notesHeight = 20; // Approximate
    if (yPosition + notesHeight > footerReservedY) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6; // Reduced from 8

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(darkGrayRgb[0], darkGrayRgb[1], darkGrayRgb[2]);
    doc.text('Notes', margin, yPosition);
    yPosition += 5; // Reduced from 6

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(grayRgb[0], grayRgb[1], grayRgb[2]);
    const splitNotes = doc.splitTextToSize(record.notes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin, yPosition);
  }

  // ===== FOOTER =====
  const footerY = pageHeight - 25;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  // System generated notice
  doc.setFontSize(8);
  doc.setTextColor(grayRgb[0], grayRgb[1], grayRgb[2]);
  const systemNotice = 'This is a system-generated payslip. For queries, please contact HR.';
  const systemNoticeWidth = doc.getTextWidth(systemNotice);
  doc.text(systemNotice, (pageWidth - systemNoticeWidth) / 2, footerY);

  // Generation date and page number
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, margin, footerY + 6);
  doc.text('Page 1 of 1', pageWidth - margin, footerY + 6, { align: 'right' });

  // Copyright
  doc.setFontSize(7);
  const copyrightText = `© ${new Date().getFullYear()} ${organizationInfo?.name || 'Company'}. All rights reserved.`;
  const copyrightWidth = doc.getTextWidth(copyrightText);
  doc.text(copyrightText, (pageWidth - copyrightWidth) / 2, footerY + 10);

  // Generate filename
  const periodStart = new Date(record.pay_period_start).toISOString().slice(0, 7); // YYYY-MM format
  const employeeNameForFile = employeeName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `payslip_${employeeNameForFile}_${periodStart}.pdf`;

  // Save the PDF
  doc.save(filename);
};
