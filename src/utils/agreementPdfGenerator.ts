import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { SystemTenantAgreement } from '@/types/systemTenantAgreements';
import { formatCurrency } from './currencyFormatter';

const formatDate = (dateValue: string | null | undefined): string => {
  if (!dateValue) return 'N/A';
  try {
    return format(new Date(dateValue), 'dd MMM yyyy');
  } catch {
    return 'N/A';
  }
};

const sanitizeFilename = (title: string): string => {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

const loadImageAsBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load logo:', error);
    return '';
  }
};

export const generateAgreementPDF = async (agreement: SystemTenantAgreement): Promise<void> => {
  const doc = new jsPDF();
  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const leftMargin = 14;
  const rightMargin = pageWidth - 14;
  const contentWidth = rightMargin - leftMargin;

  // Load logo
  const logoUrl = '/lovable-uploads/3c8cdaf9-5267-424f-af69-9a1ce56b7ec5.png';
  const logoBase64 = await loadImageAsBase64(logoUrl);

  // Function to add header to any page
  const addHeaderToPage = () => {
    const headerHeight = 40;
    
    // Add light blue background for header
    doc.setFillColor(240, 248, 255);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    // Add logo on the left (if loaded successfully)
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', leftMargin, 10, 20, 20);
      } catch (error) {
        console.error('Failed to add logo to PDF:', error);
      }
    }

    // Company name and details on the right
    const companyDetailsX = pageWidth - leftMargin;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 98, 255);
    doc.text('MED-INFINITE ENDLESS CARE', companyDetailsX, 12, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);

    const companyDetails = [
      agreement.provider_address || 'Healthcare Address',
      agreement.provider_email || 'info@med-infinite.com',
      agreement.provider_phone || '+44 (0) 20 XXXX XXXX',
    ];

    let detailsY = 18;
    companyDetails.forEach(detail => {
      doc.text(detail, companyDetailsX, detailsY, { align: 'right' });
      detailsY += 4;
    });

    // Add separator line below header
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(leftMargin, headerHeight, pageWidth - leftMargin, headerHeight);
  };

  // Function to add section divider
  const addSectionDivider = () => {
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(leftMargin, yPos, rightMargin, yPos);
    yPos += 8;
  };

  // Function to add section heading
  const addSectionHeading = (title: string) => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 98, 255);
    doc.text(title, leftMargin, yPos);
    yPos += 2;
    
    // Add underline for section
    doc.setDrawColor(41, 98, 255);
    doc.setLineWidth(0.5);
    const textWidth = doc.getTextWidth(title);
    doc.line(leftMargin, yPos, leftMargin + textWidth, yPos);
    yPos += 8;
  };

  // === HEADER SECTION ===
  const headerHeight = 40;
  addHeaderToPage();
  yPos = headerHeight + 10;

  // === AGREEMENT TITLE SECTION ===
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(agreement.title || 'Agreement', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Add subtitle/date below title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Effective Date: ${formatDate(agreement.start_date)}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15; // More spacing before content

  // Section: Agreement Details
  addSectionHeading('Agreement Details');

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const details = [
    ['Tenant Organization', agreement.organizations?.name || 'N/A'],
    ['Software/Service', agreement.software_service_name || 'N/A'],
    ['Agreement Type', agreement.system_tenant_agreement_types?.name || 'N/A'],
    ['Commencement Date', formatDate(agreement.start_date)],
    ['Expiry Date', formatDate(agreement.expiry_date)],
    ['Agreement Version', agreement.version_number || '1.0'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: details,
    theme: 'plain',
    styles: { 
      fontSize: 10, 
      cellPadding: 4,
      lineColor: [240, 240, 240],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { 
        fontStyle: 'bold', 
        cellWidth: 55,
        textColor: [60, 60, 60],
      },
      1: { 
        cellWidth: 'auto',
        textColor: [0, 0, 0],
      },
    },
    alternateRowStyles: {
      fillColor: [250, 250, 252],
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;
  addSectionDivider();

  // Section: Parties Information
  addSectionHeading('Parties to this Agreement');

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  // Create two-column layout for parties
  const columnWidth = (contentWidth - 10) / 2;
  const column2X = leftMargin + columnWidth + 10;

  // Tenant Details - Left Column
  const startY = yPos;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(41, 98, 255);
  doc.text('THE TENANT', leftMargin, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const tenantDetails = [
    { label: 'Organization:', value: agreement.organizations?.name || 'N/A' },
    { label: 'Address:', value: agreement.tenant_address || 'N/A' },
    { label: 'Contact Person:', value: agreement.tenant_contact_person || 'N/A' },
    { label: 'Email:', value: agreement.tenant_email || 'N/A' },
    { label: 'Phone:', value: agreement.tenant_phone || 'N/A' },
  ];

  let maxTenantY = yPos;
  tenantDetails.forEach(item => {
    doc.setFont('helvetica', 'bold');
    doc.text(item.label, leftMargin, yPos);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(item.value, columnWidth - 35);
    doc.text(lines, leftMargin + 35, yPos);
    yPos += (lines.length * 5);
    maxTenantY = yPos;
  });

  // Provider Details - Right Column
  yPos = startY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(41, 98, 255);
  doc.text('THE PROVIDER', column2X, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const providerDetails = [
    { label: 'Company:', value: agreement.provider_company_name || 'MED-INFINITE ENDLESS CARE' },
    { label: 'Address:', value: agreement.provider_address || 'N/A' },
    { label: 'Contact Person:', value: agreement.provider_contact_person || 'N/A' },
    { label: 'Email:', value: agreement.provider_email || 'N/A' },
    { label: 'Phone:', value: agreement.provider_phone || 'N/A' },
  ];

  providerDetails.forEach(item => {
    doc.setFont('helvetica', 'bold');
    doc.text(item.label, column2X, yPos);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(item.value, columnWidth - 35);
    doc.text(lines, column2X + 35, yPos);
    yPos += (lines.length * 5);
  });

  yPos = Math.max(maxTenantY, yPos) + 8;
  addSectionDivider();

  // Check if we need a new page
  if (yPos > 250) {
    doc.addPage();
    addHeaderToPage();
    yPos = headerHeight + 10;
  }

  // Section: Financial Terms
  addSectionHeading('Financial Terms & Pricing');

  const finalAmount = agreement.price_amount 
    ? agreement.price_amount - (agreement.discount_amount || 0)
    : null;

  const financialData = [
    ['Subscription Plan', agreement.subscription_plan || 'N/A'],
    ['Payment Terms', agreement.payment_terms || 'N/A'],
    ['Price/Fees', agreement.price_amount ? formatCurrency(agreement.price_amount) : 'N/A'],
    ['Discount Applied', agreement.discount_percentage ? `${agreement.discount_percentage}% (${formatCurrency(agreement.discount_amount || 0)})` : 'None'],
    ['Total Amount Due', finalAmount ? formatCurrency(finalAmount) : 'N/A'],
    ['Payment Mode', agreement.payment_mode || 'N/A'],
    ['Late Payment Penalty', agreement.late_payment_penalty || 'As per standard terms'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: financialData,
    theme: 'striped',
    styles: { 
      fontSize: 10, 
      cellPadding: 4,
      lineColor: [230, 230, 230],
    },
    columnStyles: {
      0: { 
        fontStyle: 'bold', 
        cellWidth: 60,
        textColor: [60, 60, 60],
      },
      1: { 
        cellWidth: 'auto',
        textColor: [0, 0, 0],
      },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    // Highlight total amount row
    didParseCell: (data) => {
      if (data.row.index === 4) { // Total Amount Due row
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [230, 240, 255];
        data.cell.styles.textColor = [41, 98, 255];
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;
  addSectionDivider();

  // Check if we need a new page
  if (yPos > 250) {
    doc.addPage();
    addHeaderToPage();
    yPos = headerHeight + 10;
  }

  // Section: Service Scope
  addSectionHeading('Scope of Services');

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const serviceScope = [
    ['Services Included', agreement.services_included || 'As defined in service catalog'],
    ['User Limitations', agreement.user_limitations || 'No limitations'],
    ['Support & Maintenance', agreement.support_maintenance || 'Standard support included'],
    ['Training & Onboarding', agreement.training_onboarding || 'Available upon request'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: serviceScope,
    theme: 'plain',
    styles: { 
      fontSize: 10, 
      cellPadding: 4,
      lineColor: [240, 240, 240],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { 
        fontStyle: 'bold', 
        cellWidth: 60,
        textColor: [60, 60, 60],
      },
      1: { 
        cellWidth: 'auto',
        textColor: [0, 0, 0],
      },
    },
    alternateRowStyles: {
      fillColor: [250, 250, 252],
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;
  addSectionDivider();

  // Check if we need a new page
  if (yPos > 230) {
    doc.addPage();
    addHeaderToPage();
    yPos = headerHeight + 10;
  }

  // Section: Legal Terms
  addSectionHeading('Terms & Conditions');

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const legalTerms = [
    ['Confidentiality', agreement.confidentiality_clause || 'Standard confidentiality terms apply'],
    ['Data Protection', agreement.data_protection_privacy || 'Compliant with applicable data protection laws'],
    ['Termination', agreement.termination_clause || 'As per standard termination policy'],
    ['Liability & Indemnity', agreement.liability_indemnity || 'As per standard liability terms'],
    ['Governing Law', agreement.governing_law || 'England and Wales'],
    ['Jurisdiction', agreement.jurisdiction || 'Courts of England and Wales'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: legalTerms,
    theme: 'plain',
    styles: { 
      fontSize: 10, 
      cellPadding: 4,
      lineColor: [240, 240, 240],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { 
        fontStyle: 'bold', 
        cellWidth: 60,
        textColor: [60, 60, 60],
      },
      1: { 
        cellWidth: 'auto',
        textColor: [0, 0, 0],
      },
    },
    alternateRowStyles: {
      fillColor: [250, 250, 252],
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;
  addSectionDivider();

  // Check if we need a new page
  if (yPos > 240) {
    doc.addPage();
    addHeaderToPage();
    yPos = headerHeight + 10;
  }

  // Section: Signatures
  addSectionHeading('Authorized Signatures');

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'italic');
  doc.text('The parties hereby acknowledge and agree to the terms and conditions set forth in this agreement:', leftMargin, yPos);
  yPos += 10;

  // Create two-column layout for signatures
  const sigColumnWidth = (contentWidth - 10) / 2;
  const sigColumn2X = leftMargin + sigColumnWidth + 10;

  // Tenant Signature Box
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(leftMargin, yPos, sigColumnWidth, 40);

  const tenantBoxY = yPos + 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('TENANT REPRESENTATIVE', leftMargin + 5, tenantBoxY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Authorized Signatory: ${agreement.signed_by_tenant || '[Name]'}`, leftMargin + 5, tenantBoxY + 8);
  doc.text(`Date of Signature: ${formatDate(agreement.tenant_signature_date)}`, leftMargin + 5, tenantBoxY + 14);

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'italic');
  doc.text('Digitally signed', leftMargin + 5, tenantBoxY + 20);

  // Signature line
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(leftMargin + 5, tenantBoxY + 30, leftMargin + sigColumnWidth - 5, tenantBoxY + 30);
  doc.setFontSize(7);
  doc.text('Authorized Signature', leftMargin + 5, tenantBoxY + 33);

  // Provider Signature Box
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(sigColumn2X, yPos, sigColumnWidth, 40);

  const providerBoxY = yPos + 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('PROVIDER REPRESENTATIVE', sigColumn2X + 5, providerBoxY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Authorized Signatory: ${agreement.signed_by_system || '[Name]'}`, sigColumn2X + 5, providerBoxY + 8);
  doc.text(`Date of Signature: ${formatDate(agreement.system_signature_date)}`, sigColumn2X + 5, providerBoxY + 14);

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'italic');
  doc.text('Digitally signed', sigColumn2X + 5, providerBoxY + 20);

  // Signature line
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(sigColumn2X + 5, providerBoxY + 30, sigColumn2X + sigColumnWidth - 5, providerBoxY + 30);
  doc.setFontSize(7);
  doc.text('Authorized Signature', sigColumn2X + 5, providerBoxY + 33);

  yPos += 48;

  // Add agreement validity note
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('This agreement is legally binding and has been executed electronically.', pageWidth / 2, yPos, { align: 'center' });

  // Footer - add to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Add header to additional pages
    if (i > 1) {
      addHeaderToPage();
    }
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}`,
      leftMargin,
      doc.internal.pageSize.getHeight() - 10
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - leftMargin,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    );
  }

  // Save PDF
  const filename = `${sanitizeFilename(agreement.title || 'agreement')}-agreement.pdf`;
  doc.save(filename);
};
