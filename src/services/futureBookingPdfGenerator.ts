import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO } from "date-fns";

// Med-Infinite brand colors
const BRAND_COLORS = {
  primary: [0, 83, 156] as [number, number, number],
  secondary: [46, 150, 208] as [number, number, number],
  accent: [100, 100, 100] as [number, number, number],
  light: [240, 240, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  dark: [33, 37, 41] as [number, number, number],
  muted: [150, 150, 150] as [number, number, number]
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
 * Calculate duration helper
 */
const calculateDuration = (start: string, end: string): { text: string; minutes: number } => {
  try {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    
    if (totalMinutes < 0) return { text: 'N/A', minutes: 0 };
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    let text: string;
    if (hours > 0 && minutes > 0) {
      text = `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      text = `${hours}h`;
    } else {
      text = `${minutes}m`;
    }
    
    return { text, minutes: totalMinutes };
  } catch {
    return { text: 'N/A', minutes: 0 };
  }
};

/**
 * Format minutes to hours and minutes string
 */
const formatMinutesToHoursMinutes = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h 0m`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Generate a Future Booking Plan PDF report for carers
 */
export const generateFutureBookingPlanPDF = (options: FutureBookingReportOptions): void => {
  const { carerName, branchName, dateFrom, dateTo, bookings } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let totalPages = 1;

  // =====================================================
  // HEADER SECTION
  // =====================================================
  const drawHeader = () => {
    // Header background - increased height
    doc.setFillColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    doc.rect(0, 0, pageWidth, 52, 'F');

    // Organization name - larger and bolder
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(BRAND_COLORS.white[0], BRAND_COLORS.white[1], BRAND_COLORS.white[2]);
    doc.text("Med-Infinite", 20, 20);

    // Subtitle
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Healthcare Management System", 20, 28);

    // Branch name (right side)
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(branchName, pageWidth - 20, 18, { align: 'right' });
    
    // Generated date (right side)
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, HH:mm")}`, pageWidth - 20, 26, { align: 'right' });

    // Decorative accent line
    doc.setFillColor(BRAND_COLORS.secondary[0], BRAND_COLORS.secondary[1], BRAND_COLORS.secondary[2]);
    doc.rect(0, 52, pageWidth, 3, 'F');
  };

  drawHeader();

  // =====================================================
  // REPORT TITLE SECTION
  // =====================================================
  let currentY = 70;
  
  // Main title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
  doc.text("FUTURE BOOKING PLAN", pageWidth / 2, currentY, { align: 'center' });

  // Decorative line under title
  currentY += 6;
  doc.setDrawColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 60, currentY, pageWidth / 2 + 60, currentY);

  // =====================================================
  // DATE RANGE BOX
  // =====================================================
  currentY += 15;
  const dateRangeText = `${format(dateFrom, "dd MMM yyyy")}  —  ${format(dateTo, "dd MMM yyyy")}`;
  const dateBoxWidth = 140;
  const dateBoxX = (pageWidth - dateBoxWidth) / 2;
  
  // Date range box background
  doc.setFillColor(BRAND_COLORS.light[0], BRAND_COLORS.light[1], BRAND_COLORS.light[2]);
  doc.roundedRect(dateBoxX, currentY - 8, dateBoxWidth, 18, 4, 4, 'F');
  
  // Date range box border
  doc.setDrawColor(BRAND_COLORS.secondary[0], BRAND_COLORS.secondary[1], BRAND_COLORS.secondary[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(dateBoxX, currentY - 8, dateBoxWidth, 18, 4, 4, 'S');
  
  // Calendar icon representation
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
  doc.text("📅", dateBoxX + 8, currentY + 3);
  
  // Date range text
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BRAND_COLORS.dark[0], BRAND_COLORS.dark[1], BRAND_COLORS.dark[2]);
  doc.text(dateRangeText, pageWidth / 2 + 5, currentY + 3, { align: 'center' });

  // =====================================================
  // CARER INFORMATION BOX
  // =====================================================
  currentY += 25;
  
  // Carer info box
  doc.setFillColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
  doc.roundedRect(20, currentY - 6, pageWidth - 40, 22, 4, 4, 'F');
  
  // Carer icon and label
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(BRAND_COLORS.white[0], BRAND_COLORS.white[1], BRAND_COLORS.white[2]);
  doc.text("👤  CARER:", 28, currentY + 7);
  
  // Carer name
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(carerName, 75, currentY + 7);

  currentY += 30;

  // =====================================================
  // BOOKING TABLE
  // =====================================================
  const tableColumns = ["Date", "Time", "Client Name", "Client Address", "Service", "Duration"];
  
  // Track total minutes for summary
  let totalMinutes = 0;
  
  const tableRows = bookings.map(booking => {
    let bookingDate = 'N/A';
    try {
      bookingDate = format(parseISO(booking.date), "EEE, dd MMM");
    } catch {
      bookingDate = booking.date || 'N/A';
    }
    
    const time = `${booking.startTime} - ${booking.endTime}`;
    const duration = calculateDuration(booking.startTime, booking.endTime);
    totalMinutes += duration.minutes;
    
    return [
      bookingDate,
      time,
      booking.clientName || 'N/A',
      booking.clientAddress || 'Address not available',
      booking.serviceName || 'General Care',
      duration.text
    ];
  });

  // Generate table with improved styling
  if (bookings.length > 0) {
    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: currentY,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 5,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle',
        lineWidth: 0.1,
        lineColor: [220, 220, 220],
      },
      headStyles: {
        fillColor: BRAND_COLORS.primary,
        textColor: BRAND_COLORS.white,
        fontStyle: 'bold',
        fontSize: 10,
        cellPadding: 6,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      columnStyles: {
        0: { cellWidth: 28, fontStyle: 'bold' },  // Date
        1: { cellWidth: 30 },  // Time
        2: { cellWidth: 36 },  // Client Name
        3: { cellWidth: 52 },  // Client Address
        4: { cellWidth: 26 },  // Service
        5: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },  // Duration
      },
      didDrawPage: (data) => {
        totalPages = doc.getNumberOfPages();
        
        // Draw mini header on subsequent pages
        if (data.pageNumber > 1) {
          doc.setFillColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
          doc.rect(0, 0, pageWidth, 25, 'F');
          
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(BRAND_COLORS.white[0], BRAND_COLORS.white[1], BRAND_COLORS.white[2]);
          doc.text("Med-Infinite", 20, 15);
          
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text(`Future Booking Plan - ${carerName}`, pageWidth - 20, 15, { align: 'right' });
          
          // Accent line
          doc.setFillColor(BRAND_COLORS.secondary[0], BRAND_COLORS.secondary[1], BRAND_COLORS.secondary[2]);
          doc.rect(0, 25, pageWidth, 2, 'F');
        }
        
        // Footer on each page
        doc.setFontSize(8);
        doc.setTextColor(BRAND_COLORS.muted[0], BRAND_COLORS.muted[1], BRAND_COLORS.muted[2]);
        doc.text(
          `Page ${data.pageNumber}`,
          pageWidth / 2,
          pageHeight - 12,
          { align: 'center' }
        );
        doc.text(
          "CONFIDENTIAL - Med-Infinite Healthcare Management System",
          pageWidth / 2,
          pageHeight - 6,
          { align: 'center' }
        );
      }
    });

    // Get final Y position after table
    const finalY = (doc as any).lastAutoTable.finalY || currentY + 50;

    // =====================================================
    // SUMMARY SECTION
    // =====================================================
    let summaryY = finalY + 18;
    
    // Check if we need a new page for summary
    if (summaryY > pageHeight - 60) {
      doc.addPage();
      summaryY = 40;
    }

    // Summary box background
    doc.setFillColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    doc.roundedRect(20, summaryY - 8, pageWidth - 40, 45, 5, 5, 'F');
    
    // Summary title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(BRAND_COLORS.white[0], BRAND_COLORS.white[1], BRAND_COLORS.white[2]);
    doc.text("SUMMARY", 30, summaryY + 5);
    
    // Decorative line
    doc.setDrawColor(BRAND_COLORS.secondary[0], BRAND_COLORS.secondary[1], BRAND_COLORS.secondary[2]);
    doc.setLineWidth(0.5);
    doc.line(30, summaryY + 10, pageWidth - 30, summaryY + 10);
    
    // Calculate stats
    const totalHours = (totalMinutes / 60).toFixed(1);
    const avgDurationMinutes = bookings.length > 0 ? Math.round(totalMinutes / bookings.length) : 0;
    const avgDurationText = formatMinutesToHoursMinutes(avgDurationMinutes);
    
    // Three-column layout for stats
    const colWidth = (pageWidth - 60) / 3;
    const statsY = summaryY + 28;
    
    // Column 1: Total Bookings
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(BRAND_COLORS.light[0], BRAND_COLORS.light[1], BRAND_COLORS.light[2]);
    doc.text("Total Bookings", 30 + colWidth * 0.5, statsY - 8, { align: 'center' });
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(BRAND_COLORS.white[0], BRAND_COLORS.white[1], BRAND_COLORS.white[2]);
    doc.text(`${bookings.length}`, 30 + colWidth * 0.5, statsY + 5, { align: 'center' });
    
    // Vertical divider
    doc.setDrawColor(BRAND_COLORS.secondary[0], BRAND_COLORS.secondary[1], BRAND_COLORS.secondary[2]);
    doc.setLineWidth(0.3);
    doc.line(30 + colWidth, statsY - 12, 30 + colWidth, statsY + 10);
    
    // Column 2: Total Hours
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(BRAND_COLORS.light[0], BRAND_COLORS.light[1], BRAND_COLORS.light[2]);
    doc.text("Total Hours", 30 + colWidth * 1.5, statsY - 8, { align: 'center' });
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(BRAND_COLORS.white[0], BRAND_COLORS.white[1], BRAND_COLORS.white[2]);
    doc.text(`${totalHours} hrs`, 30 + colWidth * 1.5, statsY + 5, { align: 'center' });
    
    // Vertical divider
    doc.line(30 + colWidth * 2, statsY - 12, 30 + colWidth * 2, statsY + 10);
    
    // Column 3: Avg Duration
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(BRAND_COLORS.light[0], BRAND_COLORS.light[1], BRAND_COLORS.light[2]);
    doc.text("Avg. Duration", 30 + colWidth * 2.5, statsY - 8, { align: 'center' });
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(BRAND_COLORS.white[0], BRAND_COLORS.white[1], BRAND_COLORS.white[2]);
    doc.text(avgDurationText, 30 + colWidth * 2.5, statsY + 5, { align: 'center' });

  } else {
    // No bookings message
    doc.setFillColor(BRAND_COLORS.light[0], BRAND_COLORS.light[1], BRAND_COLORS.light[2]);
    doc.roundedRect(30, currentY, pageWidth - 60, 40, 4, 4, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(BRAND_COLORS.accent[0], BRAND_COLORS.accent[1], BRAND_COLORS.accent[2]);
    doc.text("No future bookings found for the selected date range.", pageWidth / 2, currentY + 22, { align: 'center' });
  }

  // Update page numbers to show "Page X of Y"
  const totalPagesCount = doc.getNumberOfPages();
  for (let i = 1; i <= totalPagesCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(BRAND_COLORS.muted[0], BRAND_COLORS.muted[1], BRAND_COLORS.muted[2]);
    
    // Overwrite page number with "Page X of Y"
    doc.setFillColor(255, 255, 255);
    doc.rect(0, pageHeight - 18, pageWidth, 8, 'F');
    doc.text(
      `Page ${i} of ${totalPagesCount}`,
      pageWidth / 2,
      pageHeight - 12,
      { align: 'center' }
    );
  }

  // Save the PDF
  const dateStr = format(new Date(), "yyyy-MM-dd");
  const safeCarerName = carerName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  doc.save(`Future_Booking_Plan_${safeCarerName}_${dateStr}.pdf`);
};
