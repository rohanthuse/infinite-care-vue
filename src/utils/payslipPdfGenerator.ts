import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

export const exportPayrollPayslip = (record: PayrollRecord): void => {
  const doc = new jsPDF();
  
  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  // Helper function to format dates
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  // Employee details
  const employeeName = record.staff 
    ? `${record.staff.first_name} ${record.staff.last_name}`
    : 'Unknown Employee';
  
  const employeeEmail = record.staff?.email || 'N/A';

  // Calculate total deductions
  const totalDeductions = 
    record.tax_deduction + 
    record.ni_deduction + 
    record.pension_deduction + 
    record.other_deductions;

  // Header
  doc.setFontSize(20);
  doc.text('PAYSLIP', 105, 20, { align: 'center' });
  
  // Company info (if available)
  doc.setFontSize(12);
  doc.text('Pay Period: ' + formatDate(record.pay_period_start) + ' - ' + formatDate(record.pay_period_end), 20, 35);
  
  // Employee information section
  doc.setFontSize(14);
  doc.text('Employee Information', 20, 50);
  doc.setFontSize(10);
  doc.text('Name: ' + employeeName, 20, 60);
  doc.text('Email: ' + employeeEmail, 20, 68);
  doc.text('Staff ID: ' + record.staff_id, 20, 76);
  
  // Payment information
  doc.text('Payment Date: ' + (record.payment_date ? formatDate(record.payment_date) : 'Not set'), 120, 60);
  doc.text('Payment Method: ' + record.payment_method, 120, 68);
  if (record.payment_reference) {
    doc.text('Payment Reference: ' + record.payment_reference, 120, 76);
  }

  // Earnings table
  const earningsData = [
    ['Regular Hours', record.regular_hours.toString(), formatCurrency(record.hourly_rate), formatCurrency(record.basic_salary)],
    ['Overtime Hours', record.overtime_hours.toString(), formatCurrency(record.overtime_rate || record.hourly_rate), formatCurrency(record.overtime_pay)],
    ['Bonus', '-', '-', formatCurrency(record.bonus)],
    ['GROSS PAY', '', '', formatCurrency(record.gross_pay)]
  ];

  (doc as any).autoTable({
    head: [['Description', 'Hours', 'Rate', 'Amount']],
    body: earningsData,
    startY: 90,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 9 },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    },
    didParseCell: function (data: any) {
      if (data.row.index === earningsData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 248, 255];
      }
    }
  });

  // Deductions table
  const deductionsData = [
    ['Income Tax', formatCurrency(record.tax_deduction)],
    ['National Insurance', formatCurrency(record.ni_deduction)],
    ['Pension Contribution', formatCurrency(record.pension_deduction)],
    ['Other Deductions', formatCurrency(record.other_deductions)],
    ['TOTAL DEDUCTIONS', formatCurrency(totalDeductions)]
  ];

  (doc as any).autoTable({
    head: [['Deduction', 'Amount']],
    body: deductionsData,
    startY: (doc as any).lastAutoTable.finalY + 15,
    theme: 'grid',
    headStyles: { fillColor: [231, 76, 60] },
    styles: { fontSize: 9 },
    columnStyles: {
      1: { halign: 'right' }
    },
    didParseCell: function (data: any) {
      if (data.row.index === deductionsData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [255, 240, 240];
      }
    }
  });

  // Summary section
  const summaryY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(12);
  doc.text('PAYMENT SUMMARY', 20, summaryY);
  
  doc.setFontSize(10);
  doc.text('Gross Pay:', 20, summaryY + 15);
  doc.text(formatCurrency(record.gross_pay), 100, summaryY + 15);
  
  doc.text('Total Deductions:', 20, summaryY + 25);
  doc.text('-' + formatCurrency(totalDeductions), 100, summaryY + 25);
  
  // Net pay with emphasis
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('NET PAY:', 20, summaryY + 40);
  doc.text(formatCurrency(record.net_pay), 100, summaryY + 40);
  doc.setFont(undefined, 'normal');

  // Notes section if available
  if (record.notes) {
    doc.setFontSize(10);
    doc.text('Notes:', 20, summaryY + 55);
    const splitNotes = doc.splitTextToSize(record.notes, 170);
    doc.text(splitNotes, 20, summaryY + 65);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text('Generated on: ' + new Date().toLocaleString('en-GB'), 20, pageHeight - 20);
  doc.text('Page 1 of 1', 170, pageHeight - 20);

  // Generate filename
  const periodStart = new Date(record.pay_period_start).toISOString().slice(0, 7); // YYYY-MM format
  const employeeNameForFile = employeeName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `payslip_${employeeNameForFile}_${periodStart}.pdf`;

  // Save the PDF
  doc.save(filename);
};