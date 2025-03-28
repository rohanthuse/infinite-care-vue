
import { jsPDF } from "jspdf";
import "jspdf-autotable";

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
  
  // Add care plans table
  doc.autoTable({
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
