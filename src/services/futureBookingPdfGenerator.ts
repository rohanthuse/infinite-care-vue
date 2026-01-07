import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO } from "date-fns";
import { 
  fetchOrganizationSettings, 
  getLogoForPDF,
  OrganizationSettings 
} from "@/lib/pdfExportHelpers";

// Brand colors
const BRAND_COLORS = {
  primary: [0, 83, 156] as [number, number, number],
  secondary: [46, 150, 208] as [number, number, number],
  accent: [100, 100, 100] as [number, number, number],
  light: [240, 240, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  dark: [33, 37, 41] as [number, number, number],
  muted: [120, 120, 120] as [number, number, number],
  text: [50, 50, 50] as [number, number, number]
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
  branchId?: string;
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
 * Generate a Carer Rota PDF report
 */
export const generateFutureBookingPlanPDF = async (options: FutureBookingReportOptions): Promise<void> => {
  const { carerName, branchName, dateFrom, dateTo, bookings, branchId } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Fetch organization settings and logo
  let orgSettings: OrganizationSettings | null = null;
  let logoBase64: string | null = null;

  if (branchId) {
    orgSettings = await fetchOrganizationSettings(branchId);
    logoBase64 = await getLogoForPDF(orgSettings);
  }

  const orgName = orgSettings?.name || "Med-Infinite";
  const orgSubtitle = "Your Dignity is Our Business";

  // =====================================================
  // HEADER SECTION - Clean Professional Design
  // =====================================================
  const drawHeader = (isFirstPage: boolean = true) => {
    // Thin blue bar at very top
    doc.setFillColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    doc.rect(0, 0, pageWidth, 8, 'F');

    if (isFirstPage) {
      // Define column boundaries to prevent overlap
      const leftColumnMaxX = pageWidth * 0.50;  // Left side gets 50%
      const rightX = pageWidth - 15;
      
      // LEFT SIDE: Logo + Organization info
      let leftX = 15;
      let contentY = 20;

      // Add logo if available
      if (logoBase64) {
        try {
          const getImageFormat = (base64: string): 'PNG' | 'JPEG' | 'GIF' => {
            if (base64.includes('data:image/jpeg') || base64.includes('data:image/jpg')) return 'JPEG';
            if (base64.includes('data:image/gif')) return 'GIF';
            return 'PNG';
          };
          doc.addImage(logoBase64, getImageFormat(logoBase64), leftX, 12, 30, 18);
          leftX = 50;
        } catch (e) {
          console.error('Error adding logo:', e);
        }
      }

      // Organization name - with max width constraint
      const maxOrgWidth = leftColumnMaxX - leftX - 5;
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(BRAND_COLORS.dark[0], BRAND_COLORS.dark[1], BRAND_COLORS.dark[2]);
      
      // Split text if too long and use first line only
      const orgLines = doc.splitTextToSize(orgName.toUpperCase(), maxOrgWidth);
      doc.text(orgLines[0], leftX, contentY);
      
      // Show second line if organization name wrapped
      let subtitleY = contentY + 5;
      if (orgLines.length > 1) {
        doc.setFontSize(11);
        doc.text(orgLines[1], leftX, contentY + 5);
        subtitleY = contentY + 10;
      }

      // Subtitle/tagline
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(BRAND_COLORS.muted[0], BRAND_COLORS.muted[1], BRAND_COLORS.muted[2]);
      doc.text(orgSubtitle, leftX, subtitleY);

      // RIGHT SIDE: Carer name prominently + branch/date
      // Calculate max width for right side text
      const maxRightWidth = rightX - (pageWidth * 0.52);

      // Carer name (with width constraint)
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
      const carerLines = doc.splitTextToSize(carerName, maxRightWidth);
      doc.text(carerLines[0], rightX, 18, { align: 'right' });

      // Branch name
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(BRAND_COLORS.text[0], BRAND_COLORS.text[1], BRAND_COLORS.text[2]);
      const branchText = branchName.length > 30 ? branchName.substring(0, 27) + '...' : branchName;
      doc.text(`Branch: ${branchText}`, rightX, 25, { align: 'right' });

      // Generated date
      doc.setFontSize(7);
      doc.setTextColor(BRAND_COLORS.muted[0], BRAND_COLORS.muted[1], BRAND_COLORS.muted[2]);
      doc.text(`Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, rightX, 31, { align: 'right' });

      // Separator line
      doc.setDrawColor(BRAND_COLORS.light[0], BRAND_COLORS.light[1], BRAND_COLORS.light[2]);
      doc.setLineWidth(0.5);
      doc.line(15, 42, pageWidth - 15, 42);
    } else {
      // Mini header for subsequent pages
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(BRAND_COLORS.white[0], BRAND_COLORS.white[1], BRAND_COLORS.white[2]);
      doc.text(`CARER ROTA - ${carerName}`, 15, 5.5);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`${format(dateFrom, "dd MMM")} - ${format(dateTo, "dd MMM yyyy")}`, pageWidth - 15, 5.5, { align: 'right' });
    }
  };

  drawHeader(true);

  // =====================================================
  // TITLE SECTION
  // =====================================================
  let currentY = 52;

  // Title: "CARER ROTA" (centered)
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
  doc.text("CARER ROTA", pageWidth / 2, currentY, { align: 'center' });

  // Date range below title (simple text, no box)
  currentY += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(BRAND_COLORS.text[0], BRAND_COLORS.text[1], BRAND_COLORS.text[2]);
  const dateRangeText = `${format(dateFrom, "dd MMM yyyy")} — ${format(dateTo, "dd MMM yyyy")}`;
  doc.text(dateRangeText, pageWidth / 2, currentY, { align: 'center' });

  currentY += 12;

  // =====================================================
  // BOOKING TABLE
  // =====================================================
  const tableColumns = ["Date", "Time", "Client Name", "Client Address", "Service", "Duration"];
  
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
        valign: 'middle',
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
      },
      headStyles: {
        fillColor: BRAND_COLORS.primary,
        textColor: BRAND_COLORS.white,
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 5,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: 'bold' },  // Date
        1: { cellWidth: 28 },  // Time
        2: { cellWidth: 34 },  // Client Name
        3: { cellWidth: 52 },  // Client Address
        4: { cellWidth: 26 },  // Service
        5: { cellWidth: 20, halign: 'center' },  // Duration
      },
      margin: { left: 15, right: 15 },
      didDrawPage: (data) => {
        // Draw header on subsequent pages
        if (data.pageNumber > 1) {
          drawHeader(false);
        }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || currentY + 50;

    // =====================================================
    // SUMMARY SECTION (Simple, clean)
    // =====================================================
    let summaryY = finalY + 12;
    
    if (summaryY > pageHeight - 40) {
      doc.addPage();
      drawHeader(false);
      summaryY = 20;
    }

    // Simple summary line
    const totalHours = (totalMinutes / 60).toFixed(1);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(BRAND_COLORS.dark[0], BRAND_COLORS.dark[1], BRAND_COLORS.dark[2]);
    doc.text("Summary:", 15, summaryY);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(BRAND_COLORS.text[0], BRAND_COLORS.text[1], BRAND_COLORS.text[2]);
    doc.text(`${bookings.length} bookings  |  ${totalHours} hours total`, 42, summaryY);

  } else {
    // No bookings message
    doc.setFillColor(BRAND_COLORS.light[0], BRAND_COLORS.light[1], BRAND_COLORS.light[2]);
    doc.roundedRect(15, currentY, pageWidth - 30, 30, 3, 3, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(BRAND_COLORS.muted[0], BRAND_COLORS.muted[1], BRAND_COLORS.muted[2]);
    doc.text("No bookings found for the selected date range.", pageWidth / 2, currentY + 17, { align: 'center' });
  }

  // =====================================================
  // FOOTER on all pages
  // =====================================================
  const totalPagesCount = doc.getNumberOfPages();
  for (let i = 1; i <= totalPagesCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(BRAND_COLORS.light[0], BRAND_COLORS.light[1], BRAND_COLORS.light[2]);
    doc.setLineWidth(0.3);
    doc.line(15, pageHeight - 18, pageWidth - 15, pageHeight - 18);
    
    // Page number
    doc.setFontSize(8);
    doc.setTextColor(BRAND_COLORS.muted[0], BRAND_COLORS.muted[1], BRAND_COLORS.muted[2]);
    doc.text(`Page ${i} of ${totalPagesCount}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
    
    // Confidential notice
    doc.setFontSize(7);
    doc.text("Confidential", 15, pageHeight - 12);
    doc.text(orgName, pageWidth - 15, pageHeight - 12, { align: 'right' });
  }

  // Save the PDF
  const dateStr = format(new Date(), "yyyy-MM-dd");
  const safeCarerName = carerName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  doc.save(`Carer_Rota_${safeCarerName}_${dateStr}.pdf`);
};
