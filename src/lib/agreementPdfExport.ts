import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchOrganizationSettings, 
  loadImageAsBase64, 
  addPDFHeader, 
  addPDFFooter,
  addSectionHeader,
  addDocumentTitle,
  addStatusBadge,
  checkAndAddNewPage,
  PDF_COLORS,
  OrganizationSettings
} from './pdfExportHelpers';

interface AgreementSigner {
  signer_name: string;
  signer_type: 'client' | 'staff' | 'admin';
  signing_status: 'pending' | 'signed' | 'declined' | null;
  signed_at: string | null;
  signature_file_id: string | null;
}

interface AgreementFile {
  file_name: string;
  storage_path: string;
  file_size: number;
  created_at: string;
}

interface AgreementData {
  id: string;
  title: string;
  agreement_type: string | null;
  status: 'Active' | 'Pending' | 'Expired' | 'Terminated';
  created_at: string;
  signed_at: string | null;
  expiry_date: string | null;
  content: string | null;
  branch_id: string;
  branch_name: string | null;
  approval_status: string | null;
  signers: AgreementSigner[];
  files: AgreementFile[];
}

/**
 * Fetch complete agreement data including signers and files
 */
const fetchAgreementData = async (agreementId: string): Promise<AgreementData | null> => {
  try {
    // Fetch agreement basic data
    const { data: agreement, error: agreementError } = await supabase
      .from('agreements')
      .select(`
        id,
        title,
        status,
        created_at,
        signed_at,
        expiry_date,
        content,
        branch_id,
        approval_status,
        agreement_types (name),
        branches (name)
      `)
      .eq('id', agreementId)
      .single();

    if (agreementError || !agreement) {
      console.error('Error fetching agreement:', agreementError);
      return null;
    }

    // Fetch signers
    const { data: signersRaw, error: signersError } = await supabase
      .from('agreement_signers')
      .select('signer_name, signer_type, signing_status, signed_at, signature_file_id')
      .eq('agreement_id', agreementId)
      .order('created_at', { ascending: true });
    
    const signers = signersRaw?.map(s => ({
      signer_name: s.signer_name,
      signer_type: s.signer_type as 'client' | 'staff' | 'admin',
      signing_status: s.signing_status as 'pending' | 'signed' | 'declined' | null,
      signed_at: s.signed_at,
      signature_file_id: s.signature_file_id
    }));

    if (signersError) {
      console.error('Error fetching signers:', signersError);
    }

    // Fetch attached files
    const { data: files, error: filesError } = await supabase
      .from('agreement_files')
      .select('file_name, storage_path, file_size, created_at')
      .eq('agreement_id', agreementId)
      .order('created_at', { ascending: false });

    if (filesError) {
      console.error('Error fetching files:', filesError);
    }

    return {
      id: agreement.id,
      title: agreement.title,
      agreement_type: agreement.agreement_types?.name || null,
      status: agreement.status,
      created_at: agreement.created_at,
      signed_at: agreement.signed_at,
      expiry_date: agreement.expiry_date,
      content: agreement.content,
      branch_id: agreement.branch_id,
      branch_name: agreement.branches?.name || null,
      approval_status: agreement.approval_status,
      signers: signers || [],
      files: files || []
    };
  } catch (error) {
    console.error('Error in fetchAgreementData:', error);
    return null;
  }
};

/**
 * Export agreement to PDF with comprehensive formatting
 */
export const exportAgreementToPDF = async (
  agreementId: string,
  filename?: string
): Promise<void> => {
  try {
    // Fetch all data
    const agreementData = await fetchAgreementData(agreementId);
    if (!agreementData) {
      throw new Error('Failed to fetch agreement data');
    }

    const orgSettings = await fetchOrganizationSettings(agreementData.branch_id);
    
    // Load logo
    let logoBase64: string | null = null;
    if (orgSettings?.logo_url) {
      logoBase64 = await loadImageAsBase64(orgSettings.logo_url);
    }

    // Load signature images from storage
    const signatureImages: Map<string, string> = new Map();
    for (const signer of agreementData.signers) {
      if (signer.signature_file_id) {
        try {
          // Try to fetch signature from storage
          const { data: signatureData } = await supabase.storage
            .from('signatures')
            .download(signer.signature_file_id);
          
          if (signatureData) {
            const reader = new FileReader();
            const signatureBase64 = await new Promise<string>((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(signatureData);
            });
            signatureImages.set(signer.signer_name, signatureBase64);
          }
        } catch (error) {
          console.error('Error loading signature:', error);
        }
      }
    }

    // Create PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const leftMargin = 20;
    const rightMargin = pageWidth - 20;

    // Add header
    let currentY = await addPDFHeader(pdf, orgSettings, logoBase64);

    // Add title
    currentY = addDocumentTitle(
      pdf,
      agreementData.title,
      `Generated: ${format(new Date(), 'PPP p')}`,
      currentY
    );

    // === AGREEMENT INFORMATION SECTION ===
    currentY = addSectionHeader(pdf, 'Agreement Information', currentY);

    const agreementInfo = [
      ['Agreement ID', agreementData.id.substring(0, 20) + '...'],
      ['Type', agreementData.agreement_type || 'N/A'],
      ['Status', agreementData.status],
      ['Branch', agreementData.branch_name || 'N/A'],
      ['Created', format(new Date(agreementData.created_at), 'PPP')],
      ['Signed', agreementData.signed_at ? format(new Date(agreementData.signed_at), 'PPP') : 'Not signed'],
      ['Expires', agreementData.expiry_date ? format(new Date(agreementData.expiry_date), 'PPP') : 'No expiry'],
      ['Approval Status', agreementData.approval_status || 'N/A']
    ];

    autoTable(pdf, {
      body: agreementInfo,
      startY: currentY,
      theme: 'striped',
      styles: { 
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 'auto' }
      },
      margin: { left: leftMargin, right: leftMargin }
    });

    currentY = (pdf as any).lastAutoTable.finalY + 10;

    // === SIGNERS & SIGNATURES SECTION ===
    currentY = await checkAndAddNewPage(pdf, currentY, 60, orgSettings, logoBase64);
    currentY = addSectionHeader(pdf, 'Signers & Signatures', currentY);

    if (agreementData.signers.length > 0) {
      for (let i = 0; i < agreementData.signers.length; i++) {
        const signer = agreementData.signers[i];
        
        currentY = await checkAndAddNewPage(pdf, currentY, 50, orgSettings, logoBase64);

        // Signer info
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.text(`${i + 1}. ${signer.signer_name}`, leftMargin, currentY);
        currentY += 6;

        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(PDF_COLORS.gray[700].r, PDF_COLORS.gray[700].g, PDF_COLORS.gray[700].b);
        
        pdf.text(`Type: ${signer.signer_type}`, leftMargin + 5, currentY);
        currentY += 5;
        
        pdf.text(
          `Status: ${signer.signing_status || 'pending'}${signer.signed_at ? ' | Signed: ' + format(new Date(signer.signed_at), 'PPP p') : ''}`,
          leftMargin + 5,
          currentY
        );
        currentY += 8;

        // Signature image
        const signatureImage = signatureImages.get(signer.signer_name);
        if (signatureImage && signer.signing_status === 'signed') {
          try {
            pdf.addImage(signatureImage, 'PNG', leftMargin + 5, currentY, 60, 20);
            currentY += 25;
          } catch (error) {
            console.error('Error adding signature image:', error);
            pdf.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
            pdf.text('[Signature not available]', leftMargin + 5, currentY);
            currentY += 8;
          }
        } else {
          pdf.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
          pdf.text('[Not signed]', leftMargin + 5, currentY);
          currentY += 8;
        }

        pdf.setTextColor(0, 0, 0);
        currentY += 5;
      }
    } else {
      pdf.setFontSize(9);
      pdf.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
      pdf.text('No signers recorded', leftMargin, currentY);
      currentY += 10;
      pdf.setTextColor(0, 0, 0);
    }

    // === AGREEMENT CONTENT SECTION ===
    currentY = await checkAndAddNewPage(pdf, currentY, 40, orgSettings, logoBase64);
    currentY = addSectionHeader(pdf, 'Agreement Terms & Conditions', currentY);

    if (agreementData.content) {
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      
      const contentLines = pdf.splitTextToSize(agreementData.content, rightMargin - leftMargin);
      
      for (const line of contentLines) {
        currentY = await checkAndAddNewPage(pdf, currentY, 10, orgSettings, logoBase64);
        pdf.text(line, leftMargin, currentY);
        currentY += 5;
      }
      
      currentY += 5;
    } else {
      pdf.setFontSize(9);
      pdf.setTextColor(PDF_COLORS.gray[500].r, PDF_COLORS.gray[500].g, PDF_COLORS.gray[500].b);
      pdf.text('No agreement content available', leftMargin, currentY);
      currentY += 10;
      pdf.setTextColor(0, 0, 0);
    }

    // === ATTACHED DOCUMENTS SECTION ===
    if (agreementData.files.length > 0) {
      currentY = await checkAndAddNewPage(pdf, currentY, 40, orgSettings, logoBase64);
      currentY = addSectionHeader(pdf, 'Attached Documents', currentY);

      const filesData = agreementData.files.map(file => [
        file.file_name,
        `${(file.file_size / 1024).toFixed(1)} KB`,
        format(new Date(file.created_at), 'PPP')
      ]);

      autoTable(pdf, {
        head: [['File Name', 'Size', 'Upload Date']],
        body: filesData,
        startY: currentY,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { 
          fillColor: [PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b],
          textColor: 255
        },
        margin: { left: leftMargin, right: leftMargin }
      });
    }

    // Add footers to all pages
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addPDFFooter(pdf, orgSettings, i, totalPages, true);
    }

    // Save PDF
    const finalFileName = filename || `Agreement_${agreementData.title.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
    pdf.save(finalFileName);
  } catch (error) {
    console.error('Error exporting agreement to PDF:', error);
    throw error;
  }
};

/**
 * Export agreement to PDF Blob (for sharing)
 */
export const exportAgreementToPDFBlob = async (agreementId: string): Promise<Blob> => {
  try {
    // Fetch all data
    const agreementData = await fetchAgreementData(agreementId);
    if (!agreementData) {
      throw new Error('Failed to fetch agreement data');
    }

    const orgSettings = await fetchOrganizationSettings(agreementData.branch_id);
    
    // Load logo
    let logoBase64: string | null = null;
    if (orgSettings?.logo_url) {
      logoBase64 = await loadImageAsBase64(orgSettings.logo_url);
    }

    // Load signature images from storage
    const signatureImages: Map<string, string> = new Map();
    for (const signer of agreementData.signers) {
      if (signer.signature_file_id) {
        try {
          const { data: signatureData } = await supabase.storage
            .from('signatures')
            .download(signer.signature_file_id);
          
          if (signatureData) {
            const reader = new FileReader();
            const signatureBase64 = await new Promise<string>((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(signatureData);
            });
            signatureImages.set(signer.signer_name, signatureBase64);
          }
        } catch (error) {
          console.error('Error loading signature:', error);
        }
      }
    }

    // Create PDF (same as above, but return blob)
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const leftMargin = 20;

    let currentY = await addPDFHeader(pdf, orgSettings, logoBase64);
    currentY = addDocumentTitle(pdf, agreementData.title, `Generated: ${format(new Date(), 'PPP p')}`, currentY);

    // Add all sections (simplified for blob - same structure as above)
    currentY = addSectionHeader(pdf, 'Agreement Information', currentY);

    const agreementInfo = [
      ['Agreement ID', agreementData.id.substring(0, 20) + '...'],
      ['Type', agreementData.agreement_type || 'N/A'],
      ['Status', agreementData.status],
      ['Branch', agreementData.branch_name || 'N/A'],
      ['Created', format(new Date(agreementData.created_at), 'PPP')],
      ['Signed', agreementData.signed_at ? format(new Date(agreementData.signed_at), 'PPP') : 'Not signed'],
    ];

    autoTable(pdf, {
      body: agreementInfo,
      startY: currentY,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      margin: { left: leftMargin, right: leftMargin }
    });

    // Add footers
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addPDFFooter(pdf, orgSettings, i, totalPages, true);
    }

    return pdf.output('blob');
  } catch (error) {
    console.error('Error exporting agreement to PDF blob:', error);
    throw error;
  }
};
