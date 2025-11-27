import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface AttendanceReportData {
  staffName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  hours: number | null;
  status: string;
}

interface ReportMetadata {
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

export const generateAttendancePDF = (
  data: AttendanceReportData[],
  metadata: ReportMetadata,
  summary: SummaryStats
) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("ATTENDANCE REPORT", 105, 20, { align: "center" });

  // Metadata
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Branch: ${metadata.branchName}`, 20, 35);
  doc.text(
    `Period: ${format(new Date(metadata.startDate), "dd MMM yyyy")} - ${format(
      new Date(metadata.endDate),
      "dd MMM yyyy"
    )}`,
    20,
    42
  );
  doc.text(
    `Report Type: ${metadata.reportType.charAt(0).toUpperCase() + metadata.reportType.slice(1)}`,
    20,
    49
  );
  doc.text(`Generated: ${format(new Date(), "dd MMM yyyy HH:mm")}`, 20, 56);

  // Table
  autoTable(doc, {
    startY: 65,
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
      fillColor: [41, 128, 185],
      fontStyle: "bold",
      halign: "center",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 25, halign: "center" },
      4: { cellWidth: 20, halign: "center" },
      5: { cellWidth: 25, halign: "center" },
    },
  });

  // Summary section
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SUMMARY", 20, finalY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Working Days: ${summary.totalWorkingDays}`, 20, finalY + 8);
  doc.text(`Total Hours Worked: ${summary.totalHours.toFixed(1)}h`, 20, finalY + 15);
  doc.text(`Present Days: ${summary.presentDays}`, 20, finalY + 22);
  doc.text(`Absent Days: ${summary.absentDays}`, 20, finalY + 29);
  doc.text(`Late Arrivals: ${summary.lateDays}`, 20, finalY + 36);
  doc.text(
    `Attendance Rate: ${summary.attendanceRate.toFixed(1)}%`,
    20,
    finalY + 43
  );

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
