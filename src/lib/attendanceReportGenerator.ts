import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
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

interface AttendanceReportData {
  staffName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  hours: number | null;
  status: string;
}

interface ReportMetadata {
  branchId?: string;
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
}

// Status color mapping for table cells
const getStatusColor = (status: string): { r: number; g: number; b: number } => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case "present":
      return PDF_COLORS.success;
    case "late":
      return PDF_COLORS.warning;
    case "absent":
      return PDF_COLORS.danger;
    default:
      return PDF_COLORS.gray[500];
  }
};

export const generateAttendancePDF = async (
  data: AttendanceReportData[],
  metadata: ReportMetadata,
  summary: SummaryStats
): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const leftMargin = 20;
  const rightMargin = pageWidth - 20;

  // Fetch organization settings and logo
  let orgSettings: OrganizationSettings | null = null;
  let logoBase64: string | null = null;

  if (metadata.branchId) {
    orgSettings = await fetchOrganizationSettings(metadata.branchId);
    logoBase64 = await getLogoForPDF(orgSettings);
  }

  // Add professional header
  let currentY = await addPDFHeader(doc, orgSettings, logoBase64);

  // Add document title
  const reportTypeLabel = metadata.reportType.charAt(0).toUpperCase() + metadata.reportType.slice(1);
  const dateRange = `${format(new Date(metadata.startDate), "dd MMM yyyy")} - ${format(new Date(metadata.endDate), "dd MMM yyyy")}`;
  
  currentY = addDocumentTitle(
    doc,
    "ATTENDANCE CALENDAR REPORT",
    `${metadata.branchName} | ${dateRange}`,
    currentY
  );

  // Report Information Section
  currentY = addSectionHeader(doc, "Report Information", currentY, PDF_COLORS.gray[100]);
  
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);

  const infoItems = [
    { label: "Report Type:", value: `${reportTypeLabel} Report` },
    { label: "Branch:", value: metadata.branchName },
    { label: "Period:", value: dateRange },
    { label: "Export Date:", value: format(new Date(), "dd MMMM yyyy, HH:mm") },
    { label: "Total Records:", value: `${data.length} entries` },
  ];

  infoItems.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = leftMargin + col * 85;
    const y = currentY + row * 6;

    doc.setFont(undefined, "bold");
    doc.text(item.label, x, y);
    doc.setFont(undefined, "normal");
    doc.text(item.value, x + 28, y);
  });

  currentY += Math.ceil(infoItems.length / 2) * 6 + 10;

  // Attendance Records Table Section
  currentY = addSectionHeader(doc, "Attendance Records", currentY, PDF_COLORS.primaryLight);

  // Generate table with proper styling
  autoTable(doc, {
    startY: currentY,
    head: [["Staff Name", "Date", "Check In", "Check Out", "Hours", "Status"]],
    body: data.map((row) => [
      row.staffName,
      format(new Date(row.date), "dd/MM/yyyy"),
      row.checkIn || "-",
      row.checkOut || "-",
      row.hours !== null ? row.hours.toFixed(2) : "0.00",
      row.status,
    ]),
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
      // Color code the status column
      if (hookData.section === "body" && hookData.column.index === 5) {
        const status = hookData.cell.raw as string;
        const color = getStatusColor(status);
        hookData.cell.styles.textColor = [color.r, color.g, color.b];
        hookData.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: leftMargin, right: 20 },
  });

  // Get final Y position after table
  const tableEndY = (doc as any).lastAutoTable.finalY + 15;

  // Check if we need a new page for summary
  const pageHeight = doc.internal.pageSize.height;
  let summaryY = tableEndY;

  if (summaryY + 60 > pageHeight - 30) {
    doc.addPage();
    summaryY = await addPDFHeader(doc, orgSettings, logoBase64);
  }

  // Summary Statistics Section
  summaryY = addSectionHeader(doc, "Summary Statistics", summaryY, PDF_COLORS.gray[100]);

  // Create summary grid layout
  const summaryData = [
    { label: "Total Working Days", value: summary.totalWorkingDays.toString(), icon: "📅" },
    { label: "Total Hours Worked", value: `${summary.totalHours.toFixed(1)}h`, icon: "⏱️" },
    { label: "Present Days", value: summary.presentDays.toString(), color: PDF_COLORS.success },
    { label: "Absent Days", value: summary.absentDays.toString(), color: PDF_COLORS.danger },
    { label: "Late Arrivals", value: summary.lateDays.toString(), color: PDF_COLORS.warning },
    { label: "Attendance Rate", value: `${summary.attendanceRate.toFixed(1)}%`, color: PDF_COLORS.primary },
  ];

  // Draw summary boxes in a grid
  const boxWidth = 55;
  const boxHeight = 22;
  const boxGap = 5;
  const boxesPerRow = 3;

  summaryData.forEach((item, index) => {
    const col = index % boxesPerRow;
    const row = Math.floor(index / boxesPerRow);
    const boxX = leftMargin + col * (boxWidth + boxGap);
    const boxY = summaryY + row * (boxHeight + boxGap);

    // Draw box background
    doc.setFillColor(PDF_COLORS.gray[50].r, PDF_COLORS.gray[50].g, PDF_COLORS.gray[50].b);
    doc.setDrawColor(PDF_COLORS.gray[200].r, PDF_COLORS.gray[200].g, PDF_COLORS.gray[200].b);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, "FD");

    // Draw label
    doc.setFontSize(7);
    doc.setFont(undefined, "normal");
    doc.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
    doc.text(item.label, boxX + 4, boxY + 7);

    // Draw value
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    const valueColor = item.color || PDF_COLORS.gray[900];
    doc.setTextColor(valueColor.r, valueColor.g, valueColor.b);
    doc.text(item.value, boxX + 4, boxY + 17);
  });

  // Calculate total pages and add footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc, orgSettings, i, totalPages, true);
  }

  return doc;
};

export const generateAttendanceExcel = (
  data: AttendanceReportData[],
  metadata: ReportMetadata,
  summary: SummaryStats
): string => {
  // Generate CSV format for Excel compatibility
  let csv = "ATTENDANCE REPORT\n";
  csv += `Branch: ${metadata.branchName}\n`;
  csv += `Period: ${format(new Date(metadata.startDate), "dd MMM yyyy")} - ${format(
    new Date(metadata.endDate),
    "dd MMM yyyy"
  )}\n`;
  csv += `Report Type: ${metadata.reportType}\n`;
  csv += `Generated: ${format(new Date(), "dd MMM yyyy HH:mm")}\n\n`;

  // Table headers
  csv += "Staff Name,Date,Check In,Check Out,Hours,Status\n";

  // Table data
  data.forEach((row) => {
    csv += `"${row.staffName}",`;
    csv += `"${format(new Date(row.date), "dd/MM/yyyy")}",`;
    csv += `"${row.checkIn || "-"}",`;
    csv += `"${row.checkOut || "-"}",`;
    csv += `"${row.hours !== null ? row.hours.toFixed(2) : "0.00"}",`;
    csv += `"${row.status}"\n`;
  });

  // Summary
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
