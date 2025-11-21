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

  // Agreement Reference and Status
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Reference: ${agreement.agreement_reference || 'N/A'}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  doc.text(`Status: ${agreement.status || 'N/A'}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Section: Agreement Details
  doc.setFontSize(14);
  doc.setTextColor(41, 98, 255);
  doc.text('Agreement Details', leftMargin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const details = [
    ['Tenant Organization', agreement.organizations?.name || 'N/A'],
    ['Software/Service', agreement.software_service_name || 'N/A'],
    ['Agreement Type', agreement.system_tenant_agreement_types?.name || 'N/A'],
    ['Start Date', formatDate(agreement.start_date)],
    ['Expiry Date', formatDate(agreement.expiry_date)],
    ['Version', agreement.version_number || 'N/A'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: details,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Section: Parties Information
  doc.setFontSize(14);
  doc.setTextColor(41, 98, 255);
  doc.text('Parties Information', leftMargin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  // Tenant Details
  doc.setFont('helvetica', 'bold');
  doc.text('Tenant Details:', leftMargin, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  
  const tenantDetails = [
    `Organization: ${agreement.organizations?.name || 'N/A'}`,
    `Address: ${agreement.tenant_address || 'N/A'}`,
    `Contact: ${agreement.tenant_contact_person || 'N/A'}`,
    `Email: ${agreement.tenant_email || 'N/A'}`,
    `Phone: ${agreement.tenant_phone || 'N/A'}`,
  ];
  
  tenantDetails.forEach(line => {
    doc.text(line, leftMargin + 5, yPos);
    yPos += 5;
  });
  yPos += 5;

  // Provider Details
  doc.setFont('helvetica', 'bold');
  doc.text('Provider Details:', leftMargin, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  
  const providerDetails = [
    `Company: ${agreement.provider_company_name || 'N/A'}`,
    `Address: ${agreement.provider_address || 'N/A'}`,
    `Contact: ${agreement.provider_contact_person || 'N/A'}`,
    `Email: ${agreement.provider_email || 'N/A'}`,
    `Phone: ${agreement.provider_phone || 'N/A'}`,
  ];
  
  providerDetails.forEach(line => {
    doc.text(line, leftMargin + 5, yPos);
    yPos += 5;
  });
  yPos += 10;

  // Check if we need a new page
  if (yPos > 250) {
    doc.addPage();
    addHeaderToPage();
    yPos = headerHeight + 10;
  }

  // Section: Financial Terms
  doc.setFontSize(14);
  doc.setTextColor(41, 98, 255);
  doc.text('Financial Terms', leftMargin, yPos);
  yPos += 8;

  const finalAmount = agreement.price_amount 
    ? agreement.price_amount - (agreement.discount_amount || 0)
    : null;

  const financialData = [
    ['Subscription Plan', agreement.subscription_plan || 'N/A'],
    ['Payment Terms', agreement.payment_terms || 'N/A'],
    ['Price/Fees', agreement.price_amount ? formatCurrency(agreement.price_amount) : 'N/A'],
    ['Discount', agreement.discount_percentage ? `${agreement.discount_percentage}% (${formatCurrency(agreement.discount_amount || 0)})` : 'N/A'],
    ['Final Amount', finalAmount ? formatCurrency(finalAmount) : 'N/A'],
    ['Payment Mode', agreement.payment_mode || 'N/A'],
    ['Late Payment Penalty', agreement.late_payment_penalty || 'N/A'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: financialData,
    theme: 'striped',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a new page
  if (yPos > 250) {
    doc.addPage();
    addHeaderToPage();
    yPos = headerHeight + 10;
  }

  // Section: Service Scope
  doc.setFontSize(14);
  doc.setTextColor(41, 98, 255);
  doc.text('Service Scope', leftMargin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const serviceScope = [
    ['Services Included', agreement.services_included || 'N/A'],
    ['User Limitations', agreement.user_limitations || 'N/A'],
    ['Support & Maintenance', agreement.support_maintenance || 'N/A'],
    ['Training & Onboarding', agreement.training_onboarding || 'N/A'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: serviceScope,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a new page
  if (yPos > 230) {
    doc.addPage();
    addHeaderToPage();
    yPos = headerHeight + 10;
  }

  // Section: Legal Terms
  doc.setFontSize(14);
  doc.setTextColor(41, 98, 255);
  doc.text('Legal Terms', leftMargin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const legalTerms = [
    ['Confidentiality Clause', agreement.confidentiality_clause || 'N/A'],
    ['Data Protection & Privacy', agreement.data_protection_privacy || 'N/A'],
    ['Termination Clause', agreement.termination_clause || 'N/A'],
    ['Liability & Indemnity', agreement.liability_indemnity || 'N/A'],
    ['Governing Law', agreement.governing_law || 'N/A'],
    ['Jurisdiction', agreement.jurisdiction || 'N/A'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: legalTerms,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a new page
  if (yPos > 240) {
    doc.addPage();
    addHeaderToPage();
    yPos = headerHeight + 10;
  }

  // Section: Signatures
  doc.setFontSize(14);
  doc.setTextColor(41, 98, 255);
  doc.text('Signatures', leftMargin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  // Tenant Signature
  doc.setFont('helvetica', 'bold');
  doc.text('Tenant Representative:', leftMargin, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${agreement.signed_by_tenant || 'N/A'}`, leftMargin + 5, yPos);
  yPos += 5;
  doc.text(`Signed: ${formatDate(agreement.tenant_signature_date)}`, leftMargin + 5, yPos);
  yPos += 5;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('(Digital signature on file)', leftMargin + 5, yPos);
  yPos += 10;

  // Provider Signature
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Provider Representative:', leftMargin, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${agreement.signed_by_system || 'N/A'}`, leftMargin + 5, yPos);
  yPos += 5;
  doc.text(`Signed: ${formatDate(agreement.system_signature_date)}`, leftMargin + 5, yPos);
  yPos += 5;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('(Digital signature on file)', leftMargin + 5, yPos);

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
  const filename = `tenant-agreement-${sanitizeFilename(agreement.title || 'agreement')}.pdf`;
  doc.save(filename);
};
