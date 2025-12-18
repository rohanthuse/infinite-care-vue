import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

// Extend jsPDF type to include autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Med-Infinite brand colors
const BRAND_COLORS = {
  primary: [0, 83, 156] as [number, number, number], // #00539C
  secondary: [46, 150, 208] as [number, number, number], // #2E96D0
  accent: [100, 100, 100] as [number, number, number], // Gray
  success: [39, 174, 96] as [number, number, number], // Green
  danger: [231, 76, 60] as [number, number, number], // Red
  light: [240, 240, 240] as [number, number, number], // Light Gray
  white: [255, 255, 255] as [number, number, number]
};

interface OrganizationData {
  name?: string;
  logo_url?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
}

interface PdfOptions {
  title: string;
  branchName: string;
  reportType?: string;
  includeWatermark?: boolean;
  confidential?: boolean;
  organization?: OrganizationData;
}

export class EnhancedPdfGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private currentY: number = 20;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  // Add organization header with branding
  private addHeader(options: PdfOptions): number {
    const org = options.organization;
    const orgName = org?.name || 'Med-Infinite';
    
    // Header background
    this.doc.setFillColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.rect(0, 0, this.pageWidth, 50, 'F');

    let currentY = 15;
    const leftMargin = 20;
    const rightColumn = this.pageWidth - 20;

    // Organization name (large, white, left side)
    this.doc.setFontSize(22);
    this.doc.setTextColor(BRAND_COLORS.white[0], BRAND_COLORS.white[1], BRAND_COLORS.white[2]);
    this.doc.text(orgName, leftMargin, currentY);
    currentY += 10;

    // Organization contact details (smaller, white, below name)
    this.doc.setFontSize(9);
    if (org?.address) {
      this.doc.text(org.address, leftMargin, currentY);
      currentY += 5;
    }

    // Email and phone on same line
    const contactParts: string[] = [];
    if (org?.contact_email) contactParts.push(org.contact_email);
    if (org?.contact_phone) contactParts.push(org.contact_phone);
    if (contactParts.length > 0) {
      this.doc.text(contactParts.join('  |  '), leftMargin, currentY);
    }

    // Branch name on right side of header
    this.doc.setFontSize(10);
    this.doc.text(options.branchName, rightColumn, 15, { align: 'right' });
    this.doc.setFontSize(8);
    this.doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, HH:mm")}`, rightColumn, 22, { align: 'right' });

    // "CARE PLAN" title - prominent, centered below header
    let yPosition = 62;
    this.doc.setFontSize(24);
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text("CARE PLAN", this.pageWidth / 2, yPosition, { align: 'center' });

    // Decorative line under title
    yPosition += 5;
    this.doc.setDrawColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.pageWidth / 2 - 40, yPosition, this.pageWidth / 2 + 40, yPosition);

    // Report subtitle
    yPosition += 10;
    this.doc.setFontSize(10);
    this.doc.setTextColor(BRAND_COLORS.accent[0], BRAND_COLORS.accent[1], BRAND_COLORS.accent[2]);
    if (options.reportType) {
      this.doc.text(options.reportType, this.pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;
    }

    return yPosition + 10;
  }

  // Add watermark
  private addWatermark(): void {
    const centerX = this.pageWidth / 2;
    const centerY = this.pageHeight / 2;
    
    this.doc.setFontSize(50);
    this.doc.setTextColor(245, 245, 245);
    this.doc.text("Med-Infinite", centerX, centerY, { 
      align: "center",
      angle: 45
    });
  }

  // Add footer with pagination and confidentiality
  private addFooter(pageNum: number, totalPages: number, confidential: boolean = true): void {
    this.doc.setFontSize(8);
    this.doc.setTextColor(BRAND_COLORS.accent[0], BRAND_COLORS.accent[1], BRAND_COLORS.accent[2]);
    
    // Page number
    this.doc.text(
      `Page ${pageNum} of ${totalPages}`,
      this.pageWidth / 2,
      this.pageHeight - 15,
      { align: "center" }
    );

    // Confidentiality notice
    if (confidential) {
      this.doc.text(
        "CONFIDENTIAL - Med-Infinite Healthcare Management System",
        this.pageWidth / 2,
        this.pageHeight - 8,
        { align: "center" }
      );
    }
  }

  // Create booking report PDF
  generateBookingReport(bookings: any[], filters: any, options: PdfOptions): void {
    this.currentY = this.addHeader(options);

    if (options.includeWatermark) {
      this.addWatermark();
    }

    // Summary section
    this.doc.setFontSize(14);
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text("Report Summary", 20, this.currentY);
    this.currentY += 10;

    // Summary stats
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'done').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings * 100).toFixed(1) : '0';

    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`Total Bookings: ${totalBookings}`, 20, this.currentY);
    this.doc.text(`Completed: ${completedBookings}`, 20, this.currentY + 8);
    this.doc.text(`Cancelled: ${cancelledBookings}`, 20, this.currentY + 16);
    this.doc.text(`Completion Rate: ${completionRate}%`, 20, this.currentY + 24);
    this.currentY += 40;

    // Filter information
    if (filters.dateRange) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(BRAND_COLORS.accent[0], BRAND_COLORS.accent[1], BRAND_COLORS.accent[2]);
      this.doc.text(
        `Date Range: ${format(filters.dateRange.from, "dd MMM yyyy")} - ${format(filters.dateRange.to, "dd MMM yyyy")}`,
        20,
        this.currentY
      );
      this.currentY += 15;
    }

    // Bookings table
    if (bookings.length > 0) {
      const tableColumns = ["Date", "Time", "Client", "Carer", "Status", "Duration"];
      const tableRows = bookings.map(booking => {
        const duration = this.calculateDuration(booking.startTime, booking.endTime);
        return [
          format(new Date(booking.date), "dd MMM yyyy"),
          `${booking.startTime} - ${booking.endTime}`,
          booking.clientName || 'N/A',
          booking.carerName || 'N/A',
          booking.status || 'N/A',
          `${duration}m`
        ];
      });

      autoTable(this.doc, {
        head: [tableColumns],
        body: tableRows,
        startY: this.currentY,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: BRAND_COLORS.primary,
          textColor: BRAND_COLORS.white,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: BRAND_COLORS.light,
        },
      });
    }

    // Add pagination
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addFooter(i, totalPages, options.confidential !== false);
    }

    // Save with proper filename
    const dateStr = format(new Date(), "yyyy-MM-dd");
    this.doc.save(`Med-Infinite_Booking_Report_${dateStr}.pdf`);
  }

  // Generate client report PDF
  generateClientReport(clients: any[], options: PdfOptions): void {
    this.currentY = this.addHeader(options);

    if (options.includeWatermark) {
      this.addWatermark();
    }

    // Summary
    this.doc.setFontSize(14);
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text("Client Summary", 20, this.currentY);
    this.currentY += 15;

    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`Total Clients: ${clients.length}`, 20, this.currentY);
    this.doc.text(`Active Clients: ${clients.filter(c => c.status === 'active').length}`, 20, this.currentY + 8);
    this.currentY += 25;

    // Clients table
    if (clients.length > 0) {
      const tableColumns = ["Name", "Email", "Phone", "Status", "Registered"];
      const tableRows = clients.map(client => [
        `${client.first_name} ${client.last_name}`,
        client.email || 'N/A',
        client.phone || 'N/A',
        client.status || 'N/A',
        client.registered_on ? format(new Date(client.registered_on), "dd MMM yyyy") : 'N/A'
      ]);

      autoTable(this.doc, {
        head: [tableColumns],
        body: tableRows,
        startY: this.currentY,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: BRAND_COLORS.primary,
          textColor: BRAND_COLORS.white,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: BRAND_COLORS.light,
        },
      });
    }

    // Add pagination
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addFooter(i, totalPages, options.confidential !== false);
    }

    const dateStr = format(new Date(), "yyyy-MM-dd");
    this.doc.save(`Med-Infinite_Client_Report_${dateStr}.pdf`);
  }

  // Generate staff report PDF
  generateStaffReport(staff: any[], options: PdfOptions): void {
    this.currentY = this.addHeader(options);

    if (options.includeWatermark) {
      this.addWatermark();
    }

    // Summary
    this.doc.setFontSize(14);
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text("Staff Summary", 20, this.currentY);
    this.currentY += 15;

    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`Total Staff: ${staff.length}`, 20, this.currentY);
    this.currentY += 20;

    // Staff table
    if (staff.length > 0) {
      const tableColumns = ["Name", "Position", "Email", "Status"];
      const tableRows = staff.map(member => [
        `${member.first_name} ${member.last_name}`,
        member.position || 'N/A',
        member.email || 'N/A',
        member.status || 'Active'
      ]);

      autoTable(this.doc, {
        head: [tableColumns],
        body: tableRows,
        startY: this.currentY,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: BRAND_COLORS.primary,
          textColor: BRAND_COLORS.white,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: BRAND_COLORS.light,
        },
      });
    }

    // Add pagination
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addFooter(i, totalPages, options.confidential !== false);
    }

    const dateStr = format(new Date(), "yyyy-MM-dd");
    this.doc.save(`Med-Infinite_Staff_Report_${dateStr}.pdf`);
  }

  // Generate comprehensive care plan PDF
  generateCarePlanDetailPDF(carePlan: any, clientData: any, options: PdfOptions): void {
    this.currentY = this.addHeader(options);

    if (options.includeWatermark) {
      this.addWatermark();
    }

    // Patient Information Section
    this.addSection("Patient Information", [
      ["Full Name", `${clientData.clientProfile?.first_name || ''} ${clientData.clientProfile?.last_name || ''}`],
      ["Date of Birth", clientData.clientProfile?.date_of_birth ? format(new Date(clientData.clientProfile.date_of_birth), "dd MMM yyyy") : 'N/A'],
      ["Address", clientData.clientProfile?.address || 'N/A'],
      ["Phone", clientData.clientProfile?.phone || 'N/A'],
      ["Email", clientData.clientProfile?.email || 'N/A']
    ]);

    // Care Plan Details Section
    this.addSection("Care Plan Details", [
      ["Plan Title", carePlan.title || 'N/A'],
      ["Provider", carePlan.assignedTo || 'N/A'],
      ["Provider Type", carePlan.assignedToType || 'N/A'],
      ["Status", carePlan.status || 'N/A'],
      ["Start Date", format(carePlan.dateCreated, "dd MMM yyyy")],
      ["Last Updated", format(carePlan.lastUpdated, "dd MMM yyyy")]
    ]);

    // Medical Information Section
    if (clientData.medicalInfo) {
      const medicalData: [string, string][] = [
        ["Allergies", clientData.medicalInfo.allergies?.join(', ') || 'None recorded'],
        ["Medical Conditions", clientData.medicalInfo.medical_conditions?.join(', ') || 'None recorded'],
        ["Current Diagnosis", clientData.medicalInfo.current_medications?.join(', ') || 'None recorded'],
        ["Mobility Status", clientData.medicalInfo.mobility_status || 'N/A'],
        ["Communication Needs", clientData.medicalInfo.communication_needs || 'N/A']
      ];
      this.addSection("Medical Information", medicalData);
    }

    // Personal Care Information
    if (clientData.personalCare) {
      const personalCareData: [string, string][] = [
        ["Personal Hygiene Needs", clientData.personalCare.personal_hygiene_needs || 'N/A'],
        ["Bathing Preferences", clientData.personalCare.bathing_preferences || 'N/A'],
        ["Dressing Assistance", clientData.personalCare.dressing_assistance_level || 'N/A'],
        ["Toileting Assistance", clientData.personalCare.toileting_assistance_level || 'N/A'],
        ["Sleep Patterns", clientData.personalCare.sleep_patterns || 'N/A']
      ];
      this.addSection("Personal Care Requirements", personalCareData);
    }

    // Dietary Requirements
    if (clientData.dietaryRequirements) {
      const dietaryData: [string, string][] = [
        ["Dietary Restrictions", clientData.dietaryRequirements.dietary_restrictions?.join(', ') || 'None'],
        ["Food Allergies", clientData.dietaryRequirements.food_allergies?.join(', ') || 'None'],
        ["Food Preferences", clientData.dietaryRequirements.food_preferences?.join(', ') || 'None'],
        ["Nutritional Needs", clientData.dietaryRequirements.nutritional_needs || 'N/A'],
        ["Supplements", clientData.dietaryRequirements.supplements?.join(', ') || 'None']
      ];
      this.addSection("Dietary Requirements", dietaryData);
    }

    // Risk Assessments
    if (clientData.riskAssessments && clientData.riskAssessments.length > 0) {
      this.addRiskAssessmentsSection(clientData.riskAssessments);
    }

    // Equipment
    if (clientData.equipment && clientData.equipment.length > 0) {
      this.addEquipmentSection(clientData.equipment);
    }

    // Service Actions
    if (clientData.serviceActions && clientData.serviceActions.length > 0) {
      this.addServiceActionsSection(clientData.serviceActions);
    }

    // Assessments
    if (clientData.assessments && clientData.assessments.length > 0) {
      this.addAssessmentsSection(clientData.assessments);
    }

    // About Me Section
    if (clientData.aboutMe) {
      this.addAboutMeSection(clientData.aboutMe);
    }

    // General Information Section
    if (clientData.general) {
      this.addGeneralInformationSection(clientData.general);
    }

    // Hobbies and Interests Section
    if (clientData.hobbies && clientData.hobbies.length > 0) {
      this.addHobbiesSection(clientData.hobbies);
    }

    // Goals Section
    if (clientData.goals && clientData.goals.length > 0) {
      this.addGoalsSection(clientData.goals);
    }

    // Activities Section
    if (clientData.activities && clientData.activities.length > 0) {
      this.addActivitiesSection(clientData.activities);
    }

    // Consent Information Section
    if (clientData.consent) {
      this.addConsentSection(clientData.consent);
    }

    // Additional Notes Section
    if (clientData.additionalNotes || carePlan.additionalNotes) {
      this.addAdditionalNotesSection(clientData.additionalNotes || carePlan.additionalNotes);
    }

    // Add pagination
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addFooter(i, totalPages, options.confidential !== false);
    }

    // Save with proper filename
    const dateStr = format(new Date(), "yyyy-MM-dd");
    const patientName = `${clientData.clientProfile?.first_name || 'Unknown'}_${clientData.clientProfile?.last_name || 'Patient'}`;
    this.doc.save(`Med-Infinite_Care_Plan_${patientName}_${dateStr}.pdf`);
  }

  // Helper method to add a section with key-value pairs
  private addSection(title: string, data: [string, string][]): void {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 60) {
      this.doc.addPage();
      this.currentY = 20;
    }

    this.doc.setFontSize(14);
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text(title, 20, this.currentY);
    this.currentY += 15;

    // Add data as a table with proper width and text wrapping
    autoTable(this.doc, {
      head: [["Field", "Value"]],
      body: data,
      startY: this.currentY,
      tableWidth: this.pageWidth - 40,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 4,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      headStyles: {
        fillColor: BRAND_COLORS.primary,
        textColor: BRAND_COLORS.white,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 'auto', overflow: 'linebreak' }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
  }

  // Helper method for risk assessments
  private addRiskAssessmentsSection(riskAssessments: any[]): void {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = 20;
    }

    this.doc.setFontSize(14);
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text("Risk Assessments", 20, this.currentY);
    this.currentY += 15;

    const riskData = riskAssessments.map(risk => [
      risk.risk_type || 'N/A',
      risk.risk_level || 'N/A',
      risk.risk_factors?.join(', ') || 'None',
      risk.assessed_by || 'N/A',
      risk.assessment_date ? format(new Date(risk.assessment_date), "dd MMM yyyy") : 'N/A'
    ]);

    autoTable(this.doc, {
      head: [["Risk Type", "Level", "Risk Factors", "Assessed By", "Date"]],
      body: riskData,
      startY: this.currentY,
      tableWidth: this.pageWidth - 40,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      headStyles: {
        fillColor: BRAND_COLORS.primary,
        textColor: BRAND_COLORS.white,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20 },
        2: { cellWidth: 'auto', overflow: 'linebreak' },
        3: { cellWidth: 35 },
        4: { cellWidth: 25 }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
  }

  // Helper method for equipment
  private addEquipmentSection(equipment: any[]): void {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = 20;
    }

    this.doc.setFontSize(14);
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text("Equipment", 20, this.currentY);
    this.currentY += 15;

    const equipmentData = equipment.map(item => [
      item.equipment_name || 'N/A',
      item.equipment_type || 'N/A',
      item.manufacturer || 'N/A',
      item.status || 'N/A',
      item.location || 'N/A'
    ]);

    autoTable(this.doc, {
      head: [["Equipment Name", "Type", "Manufacturer", "Status", "Location"]],
      body: equipmentData,
      startY: this.currentY,
      tableWidth: this.pageWidth - 40,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      headStyles: {
        fillColor: BRAND_COLORS.primary,
        textColor: BRAND_COLORS.white,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 'auto', overflow: 'linebreak' }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
  }

  // Helper method for service actions
  private addServiceActionsSection(serviceActions: any[]): void {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = 20;
    }

    this.doc.setFontSize(14);
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text("Service Actions", 20, this.currentY);
    this.currentY += 15;

    const serviceData = serviceActions.map(service => [
      service.service_name || 'N/A',
      service.service_category || 'N/A',
      service.provider_name || 'N/A',
      service.frequency || 'N/A',
      service.progress_status || 'N/A'
    ]);

    autoTable(this.doc, {
      head: [["Service", "Category", "Provider", "Frequency", "Status"]],
      body: serviceData,
      startY: this.currentY,
      tableWidth: this.pageWidth - 40,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      headStyles: {
        fillColor: BRAND_COLORS.primary,
        textColor: BRAND_COLORS.white,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 'auto', overflow: 'linebreak' },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
  }

  // Helper method for assessments
  private addAssessmentsSection(assessments: any[]): void {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = 20;
    }

    this.doc.setFontSize(14);
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text("Clinical Assessments", 20, this.currentY);
    this.currentY += 15;

    const assessmentData = assessments.map(assessment => [
      assessment.assessment_name || 'N/A',
      assessment.assessment_type || 'N/A',
      assessment.performed_by || 'N/A',
      assessment.assessment_date ? format(new Date(assessment.assessment_date), "dd MMM yyyy") : 'N/A',
      assessment.status || 'N/A'
    ]);

    autoTable(this.doc, {
      head: [["Assessment", "Type", "Performed By", "Date", "Status"]],
      body: assessmentData,
      startY: this.currentY,
      tableWidth: this.pageWidth - 40,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      headStyles: {
        fillColor: BRAND_COLORS.primary,
        textColor: BRAND_COLORS.white,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 'auto', overflow: 'linebreak' },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
  }

  // Helper method for About Me section
  private addAboutMeSection(aboutMe: any): void {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = 20;
    }

    const aboutMeData: [string, string][] = [
      ["Life History", aboutMe.life_history || 'N/A'],
      ["Personality Traits", aboutMe.personality_traits || 'N/A'],
      ["Communication Style", aboutMe.communication_style || 'N/A'],
      ["Important People", aboutMe.important_people || 'N/A'],
      ["Meaningful Activities", aboutMe.meaningful_activities || 'N/A'],
      ["What is Most Important", aboutMe.what_is_most_important_to_me || 'N/A'],
      ["How to Communicate", aboutMe.how_to_communicate_with_me || 'N/A'],
      ["Please Do", aboutMe.please_do || 'N/A'],
      ["Please Don't", aboutMe.please_dont || 'N/A'],
      ["My Wellness", aboutMe.my_wellness || 'N/A'],
      ["How to Support Me", aboutMe.how_and_when_to_support_me || 'N/A'],
      ["Worth Knowing", aboutMe.also_worth_knowing_about_me || 'N/A'],
      ["Supported by", aboutMe.supported_to_write_this_by || 'N/A']
    ];

    this.addSection("About Me", aboutMeData);
  }

  // Helper method for General Information section
  private addGeneralInformationSection(general: any): void {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = 20;
    }

    const generalData: [string, string][] = [
      ["Preferred Name", general.preferred_name || 'N/A'],
      ["Relationship Status", general.relationship_status || 'N/A'],
      ["Occupation", general.occupation || 'N/A'],
      ["Religion/Beliefs", general.religion || 'N/A'],
      ["Cultural Background", general.cultural_background || 'N/A']
    ];

    this.addSection("General Information", generalData);
  }

  // Helper method for Hobbies section
  private addHobbiesSection(hobbies: string[]): void {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = 20;
    }

    this.doc.setFontSize(14);
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text("Hobbies and Interests", 20, this.currentY);
    this.currentY += 15;

    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    const hobbiesText = hobbies.join(', ') || 'None recorded';
    this.doc.text(hobbiesText, 20, this.currentY, { maxWidth: this.pageWidth - 40 });
    this.currentY += 25;
  }

  // Helper method for Goals section
  private addGoalsSection(goals: any[]): void {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = 20;
    }

    this.doc.setFontSize(14);
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text("Care Goals", 20, this.currentY);
    this.currentY += 15;

    const goalsData = goals.map(goal => [
      goal.description || 'N/A',
      goal.priority || 'N/A',
      goal.target_date ? format(new Date(goal.target_date), "dd MMM yyyy") : 'N/A',
      goal.measurable_outcome || 'N/A'
    ]);

    autoTable(this.doc, {
      head: [["Goal Description", "Priority", "Target Date", "Measurable Outcome"]],
      body: goalsData,
      startY: this.currentY,
      tableWidth: this.pageWidth - 40,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      headStyles: {
        fillColor: BRAND_COLORS.primary,
        textColor: BRAND_COLORS.white,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 'auto', overflow: 'linebreak' },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 'auto', overflow: 'linebreak' }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
  }

  // Helper method for Activities section
  private addActivitiesSection(activities: any[]): void {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = 20;
    }

    this.doc.setFontSize(14);
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text("Scheduled Activities", 20, this.currentY);
    this.currentY += 15;

    const activitiesData = activities.map(activity => [
      activity.name || 'N/A',
      activity.description || 'N/A',
      activity.frequency || 'N/A',
      activity.duration || 'N/A',
      activity.time_of_day || 'N/A'
    ]);

    autoTable(this.doc, {
      head: [["Activity Name", "Description", "Frequency", "Duration", "Time of Day"]],
      body: activitiesData,
      startY: this.currentY,
      tableWidth: this.pageWidth - 40,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      headStyles: {
        fillColor: BRAND_COLORS.primary,
        textColor: BRAND_COLORS.white,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 'auto', overflow: 'linebreak' },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
  }

  // Helper method for Consent section
  private addConsentSection(consent: any): void {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = 20;
    }

    const consentData: [string, string][] = [
      ["Capacity Assessment", consent.capacity_assessment || 'N/A'],
      ["Consent Given By", consent.consent_given_by || 'N/A'],
      ["Consent Date", consent.consent_date ? format(new Date(consent.consent_date), "dd MMM yyyy") : 'N/A'],
      ["Consent Notes", consent.consent_notes || 'N/A']
    ];

    this.addSection("Consent and Capacity Information", consentData);
  }

  // Helper method for Additional Notes section
  private addAdditionalNotesSection(notes: string): void {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = 20;
    }

    this.doc.setFontSize(14);
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text("Additional Notes", 20, this.currentY);
    this.currentY += 15;

    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    const splitNotes = this.doc.splitTextToSize(notes, this.pageWidth - 40);
    this.doc.text(splitNotes, 20, this.currentY);
    this.currentY += splitNotes.length * 5 + 15;
  }

  // Helper method to calculate duration
  private calculateDuration(startTime: string, endTime: string): number {
    if (!startTime || !endTime) return 0;
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    return (endHour * 60 + endMin) - (startHour * 60 + startMin);
  }
}

// Export convenience functions
export const generateBookingReportPDF = (
  bookings: any[], 
  filters: any, 
  branchName: string,
  reportType: string = "Booking Report"
) => {
  const generator = new EnhancedPdfGenerator();
  generator.generateBookingReport(bookings, filters, {
    title: reportType,
    branchName,
    reportType,
    includeWatermark: true,
    confidential: true
  });
};

export const generateClientReportPDF = (
  clients: any[], 
  branchName: string
) => {
  const generator = new EnhancedPdfGenerator();
  generator.generateClientReport(clients, {
    title: "Client Report",
    branchName,
    reportType: "Client Analytics",
    includeWatermark: true,
    confidential: true
  });
};

export const generateStaffReportPDF = (
  staff: any[], 
  branchName: string
) => {
  const generator = new EnhancedPdfGenerator();
  generator.generateStaffReport(staff, {
    title: "Staff Report",
    branchName,    
    reportType: "Staff Analytics",
    includeWatermark: true,
    confidential: true
  });
};

// Export convenience function for care plan detail
export const generateCarePlanDetailPDF = (
  carePlan: any,
  clientData: any,
  branchName: string,
  organizationData?: OrganizationData
) => {
  const generator = new EnhancedPdfGenerator();
  generator.generateCarePlanDetailPDF(carePlan, clientData, {
    title: `Care Plan - ${carePlan.patientName}`,
    branchName,
    reportType: "Comprehensive Care Plan",
    includeWatermark: true,
    confidential: true,
    organization: organizationData
  });
};
