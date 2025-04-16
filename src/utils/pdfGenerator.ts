import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { News2Patient, News2Observation } from "@/components/reports/news2/news2Types";
import { format } from "date-fns";

// We need to extend the jsPDF type to include autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generatePDF = (agreement: { 
  id: number; 
  title: string; 
  date: string; 
  status: string;
  signedBy: string;
}) => {
  const doc = new jsPDF();
  
  // Add logo or header
  doc.setFontSize(20);
  doc.setTextColor(0, 83, 156);
  doc.text("Med-Infinite", 20, 20);
  
  // Title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(agreement.title, 20, 40);
  
  // Agreement details
  doc.setFontSize(12);
  doc.text(`Agreement ID: ${agreement.id}`, 20, 55);
  doc.text(`Date Signed: ${agreement.date}`, 20, 65);
  doc.text(`Status: ${agreement.status}`, 20, 75);
  doc.text(`Signed By: ${agreement.signedBy}`, 20, 85);
  
  // Agreement content
  doc.setFontSize(14);
  doc.text("Agreement Terms", 20, 105);
  
  doc.setFontSize(10);
  const termsText = [
    "This Agreement (\"Agreement\") is entered into by and between Med-Infinite (\"Company\") and the",
    "undersigned party (\"Client\").",
    "",
    "1. Services",
    "The Company agrees to provide healthcare management services as described in the attached",
    "Schedule of Services.",
    "",
    "2. Term",
    "This Agreement shall commence on the date of signing and shall continue for a period of 12 months",
    "unless terminated earlier as provided herein.",
    "",
    "3. Fees and Payment",
    "Client agrees to pay the Company the fees as set forth in the attached Fee Schedule. Payments are",
    "due within 30 days of receipt of invoice.",
    "",
    "4. Confidentiality",
    "Each party shall maintain the confidentiality of all proprietary or confidential information provided",
    "by the other party.",
    "",
    "5. Termination",
    "Either party may terminate this Agreement with 30 days written notice to the other party.",
    "",
    "6. Governing Law",
    "This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction",
    "in which the Company is located.",
    "",
    "7. Entire Agreement",
    "This Agreement constitutes the entire understanding between the parties concerning the subject",
    "matter hereof."
  ];
  
  let y = 110;
  termsText.forEach(line => {
    doc.text(line, 20, y);
    y += 5;
  });
  
  // Signatures
  doc.setFontSize(12);
  doc.text("Signatures:", 20, y + 10);
  doc.text("_______________________", 20, y + 20);
  doc.text("For Med-Infinite", 20, y + 25);
  
  doc.text("_______________________", 120, y + 20);
  doc.text("For Client", 120, y + 25);
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${pageCount} - Med-Infinite Confidential`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
  
  // Save the PDF
  doc.save(`${agreement.title.replace(/\s+/g, "_")}.pdf`);
};

// Type definition for a care plan
interface CarePlan {
  id: string;
  patientName: string;
  patientId: string;
  dateCreated: Date;
  lastUpdated: Date;
  status: string;
  assignedTo: string;
  avatar: string;
}

export const generateCarePlanPDF = (
  carePlans: CarePlan[],
  branchName: string,
  title: string = "Care Plans Report"
) => {
  const doc = new jsPDF();
  
  // Add logo or header
  doc.setFontSize(20);
  doc.setTextColor(0, 83, 156);
  doc.text("Med-Infinite", 20, 20);
  
  // Add subtitle with branch name
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(branchName, 20, 30);
  
  // Add title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 20, 40);
  
  // Add date of report generation
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 50);
  
  // Generate care plans table
  const tableColumn = ["Plan ID", "Patient Name", "Patient ID", "Date Created", "Last Updated", "Status", "Assigned To"];
  const tableRows = carePlans.map(plan => [
    plan.id,
    plan.patientName,
    plan.patientId,
    new Date(plan.dateCreated).toLocaleDateString(),
    new Date(plan.lastUpdated).toLocaleDateString(),
    plan.status,
    plan.assignedTo
  ]);
  
  // Add care plans table using autoTable
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 60,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [0, 83, 156],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    columnStyles: {
      0: { cellWidth: 20 }, // Plan ID
      1: { cellWidth: 30 }, // Patient Name
      2: { cellWidth: 20 }, // Patient ID
      3: { cellWidth: 25 }, // Date Created
      4: { cellWidth: 25 }, // Last Updated
      5: { cellWidth: 25 }, // Status
      6: { cellWidth: 35 }, // Assigned To
    },
  });
  
  // Add summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text(`Total Care Plans: ${carePlans.length}`, 20, finalY);
  
  // Status summary
  const statusCounts: Record<string, number> = {};
  carePlans.forEach(plan => {
    statusCounts[plan.status] = (statusCounts[plan.status] || 0) + 1;
  });
  
  let statusY = finalY + 5;
  doc.setFontSize(10);
  doc.text("Status Summary:", 20, statusY);
  statusY += 5;
  
  Object.entries(statusCounts).forEach(([status, count]) => {
    doc.text(`${status}: ${count}`, 25, statusY);
    statusY += 5;
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${pageCount} - Med-Infinite Confidential`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
  
  // Save the PDF
  doc.save(`${title.replace(/\s+/g, "_")}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// New function to generate NEWS2 reports
export const generateNews2PDF = (
  patient: News2Patient,
  branchName: string,
  includeCharts: boolean = true
) => {
  const doc = new jsPDF();
  
  // Add logo or header
  doc.setFontSize(20);
  doc.setTextColor(0, 83, 156);
  doc.text("Med-Infinite", 20, 20);
  
  // Add branch name
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(branchName, 20, 30);
  
  // Add report title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(`NEWS2 Report: ${patient.name}`, 20, 40);
  
  // Add report generation date
  doc.setFontSize(10);
  doc.text(`Generated on: ${format(new Date(), "dd MMM yyyy, HH:mm")}`, 20, 50);
  
  // Patient details section
  doc.setFontSize(14);
  doc.text("Patient Details", 20, 60);
  
  doc.setFontSize(10);
  doc.text(`Patient ID: ${patient.id}`, 20, 70);
  doc.text(`Age: ${patient.age} years`, 20, 80);
  doc.text(`Latest NEWS2 Score: ${patient.latestScore}`, 20, 90);
  
  // Score risk status
  let riskStatus = "Low Risk";
  let riskColor = [0, 128, 0]; // Green
  if (patient.latestScore >= 7) {
    riskStatus = "High Risk";
    riskColor = [220, 53, 69]; // Red
  } else if (patient.latestScore >= 5) {
    riskStatus = "Medium Risk";
    riskColor = [255, 193, 7]; // Amber
  }
  
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.text(`Risk Status: ${riskStatus}`, 20, 100);
  doc.setTextColor(0, 0, 0);
  
  doc.text(`Trend: ${patient.trend === "up" ? "Increasing" : patient.trend === "down" ? "Decreasing" : "Stable"}`, 20, 110);
  doc.text(`Last Updated: ${format(new Date(patient.lastUpdated), "dd MMM yyyy, HH:mm")}`, 20, 120);
  
  // Add observations table if available
  if (patient.observations && patient.observations.length > 0) {
    doc.setFontSize(14);
    doc.text("Observation History", 20, 140);
    
    // Format observations for table
    const tableColumn = ["Date & Time", "Resp Rate", "SpO₂", "BP", "Pulse", "Temp", "Conscious", "O₂ Therapy", "Score"];
    const tableRows = patient.observations.map(obs => [
      format(new Date(obs.dateTime), "dd MMM yyyy, HH:mm"),
      obs.respRate.toString(),
      `${obs.spo2}%`,
      `${obs.systolicBP} mmHg`,
      obs.pulse.toString(),
      `${obs.temperature}°C`,
      obs.consciousness,
      obs.o2Therapy ? "Yes" : "No",
      obs.score.toString()
    ]);
    
    // Add observations table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 150,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [0, 83, 156],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
    });
  }
  
  // Add recommendations based on score
  const finalY = patient.observations && patient.observations.length > 0
    ? (doc as any).lastAutoTable.finalY + 20
    : 140;
  
  doc.setFontSize(14);
  doc.text("Clinical Recommendations", 20, finalY);
  
  doc.setFontSize(10);
  let recommendations: string[] = [];
  
  if (patient.latestScore >= 7) {
    recommendations = [
      "• Urgent assessment by a clinician with critical care competencies",
      "• Consider transfer to higher level of care",
      "• Clinical monitoring at least every 30 minutes",
      "• Continuous monitoring of vital signs recommended"
    ];
  } else if (patient.latestScore >= 5) {
    recommendations = [
      "• Urgent assessment by a competent registered clinician",
      "• Clinical monitoring at least every hour",
      "• Consider transfer to higher level of care if no improvement",
      "• Follow local escalation protocol"
    ];
  } else {
    recommendations = [
      "• Continue routine clinical monitoring",
      "• Assessment by registered nurse",
      "• Clinical monitoring at least every 4-6 hours",
      "• Consider increasing frequency of monitoring if concerned"
    ];
  }
  
  let recY = finalY + 10;
  recommendations.forEach(rec => {
    doc.text(rec, 20, recY);
    recY += 10;
  });
  
  // Footer with pagination
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${pageCount} - Med-Infinite Confidential - NEWS2 Report`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
  
  // Save the PDF with patient name and date
  const formattedDate = format(new Date(), "yyyy-MM-dd");
  doc.save(`NEWS2_${patient.name.replace(/\s+/g, "_")}_${formattedDate}.pdf`);
};

// Function to export multiple patients as a summary report
export const generateNews2SummaryPDF = (
  patients: News2Patient[],
  branchName: string,
  filterStatus?: "all" | "high" | "medium" | "low",
  dateRange?: { from: Date, to: Date }
) => {
  const doc = new jsPDF();
  
  // Filter patients if status filter provided
  let filteredPatients = [...patients];
  if (filterStatus && filterStatus !== "all") {
    filteredPatients = patients.filter(p => {
      if (filterStatus === "high") return p.latestScore >= 7;
      if (filterStatus === "medium") return p.latestScore >= 5 && p.latestScore < 7;
      if (filterStatus === "low") return p.latestScore < 5;
      return true;
    });
  }
  
  // Add date filter if provided
  if (dateRange && dateRange.from && dateRange.to) {
    filteredPatients = filteredPatients.filter(p => {
      const obsDate = new Date(p.lastUpdated);
      return obsDate >= dateRange.from && obsDate <= dateRange.to;
    });
  }
  
  // Add header
  doc.setFontSize(20);
  doc.setTextColor(0, 83, 156);
  doc.text("Med-Infinite", 20, 20);
  
  // Add branch name
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(branchName, 20, 30);
  
  // Add title
  let title = "NEWS2 Summary Report";
  if (filterStatus && filterStatus !== "all") {
    title += ` - ${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Risk Patients`;
  }
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 20, 40);
  
  // Add date range if available
  if (dateRange && dateRange.from && dateRange.to) {
    doc.setFontSize(10);
    doc.text(
      `Date Range: ${format(dateRange.from, "dd MMM yyyy")} to ${format(dateRange.to, "dd MMM yyyy")}`,
      20, 50
    );
  }
  
  // Add report generation date
  doc.setFontSize(10);
  doc.text(`Generated on: ${format(new Date(), "dd MMM yyyy, HH:mm")}`, 20, 60);
  
  // Generate patients table
  const tableColumn = ["Patient ID", "Patient Name", "Age", "Latest Score", "Risk Level", "Trend", "Last Updated"];
  const tableRows = filteredPatients.map(patient => {
    let riskLevel = "Low Risk";
    if (patient.latestScore >= 7) riskLevel = "High Risk";
    else if (patient.latestScore >= 5) riskLevel = "Medium Risk";
    
    let trend = "Stable";
    if (patient.trend === "up") trend = "Increasing";
    else if (patient.trend === "down") trend = "Decreasing";
    
    return [
      patient.id,
      patient.name,
      patient.age.toString(),
      patient.latestScore.toString(),
      riskLevel,
      trend,
      format(new Date(patient.lastUpdated), "dd MMM yyyy, HH:mm")
    ];
  });
  
  // Add patients table
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 70,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [0, 83, 156],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    columnStyles: {
      0: { cellWidth: 20 }, // ID
      1: { cellWidth: 40 }, // Name
      2: { cellWidth: 15 }, // Age
      3: { cellWidth: 20 }, // Score
      4: { cellWidth: 25 }, // Risk
      5: { cellWidth: 20 }, // Trend
      6: { cellWidth: 40 }, // Date
    },
  });
  
  // Add summary statistics
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  
  const highRisk = filteredPatients.filter(p => p.latestScore >= 7).length;
  const mediumRisk = filteredPatients.filter(p => p.latestScore >= 5 && p.latestScore < 7).length;
  const lowRisk = filteredPatients.filter(p => p.latestScore < 5).length;
  
  doc.setFontSize(14);
  doc.text("Summary Statistics", 20, finalY);
  
  doc.setFontSize(10);
  doc.text(`Total Patients: ${filteredPatients.length}`, 20, finalY + 10);
  doc.text(`High Risk Patients: ${highRisk} (${Math.round((highRisk / filteredPatients.length) * 100) || 0}%)`, 20, finalY + 20);
  doc.text(`Medium Risk Patients: ${mediumRisk} (${Math.round((mediumRisk / filteredPatients.length) * 100) || 0}%)`, 20, finalY + 30);
  doc.text(`Low Risk Patients: ${lowRisk} (${Math.round((lowRisk / filteredPatients.length) * 100) || 0}%)`, 20, finalY + 40);
  
  // Footer with pagination
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${pageCount} - Med-Infinite Confidential - NEWS2 Summary Report`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
  
  // Save the PDF
  const formattedDate = format(new Date(), "yyyy-MM-dd");
  doc.save(`NEWS2_Summary_${formattedDate}.pdf`);
};
