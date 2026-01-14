import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fetchOrganizationSettings, getLogoForPDF, OrganizationSettings } from "@/lib/pdfExportHelpers";

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

// Section background colors for visual distinction
const SECTION_COLORS = {
  patientInfo: { r: 239, g: 246, b: 255 },      // Light blue
  carePlanDetails: { r: 240, g: 253, b: 244 },  // Light green  
  medicalInfo: { r: 254, g: 242, b: 242 },      // Light red
  personalCare: { r: 245, g: 243, b: 255 },     // Light purple
  dietary: { r: 254, g: 252, b: 232 },          // Light yellow
  riskAssessments: { r: 255, g: 247, b: 237 },  // Light orange
  goals: { r: 236, g: 253, b: 245 },            // Light teal
  keyContacts: { r: 240, g: 249, b: 255 },      // Light cyan
  aboutMe: { r: 249, g: 250, b: 251 },          // Light gray
  activities: { r: 243, g: 244, b: 246 },       // Gray
  equipment: { r: 254, g: 249, b: 195 },        // Pale yellow
  consent: { r: 237, g: 233, b: 254 },          // Light violet
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
  logoBase64?: string | null;
}

export class EnhancedPdfGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private currentY: number = 20;
  private logoBase64: string | null = null;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  // Set logo for the PDF
  setLogo(logoBase64: string | null): void {
    this.logoBase64 = logoBase64;
  }

  // Helper to detect image format from base64
  private getImageFormat(base64: string): 'PNG' | 'JPEG' | 'GIF' {
    if (base64.includes('data:image/jpeg') || base64.includes('data:image/jpg')) return 'JPEG';
    if (base64.includes('data:image/gif')) return 'GIF';
    return 'PNG';
  }

  // Add organization header with branding - NEW LAYOUT: Logo LEFT, Org details RIGHT
  private addHeader(options: PdfOptions): number {
    const org = options.organization;
    const orgName = org?.name || 'Med-Infinite';
    const margin = 15;
    const rightX = this.pageWidth - margin;

    // Thin blue top strip for branding
    this.doc.setFillColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.rect(0, 0, this.pageWidth, 5, 'F');

    let headerContentY = 12;

    // LEFT SIDE: Organization Logo
    if (this.logoBase64 || options.logoBase64) {
      try {
        const logo = this.logoBase64 || options.logoBase64;
        if (logo) {
          const format = this.getImageFormat(logo);
          this.doc.addImage(logo, format, margin, 8, 40, 22);
        }
      } catch (e) {
        console.error('Error adding logo to header:', e);
      }
    }

    // RIGHT SIDE: Organization details (right-aligned)
    this.doc.setFontSize(12);
    this.doc.setFont(undefined, 'bold');
    this.doc.setTextColor(31, 41, 55); // gray-800
    this.doc.text(orgName, rightX, headerContentY, { align: 'right' });
    headerContentY += 5;

    this.doc.setFontSize(8);
    this.doc.setFont(undefined, 'normal');
    this.doc.setTextColor(75, 85, 99); // gray-600

    // Branch name
    if (options.branchName) {
      this.doc.text(`Branch: ${options.branchName}`, rightX, headerContentY, { align: 'right' });
      headerContentY += 4;
    }

    // Contact details
    if (org?.contact_phone) {
      this.doc.text(`Tel: ${org.contact_phone}`, rightX, headerContentY, { align: 'right' });
      headerContentY += 4;
    }
    if (org?.contact_email) {
      this.doc.text(`Email: ${org.contact_email}`, rightX, headerContentY, { align: 'right' });
      headerContentY += 4;
    }

    // Generated date on right
    this.doc.setFontSize(7);
    this.doc.setTextColor(107, 114, 128); // gray-500
    this.doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, HH:mm")}`, rightX, headerContentY, { align: 'right' });

    // Separator line below header content
    let separatorY = 35;
    this.doc.setDrawColor(229, 231, 235); // gray-200
    this.doc.setLineWidth(0.5);
    this.doc.line(margin, separatorY, this.pageWidth - margin, separatorY);

    // "CARE PLAN" title - prominent, centered below separator
    let yPosition = separatorY + 12;
    this.doc.setFontSize(22);
    this.doc.setFont(undefined, 'bold');
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text("CARE PLAN", this.pageWidth / 2, yPosition, { align: 'center' });

    // Decorative line under title
    yPosition += 4;
    this.doc.setDrawColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.setLineWidth(0.8);
    this.doc.line(this.pageWidth / 2 - 30, yPosition, this.pageWidth / 2 + 30, yPosition);

    // Report subtitle
    yPosition += 8;
    this.doc.setFontSize(9);
    this.doc.setFont(undefined, 'normal');
    this.doc.setTextColor(BRAND_COLORS.accent[0], BRAND_COLORS.accent[1], BRAND_COLORS.accent[2]);
    if (options.reportType) {
      this.doc.text(options.reportType, this.pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;
    }

    return yPosition + 8;
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

    // Patient Information Section - Light Blue
    this.addSection("Patient Information", [
      ["Full Name", `${clientData.clientProfile?.first_name || ''} ${clientData.clientProfile?.last_name || ''}`],
      ["Date of Birth", clientData.clientProfile?.date_of_birth ? format(new Date(clientData.clientProfile.date_of_birth), "dd MMM yyyy") : 'N/A'],
      ["Age Group", clientData.clientProfile?.age_group || 'N/A'],
      ["Address", clientData.clientProfile?.address || 'N/A'],
      ["Phone", clientData.clientProfile?.phone || 'N/A'],
      ["Email", clientData.clientProfile?.email || 'N/A'],
      ["NHS Number", clientData.clientProfile?.nhs_number || 'N/A']
    ], SECTION_COLORS.patientInfo);

    // Care Plan Details Section - Light Green
    this.addSection("Care Plan Details", [
      ["Plan ID", carePlan.id || 'N/A'],
      ["Plan Title", carePlan.title || 'N/A'],
      ["Assigned Staff", carePlan.assignedTo || 'N/A'],
      ["Provider Type", carePlan.assignedToType || 'N/A'],
      ["Status", carePlan.status || 'N/A'],
      ["Start Date", carePlan.dateCreated ? format(new Date(carePlan.dateCreated), "dd MMM yyyy") : 'N/A'],
      ["Last Updated", carePlan.lastUpdated ? format(new Date(carePlan.lastUpdated), "dd MMM yyyy") : 'N/A'],
      ["Review Date", clientData.reviewDate ? format(new Date(clientData.reviewDate), "dd MMM yyyy") : 'N/A']
    ], SECTION_COLORS.carePlanDetails);

    // Key Contacts Section - Light Cyan
    if (clientData.keyContacts && clientData.keyContacts.length > 0) {
      this.addKeyContactsSection(clientData.keyContacts);
    }

    // Medical Information Section - Light Red
    if (clientData.medicalInfo) {
      const medicalData: [string, string][] = [
        ["Allergies", clientData.medicalInfo.allergies?.join(', ') || 'None recorded'],
        ["Medical Conditions", clientData.medicalInfo.medical_conditions?.join(', ') || 'None recorded'],
        ["Current Medications", clientData.medicalInfo.current_medications?.join(', ') || 'None recorded'],
        ["Mobility Status", clientData.medicalInfo.mobility_status || 'N/A'],
        ["Communication Needs", clientData.medicalInfo.communication_needs || 'N/A'],
        ["Vision", clientData.medicalInfo.vision || 'N/A'],
        ["Hearing", clientData.medicalInfo.hearing || 'N/A'],
        ["Mental Health", clientData.medicalInfo.mental_health || 'N/A']
      ];
      this.addSection("Medical Information", medicalData, SECTION_COLORS.medicalInfo);
    }

    // Personal Care Information - Light Purple
    if (clientData.personalCare) {
      const personalCareData: [string, string][] = [
        ["Personal Hygiene Needs", clientData.personalCare.personal_hygiene_needs || 'N/A'],
        ["Bathing Preferences", clientData.personalCare.bathing_preferences || 'N/A'],
        ["Dressing Assistance", clientData.personalCare.dressing_assistance_level || 'N/A'],
        ["Toileting Assistance", clientData.personalCare.toileting_assistance_level || 'N/A'],
        ["Continence Support", clientData.personalCare.continence_support || 'N/A'],
        ["Sleep Patterns", clientData.personalCare.sleep_patterns || 'N/A'],
        ["Skin Care", clientData.personalCare.skin_care || 'N/A']
      ];
      this.addSection("Personal Care Requirements", personalCareData, SECTION_COLORS.personalCare);
    }

    // Dietary Requirements - Light Yellow
    if (clientData.dietaryRequirements) {
      const dietaryData: [string, string][] = [
        ["Dietary Restrictions", clientData.dietaryRequirements.dietary_restrictions?.join(', ') || 'None'],
        ["Food Allergies", clientData.dietaryRequirements.food_allergies?.join(', ') || 'None'],
        ["Food Preferences", clientData.dietaryRequirements.food_preferences?.join(', ') || 'None'],
        ["Texture Modified Diet", clientData.dietaryRequirements.texture_modified || 'N/A'],
        ["Nutritional Needs", clientData.dietaryRequirements.nutritional_needs || 'N/A'],
        ["Fluid Intake Target", clientData.dietaryRequirements.fluid_intake_target || 'N/A'],
        ["Supplements", clientData.dietaryRequirements.supplements?.join(', ') || 'None'],
        ["Feeding Assistance", clientData.dietaryRequirements.feeding_assistance || 'N/A']
      ];
      this.addSection("Dietary Requirements", dietaryData, SECTION_COLORS.dietary);
    }

    // Medications Section - Enhanced
    if (clientData.medications && clientData.medications.length > 0) {
      this.addMedicationsTableSection(clientData.medications);
    }

    // Risk Assessments - Light Orange
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

  // Helper method to add a section with key-value pairs and optional colored background
  private addSection(title: string, data: [string, string][], bgColor?: { r: number; g: number; b: number }): void {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 60) {
      this.doc.addPage();
      this.currentY = 20;
    }

    // Section header with colored background
    if (bgColor) {
      this.doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
      this.doc.rect(15, this.currentY - 6, this.pageWidth - 30, 12, 'F');
    }

    this.doc.setFontSize(13);
    this.doc.setFont(undefined, 'bold');
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text(title, 18, this.currentY);
    this.doc.setFont(undefined, 'normal');
    this.currentY += 12;

    // Add data as a table with proper width and text wrapping
    autoTable(this.doc, {
      head: [["Field", "Value"]],
      body: data,
      startY: this.currentY,
      tableWidth: this.pageWidth - 40,
      margin: { left: 20, right: 20 },
      theme: 'striped',
      styles: {
        fontSize: 9,
        cellPadding: 4,
        overflow: 'linebreak',
        cellWidth: 'wrap',
        lineColor: [229, 231, 235],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: BRAND_COLORS.primary,
        textColor: BRAND_COLORS.white,
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 55, textColor: [55, 65, 81] },
        1: { cellWidth: 'auto', overflow: 'linebreak' }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 12;
  }

  // Helper method for key contacts section
  private addKeyContactsSection(keyContacts: any[]): void {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = 20;
    }

    // Section header with colored background
    this.doc.setFillColor(SECTION_COLORS.keyContacts.r, SECTION_COLORS.keyContacts.g, SECTION_COLORS.keyContacts.b);
    this.doc.rect(15, this.currentY - 6, this.pageWidth - 30, 12, 'F');

    this.doc.setFontSize(13);
    this.doc.setFont(undefined, 'bold');
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text("Key Contacts", 18, this.currentY);
    this.doc.setFont(undefined, 'normal');
    this.currentY += 12;

    const contactData = keyContacts.map(contact => [
      contact.name || `${contact.first_name || ''} ${contact.surname || ''}`.trim() || 'N/A',
      contact.relationship || 'N/A',
      contact.phone || contact.mobile_number || 'N/A',
      contact.email || 'N/A',
      contact.is_emergency_contact ? 'Yes' : 'No'
    ]);

    autoTable(this.doc, {
      head: [["Name", "Relationship", "Phone", "Email", "Emergency"]],
      body: contactData,
      startY: this.currentY,
      tableWidth: this.pageWidth - 40,
      margin: { left: 20, right: 20 },
      theme: 'striped',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        cellWidth: 'wrap',
        lineColor: [229, 231, 235],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: BRAND_COLORS.primary,
        textColor: BRAND_COLORS.white,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 30 },
        2: { cellWidth: 35 },
        3: { cellWidth: 45 },
        4: { cellWidth: 20 }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 12;
  }

  // Helper method for medications table section
  private addMedicationsTableSection(medications: any[]): void {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = 20;
    }

    // Section header with colored background
    this.doc.setFillColor(SECTION_COLORS.medicalInfo.r, SECTION_COLORS.medicalInfo.g, SECTION_COLORS.medicalInfo.b);
    this.doc.rect(15, this.currentY - 6, this.pageWidth - 30, 12, 'F');

    this.doc.setFontSize(13);
    this.doc.setFont(undefined, 'bold');
    this.doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
    this.doc.text("Medications", 18, this.currentY);
    this.doc.setFont(undefined, 'normal');
    this.currentY += 12;

    const medData = medications.map(med => [
      med.name || med.medication_name || 'N/A',
      med.dosage || 'N/A',
      med.frequency || 'N/A',
      Array.isArray(med.time_of_day) ? med.time_of_day.join(', ') : (med.time_of_day || 'N/A'),
      med.instructions || 'N/A',
      med.status || 'active'
    ]);

    autoTable(this.doc, {
      head: [["Medication", "Dosage", "Frequency", "Time of Day", "Instructions", "Status"]],
      body: medData,
      startY: this.currentY,
      tableWidth: this.pageWidth - 40,
      margin: { left: 20, right: 20 },
      theme: 'striped',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        cellWidth: 'wrap',
        lineColor: [229, 231, 235],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: BRAND_COLORS.primary,
        textColor: BRAND_COLORS.white,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 'auto', overflow: 'linebreak' },
        5: { cellWidth: 15 }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 12;
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

// Export convenience function for care plan detail - ASYNC to fetch org settings and logo
export const generateCarePlanDetailPDF = async (
  carePlan: any,
  clientData: any,
  branchName: string,
  branchId?: string
) => {
  // Fetch organization settings and logo if branchId is provided
  let orgSettings: OrganizationSettings | null = null;
  let logoBase64: string | null = null;

  if (branchId) {
    try {
      orgSettings = await fetchOrganizationSettings(branchId);
      logoBase64 = await getLogoForPDF(orgSettings);
    } catch (error) {
      console.error('Error fetching organization settings for PDF:', error);
    }
  }

  const generator = new EnhancedPdfGenerator();
  
  // Set the logo on the generator
  generator.setLogo(logoBase64);

  generator.generateCarePlanDetailPDF(carePlan, clientData, {
    title: `Care Plan - ${carePlan.patientName}`,
    branchName,
    reportType: "Comprehensive Care Plan",
    includeWatermark: false, // Clean look without watermark
    confidential: true,
    organization: orgSettings ? {
      name: orgSettings.name,
      address: orgSettings.address || undefined,
      contact_email: orgSettings.email || undefined,
      contact_phone: orgSettings.telephone || undefined,
      logo_url: orgSettings.logo_url || undefined,
    } : undefined,
    logoBase64
  });
};
