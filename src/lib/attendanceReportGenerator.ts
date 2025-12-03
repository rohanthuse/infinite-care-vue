import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, eachDayOfInterval, isSameDay, isWithinInterval, getDaysInMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchOrganizationSettings,
  getLogoForPDF,
  addPDFHeader,
  addPDFFooter,
  addDocumentTitle,
  addSectionHeader,
  PDF_COLORS,
  OrganizationSettings,
} from "@/lib/pdfExportHelpers";

// Types
interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
}

interface LeaveRequest {
  staff_id: string;
  start_date: string;
  end_date: string;
  leave_type: string;
}

interface AttendanceRecord {
  id: string;
  person_id: string;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  hours_worked: number | null;
  status: string;
}

interface AttendanceReportData {
  staffName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  hours: number | null;
  status: string;
}

interface ReportMetadata {
  branchId: string;
  branchName: string;
  startDate: string;
  endDate: string;
  reportType: "daily" | "weekly" | "monthly";
}

interface SummaryStats {
  totalWorkingDays: number;
  totalHours: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
  halfDays?: number;
  leaveDays?: number;
}

type AttendanceStatus = "Present" | "Half Day" | "Absent" | "Leave";

// Status colors for PDF
const STATUS_COLORS = {
  Present: { bg: { r: 220, g: 252, b: 231 }, text: { r: 22, g: 101, b: 52 } },
  "Half Day": { bg: { r: 254, g: 249, b: 195 }, text: { r: 133, g: 77, b: 14 } },
  Absent: { bg: { r: 254, g: 226, b: 226 }, text: { r: 153, g: 27, b: 27 } },
  Leave: { bg: { r: 219, g: 234, b: 254 }, text: { r: 30, g: 64, b: 175 } },
};

const STATUS_ABBREVIATIONS: Record<AttendanceStatus, string> = {
  Present: "P",
  "Half Day": "H",
  Absent: "A",
  Leave: "L",
};

// Fetch all active staff for a branch
export const fetchActiveStaffForBranch = async (branchId: string): Promise<StaffMember[]> => {
  const { data, error } = await supabase
    .from("staff")
    .select("id, first_name, last_name")
    .eq("branch_id", branchId)
    .eq("status", "Active")
    .order("first_name");

  if (error) {
    console.error("Error fetching staff:", error);
    return [];
  }
  return data || [];
};

// Fetch approved leave requests for a date range
export const fetchApprovedLeaveRequests = async (
  branchId: string,
  startDate: string,
  endDate: string
): Promise<LeaveRequest[]> => {
  const { data, error } = await supabase
    .from("staff_leave_requests")
    .select("staff_id, start_date, end_date, leave_type")
    .eq("branch_id", branchId)
    .eq("status", "approved")
    .gte("end_date", startDate)
    .lte("start_date", endDate);

  if (error) {
    console.error("Error fetching leave requests:", error);
    return [];
  }
  return data || [];
};

// Fetch attendance records for a date range
export const fetchAttendanceRecords = async (
  branchId: string,
  startDate: string,
  endDate: string
): Promise<AttendanceRecord[]> => {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("id, person_id, attendance_date, check_in_time, check_out_time, hours_worked, status")
    .eq("branch_id", branchId)
    .eq("person_type", "staff")
    .gte("attendance_date", startDate)
    .lte("attendance_date", endDate);

  if (error) {
    console.error("Error fetching attendance records:", error);
    return [];
  }
  return data || [];
};

// Check if staff is on approved leave for a specific date
const isStaffOnLeave = (staffId: string, date: Date, leaveRequests: LeaveRequest[]): boolean => {
  return leaveRequests.some((leave) => {
    if (leave.staff_id !== staffId) return false;
    const leaveStart = new Date(leave.start_date);
    const leaveEnd = new Date(leave.end_date);
    return isWithinInterval(date, { start: leaveStart, end: leaveEnd });
  });
};

// Calculate attendance status based on business rules
const calculateAttendanceStatus = (
  attendance: AttendanceRecord | null,
  isOnLeave: boolean
): AttendanceStatus => {
  // Leave takes priority
  if (isOnLeave) return "Leave";
  
  // No attendance record = Absent
  if (!attendance) return "Absent";
  
  // Both check-in and check-out = Present
  if (attendance.check_in_time && attendance.check_out_time) return "Present";
  
  // Only check-in OR only check-out = Half Day
  if (attendance.check_in_time || attendance.check_out_time) return "Half Day";
  
  // No check-in/out times = Absent
  return "Absent";
};

// Generate comprehensive PDF report
export const generateComprehensiveAttendancePDF = async (
  branchId: string,
  branchName: string,
  startDate: Date,
  endDate: Date,
  reportType: "daily" | "weekly" | "monthly"
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: reportType === "monthly" ? "landscape" : "portrait",
  });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const leftMargin = 15;

  // Fetch all data in parallel
  const [staff, leaveRequests, attendanceRecords, orgSettings] = await Promise.all([
    fetchActiveStaffForBranch(branchId),
    fetchApprovedLeaveRequests(branchId, format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd")),
    fetchAttendanceRecords(branchId, format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd")),
    fetchOrganizationSettings(branchId),
  ]);

  const logoBase64 = await getLogoForPDF(orgSettings);

  // Build attendance map: staffId -> date -> record
  const attendanceMap = new Map<string, Map<string, AttendanceRecord>>();
  attendanceRecords.forEach((record) => {
    if (!attendanceMap.has(record.person_id)) {
      attendanceMap.set(record.person_id, new Map());
    }
    attendanceMap.get(record.person_id)!.set(record.attendance_date, record);
  });

  // Get all dates in range
  const dates = eachDayOfInterval({ start: startDate, end: endDate });

  // Calculate status matrix for all staff and dates
  const statusMatrix: { staff: StaffMember; statuses: { date: Date; status: AttendanceStatus; record: AttendanceRecord | null }[] }[] = [];
  
  let totalPresent = 0;
  let totalHalfDay = 0;
  let totalAbsent = 0;
  let totalLeave = 0;
  let totalHours = 0;

  staff.forEach((s) => {
    const staffStatuses: { date: Date; status: AttendanceStatus; record: AttendanceRecord | null }[] = [];
    
    dates.forEach((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const attendance = attendanceMap.get(s.id)?.get(dateStr) || null;
      const onLeave = isStaffOnLeave(s.id, date, leaveRequests);
      const status = calculateAttendanceStatus(attendance, onLeave);
      
      staffStatuses.push({ date, status, record: attendance });
      
      // Count statistics
      switch (status) {
        case "Present": totalPresent++; break;
        case "Half Day": totalHalfDay++; break;
        case "Absent": totalAbsent++; break;
        case "Leave": totalLeave++; break;
      }
      
      if (attendance?.hours_worked) {
        totalHours += attendance.hours_worked;
      }
    });
    
    statusMatrix.push({ staff: s, statuses: staffStatuses });
  });

  // Add header
  let currentY = await addPDFHeader(doc, orgSettings, logoBase64);

  // Add document title
  const dateRange = reportType === "daily"
    ? format(startDate, "dd MMMM yyyy")
    : `${format(startDate, "dd MMM yyyy")} - ${format(endDate, "dd MMM yyyy")}`;
  
  const titleText = reportType === "monthly" ? "MONTHLY ATTENDANCE REPORT" : "ATTENDANCE CALENDAR REPORT";
  currentY = addDocumentTitle(doc, titleText, `${branchName} | ${dateRange}`, currentY);

  // Report Info Section
  currentY = addSectionHeader(doc, "Report Information", currentY, PDF_COLORS.gray[100]);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
  
  const infoItems = [
    { label: "Report Type:", value: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report` },
    { label: "Branch:", value: branchName },
    { label: "Period:", value: dateRange },
    { label: "Export Date:", value: format(new Date(), "dd MMMM yyyy, HH:mm") },
    { label: "Total Staff:", value: `${staff.length} members` },
  ];

  infoItems.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = leftMargin + col * 100;
    const y = currentY + row * 6;

    doc.setFont("helvetica", "bold");
    doc.text(item.label, x, y);
    doc.setFont("helvetica", "normal");
    doc.text(item.value, x + 30, y);
  });

  currentY += Math.ceil(infoItems.length / 2) * 6 + 10;

  // Generate appropriate table based on report type
  if (reportType === "monthly" && dates.length > 7) {
    // Monthly Calendar Grid
    currentY = addSectionHeader(doc, "Staff Attendance Calendar", currentY, PDF_COLORS.primaryLight);
    currentY = generateMonthlyCalendarTable(doc, statusMatrix, dates, currentY, leftMargin);
  } else {
    // Detailed table for daily/weekly
    currentY = addSectionHeader(doc, "Attendance Records", currentY, PDF_COLORS.primaryLight);
    currentY = generateDetailedTable(doc, statusMatrix, currentY, leftMargin);
  }

  // Check if we need new page for summary
  if (currentY + 80 > pageHeight - 30) {
    doc.addPage();
    currentY = await addPDFHeader(doc, orgSettings, logoBase64);
  }

  // Summary Statistics Section
  currentY = addSectionHeader(doc, "Summary Statistics", currentY, PDF_COLORS.gray[100]);

  const totalRecords = staff.length * dates.length;
  const attendanceRate = totalRecords > 0 ? ((totalPresent + totalHalfDay * 0.5) / totalRecords) * 100 : 0;

  const summaryData = [
    { label: "Total Staff", value: staff.length.toString(), color: PDF_COLORS.gray[700] },
    { label: "Total Days", value: dates.length.toString(), color: PDF_COLORS.gray[700] },
    { label: "Present", value: totalPresent.toString(), color: STATUS_COLORS.Present.text },
    { label: "Half Days", value: totalHalfDay.toString(), color: STATUS_COLORS["Half Day"].text },
    { label: "Absent", value: totalAbsent.toString(), color: STATUS_COLORS.Absent.text },
    { label: "On Leave", value: totalLeave.toString(), color: STATUS_COLORS.Leave.text },
    { label: "Total Hours", value: `${totalHours.toFixed(1)}h`, color: PDF_COLORS.gray[700] },
    { label: "Attendance Rate", value: `${attendanceRate.toFixed(1)}%`, color: PDF_COLORS.primary },
  ];

  const boxWidth = reportType === "monthly" ? 32 : 40;
  const boxHeight = 20;
  const boxGap = 4;
  const boxesPerRow = reportType === "monthly" ? 8 : 4;

  summaryData.forEach((item, index) => {
    const col = index % boxesPerRow;
    const row = Math.floor(index / boxesPerRow);
    const boxX = leftMargin + col * (boxWidth + boxGap);
    const boxY = currentY + row * (boxHeight + boxGap);

    doc.setFillColor(PDF_COLORS.gray[50].r, PDF_COLORS.gray[50].g, PDF_COLORS.gray[50].b);
    doc.setDrawColor(PDF_COLORS.gray[200].r, PDF_COLORS.gray[200].g, PDF_COLORS.gray[200].b);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, "FD");

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
    doc.text(item.label, boxX + 3, boxY + 7);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(item.color.r, item.color.g, item.color.b);
    doc.text(item.value, boxX + 3, boxY + 15);
  });

  currentY += Math.ceil(summaryData.length / boxesPerRow) * (boxHeight + boxGap) + 10;

  // Add legend
  currentY = addLegend(doc, currentY, leftMargin);

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc, orgSettings, i, totalPages, true);
  }

  return doc;
};

// Generate monthly calendar grid table
const generateMonthlyCalendarTable = (
  doc: jsPDF,
  statusMatrix: { staff: StaffMember; statuses: { date: Date; status: AttendanceStatus; record: AttendanceRecord | null }[] }[],
  dates: Date[],
  startY: number,
  leftMargin: number
): number => {
  // Build headers: Staff Name + day numbers
  const headers = ["Staff Name", ...dates.map((d) => format(d, "d"))];
  
  // Build body rows
  const body = statusMatrix.map((row) => {
    const staffName = `${row.staff.first_name} ${row.staff.last_name}`;
    const statusCells = row.statuses.map((s) => STATUS_ABBREVIATIONS[s.status]);
    return [staffName, ...statusCells];
  });

  // Calculate column widths
  const pageWidth = doc.internal.pageSize.width;
  const availableWidth = pageWidth - leftMargin * 2;
  const staffNameWidth = 40;
  const dayCellWidth = Math.min(8, (availableWidth - staffNameWidth) / dates.length);

  autoTable(doc, {
    startY,
    head: [headers],
    body,
    theme: "grid",
    headStyles: {
      fillColor: [PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 7,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 2,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: staffNameWidth, halign: "left", fontStyle: "bold" },
      ...Object.fromEntries(
        dates.map((_, i) => [i + 1, { cellWidth: dayCellWidth }])
      ),
    },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index > 0) {
        const cellValue = hookData.cell.raw as string;
        const statusKey = Object.entries(STATUS_ABBREVIATIONS).find(
          ([, abbr]) => abbr === cellValue
        )?.[0] as AttendanceStatus | undefined;
        
        if (statusKey && STATUS_COLORS[statusKey]) {
          const colors = STATUS_COLORS[statusKey];
          hookData.cell.styles.fillColor = [colors.bg.r, colors.bg.g, colors.bg.b];
          hookData.cell.styles.textColor = [colors.text.r, colors.text.g, colors.text.b];
          hookData.cell.styles.fontStyle = "bold";
        }
      }
    },
    margin: { left: leftMargin, right: leftMargin },
  });

  return (doc as any).lastAutoTable.finalY + 10;
};

// Generate detailed attendance table
const generateDetailedTable = (
  doc: jsPDF,
  statusMatrix: { staff: StaffMember; statuses: { date: Date; status: AttendanceStatus; record: AttendanceRecord | null }[] }[],
  startY: number,
  leftMargin: number
): number => {
  const rows: string[][] = [];

  statusMatrix.forEach((staffData) => {
    const staffName = `${staffData.staff.first_name} ${staffData.staff.last_name}`;
    
    staffData.statuses.forEach((status) => {
      const checkIn = status.record?.check_in_time
        ? format(new Date(`2000-01-01T${status.record.check_in_time}`), "HH:mm")
        : "-";
      const checkOut = status.record?.check_out_time
        ? format(new Date(`2000-01-01T${status.record.check_out_time}`), "HH:mm")
        : "-";
      const hours = status.record?.hours_worked?.toFixed(2) || "0.00";

      rows.push([
        staffName,
        format(status.date, "dd/MM/yyyy"),
        checkIn,
        checkOut,
        hours,
        status.status,
      ]);
    });
  });

  autoTable(doc, {
    startY,
    head: [["Staff Name", "Date", "Check In", "Check Out", "Hours", "Status"]],
    body: rows,
    theme: "grid",
    headStyles: {
      fillColor: [PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 9,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b],
    },
    alternateRowStyles: {
      fillColor: [PDF_COLORS.gray[50].r, PDF_COLORS.gray[50].g, PDF_COLORS.gray[50].b],
    },
    columnStyles: {
      0: { cellWidth: 45, halign: "left" },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 22, halign: "center" },
      4: { cellWidth: 18, halign: "center" },
      5: { cellWidth: 25, halign: "center" },
    },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 5) {
        const status = hookData.cell.raw as AttendanceStatus;
        if (STATUS_COLORS[status]) {
          const colors = STATUS_COLORS[status];
          hookData.cell.styles.fillColor = [colors.bg.r, colors.bg.g, colors.bg.b];
          hookData.cell.styles.textColor = [colors.text.r, colors.text.g, colors.text.b];
          hookData.cell.styles.fontStyle = "bold";
        }
      }
    },
    margin: { left: leftMargin, right: 20 },
  });

  return (doc as any).lastAutoTable.finalY + 10;
};

// Add legend to PDF
const addLegend = (doc: jsPDF, startY: number, leftMargin: number): number => {
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
  doc.text("Legend:", leftMargin, startY);

  const legendItems = [
    { abbr: "P", label: "Present", colors: STATUS_COLORS.Present },
    { abbr: "H", label: "Half Day", colors: STATUS_COLORS["Half Day"] },
    { abbr: "A", label: "Absent", colors: STATUS_COLORS.Absent },
    { abbr: "L", label: "Leave", colors: STATUS_COLORS.Leave },
  ];

  let x = leftMargin + 20;
  const y = startY - 2;

  legendItems.forEach((item) => {
    // Draw colored box
    doc.setFillColor(item.colors.bg.r, item.colors.bg.g, item.colors.bg.b);
    doc.setDrawColor(item.colors.text.r, item.colors.text.g, item.colors.text.b);
    doc.roundedRect(x, y, 12, 6, 1, 1, "FD");
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(item.colors.text.r, item.colors.text.g, item.colors.text.b);
    doc.text(item.abbr, x + 4, y + 4.5);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(PDF_COLORS.gray[600].r, PDF_COLORS.gray[600].g, PDF_COLORS.gray[600].b);
    doc.text(`= ${item.label}`, x + 14, y + 4.5);

    x += 40;
  });

  return startY + 12;
};

// Legacy function for backward compatibility
export const generateAttendancePDF = async (
  data: AttendanceReportData[],
  metadata: { branchId?: string; branchName: string; startDate: string; endDate: string; reportType: "daily" | "weekly" | "monthly" },
  summary: SummaryStats
): Promise<jsPDF> => {
  // If branchId is provided, use the new comprehensive generator
  if (metadata.branchId) {
    return generateComprehensiveAttendancePDF(
      metadata.branchId,
      metadata.branchName,
      new Date(metadata.startDate),
      new Date(metadata.endDate),
      metadata.reportType
    );
  }

  // Fallback to basic generation for backward compatibility
  const doc = new jsPDF();
  const leftMargin = 20;

  let currentY = 20;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ATTENDANCE REPORT", leftMargin, currentY);
  currentY += 15;

  autoTable(doc, {
    startY: currentY,
    head: [["Staff Name", "Date", "Check In", "Check Out", "Hours", "Status"]],
    body: data.map((row) => [
      row.staffName,
      format(new Date(row.date), "dd/MM/yyyy"),
      row.checkIn || "-",
      row.checkOut || "-",
      row.hours?.toFixed(2) || "0.00",
      row.status,
    ]),
    theme: "grid",
    margin: { left: leftMargin, right: 20 },
  });

  return doc;
};

export const generateAttendanceExcel = (
  data: AttendanceReportData[],
  metadata: { branchName: string; startDate: string; endDate: string; reportType: string },
  summary: SummaryStats
): string => {
  let csv = "ATTENDANCE REPORT\n";
  csv += `Branch: ${metadata.branchName}\n`;
  csv += `Period: ${format(new Date(metadata.startDate), "dd MMM yyyy")} - ${format(
    new Date(metadata.endDate),
    "dd MMM yyyy"
  )}\n`;
  csv += `Report Type: ${metadata.reportType}\n`;
  csv += `Generated: ${format(new Date(), "dd MMM yyyy HH:mm")}\n\n`;

  csv += "Staff Name,Date,Check In,Check Out,Hours,Status\n";

  data.forEach((row) => {
    csv += `"${row.staffName}",`;
    csv += `"${format(new Date(row.date), "dd/MM/yyyy")}",`;
    csv += `"${row.checkIn || "-"}",`;
    csv += `"${row.checkOut || "-"}",`;
    csv += `"${row.hours !== null ? row.hours.toFixed(2) : "0.00"}",`;
    csv += `"${row.status}"\n`;
  });

  csv += "\nSUMMARY\n";
  csv += `Total Working Days,${summary.totalWorkingDays}\n`;
  csv += `Total Hours Worked,${summary.totalHours.toFixed(1)}\n`;
  csv += `Present Days,${summary.presentDays}\n`;
  csv += `Absent Days,${summary.absentDays}\n`;
  csv += `Late Arrivals,${summary.lateDays}\n`;
  csv += `Attendance Rate,${summary.attendanceRate.toFixed(1)}%\n`;

  return csv;
};

export const downloadPDF = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};

export const downloadExcel = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
