
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
