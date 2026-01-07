import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO, differenceInMinutes } from "date-fns";

// Med-Infinite brand colors
const BRAND_COLORS = {
  primary: [0, 83, 156] as [number, number, number],
  secondary: [46, 150, 208] as [number, number, number],
  accent: [100, 100, 100] as [number, number, number],
  light: [240, 240, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number]
};

export interface FutureBookingData {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientAddress?: string;
  serviceName?: string;
  status?: string;
}

export interface FutureBookingReportOptions {
  carerName: string;
  branchName: string;
  dateFrom: Date;
  dateTo: Date;
  bookings: FutureBookingData[];
}

/**
 * Generate a Future Booking Plan PDF report for carers
 */
export const generateFutureBookingPlanPDF = (options: FutureBookingReportOptions): void => {
  const { carerName, branchName, dateFrom, dateTo, bookings } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header background
  doc.setFillColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Organization name
  doc.setFontSize(20);
  doc.setTextColor(BRAND_COLORS.white[0], BRAND_COLORS.white[1], BRAND_COLORS.white[2]);
  doc.text("Med-Infinite", 20, 18);

  // Branch name (right side)
  doc.setFontSize(10);
  doc.text(branchName, pageWidth - 20, 15, { align: 'right' });
  
  // Generated date (right side)
  doc.setFontSize(8);
  doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, HH:mm")}`, pageWidth - 20, 22, { align: 'right' });

  // Report title
  let currentY = 58;
  doc.setFontSize(22);
  doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
  doc.text("FUTURE BOOKING PLAN", pageWidth / 2, currentY, { align: 'center' });

  // Decorative line
  currentY += 5;
  doc.setDrawColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 50, currentY, pageWidth / 2 + 50, currentY);

  // Date range
  currentY += 12;
  doc.setFontSize(11);
  doc.setTextColor(BRAND_COLORS.accent[0], BRAND_COLORS.accent[1], BRAND_COLORS.accent[2]);
  doc.text(
    `${format(dateFrom, "dd MMM yyyy")} - ${format(dateTo, "dd MMM yyyy")}`,
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );

  // Carer name info box
  currentY += 15;
  doc.setFillColor(BRAND_COLORS.light[0], BRAND_COLORS.light[1], BRAND_COLORS.light[2]);
  doc.roundedRect(20, currentY - 5, pageWidth - 40, 16, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
  doc.text(`Carer: ${carerName}`, 28, currentY + 5);

  currentY += 22;

  // Calculate duration helper
  const calculateDuration = (start: string, end: string): string => {
    try {
      const [startHour, startMin] = start.split(':').map(Number);
      const [endHour, endMin] = end.split(':').map(Number);
      const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      
      if (totalMinutes < 0) return 'N/A';
      
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else {
        return `${minutes}m`;
      }
    } catch {
      return 'N/A';
    }
  };

  // Prepare table data
  const tableColumns = ["Date", "Time", "Client Name", "Client Address", "Service", "Duration"];
  const tableRows = bookings.map(booking => {
    const bookingDate = booking.date ? format(parseISO(booking.date), "EEE, dd MMM") : 'N/A';
    const time = `${booking.startTime} - ${booking.endTime}`;
    const duration = calculateDuration(booking.startTime, booking.endTime);
    
    return [
      bookingDate,
      time,
      booking.clientName || 'N/A',
      booking.clientAddress || 'Address not available',
      booking.serviceName || 'N/A',
      duration
    ];
  });

  // Generate table
  if (bookings.length > 0) {
    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: currentY,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 4,
        overflow: 'linebreak',
        halign: 'left',
      },
      headStyles: {
        fillColor: BRAND_COLORS.primary,
        textColor: BRAND_COLORS.white,
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { cellWidth: 28 },  // Date
        1: { cellWidth: 28 },  // Time
        2: { cellWidth: 35 },  // Client Name
        3: { cellWidth: 55 },  // Client Address
        4: { cellWidth: 30 },  // Service
        5: { cellWidth: 18, halign: 'center' },  // Duration
      },
      didDrawPage: (data) => {
        // Footer on each page
        doc.setFontSize(8);
        doc.setTextColor(BRAND_COLORS.accent[0], BRAND_COLORS.accent[1], BRAND_COLORS.accent[2]);
        doc.text(
          `Page ${doc.getNumberOfPages()}`,
          pageWidth / 2,
          pageHeight - 15,
          { align: 'center' }
        );
        doc.text(
          "CONFIDENTIAL - Med-Infinite Healthcare Management System",
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
      }
    });

    // Get final Y position after table
    const finalY = (doc as any).lastAutoTable.finalY || currentY + 50;

    // Summary section
    const summaryY = finalY + 15;
    
    // Check if we need a new page for summary
    if (summaryY > pageHeight - 50) {
      doc.addPage();
    }
    
    const actualSummaryY = summaryY > pageHeight - 50 ? 30 : summaryY;
    
    // Summary box
    doc.setFillColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    doc.roundedRect(20, actualSummaryY - 5, pageWidth - 40, 28, 3, 3, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(BRAND_COLORS.white[0], BRAND_COLORS.white[1], BRAND_COLORS.white[2]);
    doc.text("SUMMARY", 28, actualSummaryY + 5);
    
    // Calculate total hours
    let totalMinutes = 0;
    bookings.forEach(booking => {
      try {
        const [startHour, startMin] = booking.startTime.split(':').map(Number);
        const [endHour, endMin] = booking.endTime.split(':').map(Number);
        const mins = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        if (mins > 0) totalMinutes += mins;
      } catch {
        // Skip invalid times
      }
    });
    
    const totalHours = (totalMinutes / 60).toFixed(1);
    
    doc.setFontSize(10);
    doc.text(`Total Bookings: ${bookings.length}`, 28, actualSummaryY + 16);
    doc.text(`Total Planned Hours: ${totalHours} hours`, pageWidth / 2, actualSummaryY + 16);
    
  } else {
    // No bookings message
    doc.setFontSize(12);
    doc.setTextColor(BRAND_COLORS.accent[0], BRAND_COLORS.accent[1], BRAND_COLORS.accent[2]);
    doc.text("No future bookings found for the selected date range.", pageWidth / 2, currentY + 20, { align: 'center' });
  }

  // Save the PDF
  const dateStr = format(new Date(), "yyyy-MM-dd");
  const safeCarerName = carerName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  doc.save(`Future_Booking_Plan_${safeCarerName}_${dateStr}.pdf`);
};
