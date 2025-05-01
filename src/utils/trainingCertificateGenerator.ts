
import jsPDF from 'jspdf';
import { format, parseISO } from 'date-fns';
import { Training, StaffMember } from '@/types/training';

// Generate a PDF certificate for a completed training
export const generateTrainingCertificate = (
  training: Training,
  staffMember: StaffMember
): void => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Add background color/border
    doc.setFillColor(232, 240, 254); // Light blue background
    doc.rect(0, 0, 297, 210, 'F');
    doc.setFillColor(255, 255, 255); // White inner area
    doc.rect(10, 10, 277, 190, 'F');

    // Add title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(26, 86, 219); // Blue title
    doc.text('Certificate of Completion', 148.5, 40, { align: 'center' });

    // Add Med-Infinite logo text
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('Med-Infinite Training Academy', 148.5, 25, { align: 'center' });

    // Add certificate content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text('This certifies that', 148.5, 60, { align: 'center' });

    // Staff name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text(staffMember.name, 148.5, 75, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('has successfully completed the training course', 148.5, 90, { align: 'center' });

    // Training title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(training.title, 148.5, 100, { align: 'center' });

    // Completion date
    const completionDate = training.completionDate 
      ? format(parseISO(training.completionDate), 'MMMM d, yyyy')
      : 'N/A';
      
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Completed on ${completionDate}`, 148.5, 115, { align: 'center' });

    // Add score if available
    if (training.score !== undefined) {
      doc.text(`Score: ${training.score}/${training.maxScore || 100}`, 148.5, 125, { align: 'center' });
    }

    // Add validity
    if (training.expiryDate) {
      const expiryDate = format(parseISO(training.expiryDate), 'MMMM d, yyyy');
      doc.text(`Valid until: ${expiryDate}`, 148.5, 135, { align: 'center' });
    }

    // Add certificate ID at the bottom
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Certificate ID: ${training.id}-${staffMember.id}`, 148.5, 180, { align: 'center' });
    doc.text(`Generated on ${format(new Date(), 'MMMM d, yyyy')}`, 148.5, 185, { align: 'center' });

    // Save the PDF
    doc.save(`${staffMember.name.replace(/\s+/g, '_')}_${training.title.replace(/\s+/g, '_')}_Certificate.pdf`);
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw new Error('Failed to generate certificate PDF');
  }
};

// Generate a summary of all trainings for a staff member
export const generateTrainingSummaryPDF = (
  trainings: Training[],
  staffMember: StaffMember
): void => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Add title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Training Record Summary', pageWidth / 2, 20, { align: 'center' });

    // Add staff info
    doc.setFontSize(12);
    doc.text(`Staff Member: ${staffMember.name}`, 20, 30);
    doc.text(`Role: ${staffMember.role}`, 20, 37);
    doc.text(`Department: ${staffMember.department}`, 20, 44);
    
    // Add completion statistics
    const completedCount = trainings.filter(t => t.status === 'completed').length;
    const totalCount = trainings.length;
    const percentComplete = Math.round((completedCount / totalCount) * 100);
    
    doc.text(`Overall Training Completion: ${percentComplete}%`, 20, 55);
    doc.text(`Completed: ${completedCount}/${totalCount} courses`, 20, 62);
    
    // Add trainings table
    doc.setFontSize(10);
    let yPos = 75;
    
    // Table header
    doc.setFont('helvetica', 'bold');
    doc.text('Training Title', 20, yPos);
    doc.text('Category', 100, yPos);
    doc.text('Status', 130, yPos);
    doc.text('Completion Date', 155, yPos);
    doc.text('Expiry Date', 190, yPos);
    yPos += 7;
    
    // Table rows
    doc.setFont('helvetica', 'normal');
    trainings.forEach(training => {
      // Add new page if needed
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
        
        // Add table header to new page
        doc.setFont('helvetica', 'bold');
        doc.text('Training Title', 20, yPos);
        doc.text('Category', 100, yPos);
        doc.text('Status', 130, yPos);
        doc.text('Completion Date', 155, yPos);
        doc.text('Expiry Date', 190, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
      }
      
      // Truncate title if too long
      const title = training.title.length > 40
        ? training.title.substring(0, 37) + '...'
        : training.title;
        
      doc.text(title, 20, yPos);
      doc.text(training.category.charAt(0).toUpperCase() + training.category.slice(1), 100, yPos);
      doc.text(training.status.replace('-', ' '), 130, yPos);
      
      const completionDate = training.completionDate 
        ? format(parseISO(training.completionDate), 'MMM d, yyyy')
        : '-';
      doc.text(completionDate, 155, yPos);
      
      const expiryDate = training.expiryDate 
        ? format(parseISO(training.expiryDate), 'MMM d, yyyy')
        : '-';
      doc.text(expiryDate, 190, yPos);
      
      yPos += 7;
    });
    
    // Add generation info at the bottom
    const bottomPos = doc.internal.pageSize.height - 10;
    doc.setFontSize(8);
    doc.text(`Generated on ${format(new Date(), 'MMMM d, yyyy')} by Med-Infinite Training System`, pageWidth / 2, bottomPos, { align: 'center' });

    // Save the PDF
    doc.save(`${staffMember.name.replace(/\s+/g, '_')}_Training_Summary.pdf`);
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate training summary PDF');
  }
};
