import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface ServiceReportPdfData {
  report: any;
  visitRecord: any;
  tasks: any[];
  medications: any[];
  news2Readings: any[];
  otherVitals: any[];
  events: any[];
  incidents: any[];
  accidents: any[];
  observations: any[];
}

export const exportSingleServiceReportPDF = async (data: ServiceReportPdfData) => {
  const { report, visitRecord, tasks, medications, news2Readings, otherVitals, events, incidents, accidents, observations } = data;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Helper function to add text with wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text || '', maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * fontSize * 0.4);
  };

  // Helper function to check page break
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > 280) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // ============= PAGE 1: HEADER & SUMMARY =============
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Service Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(14);
  doc.text(`${report.clients?.first_name || ''} ${report.clients?.last_name || ''}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Visit Summary Box
  doc.setFillColor(245, 245, 250);
  doc.rect(15, yPos, pageWidth - 30, 50, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPos += 8;

  const visitDate = visitRecord?.visit_date ? format(new Date(visitRecord.visit_date), 'dd/MM/yyyy') : 'N/A';
  const startTime = visitRecord?.start_time || 'N/A';
  const endTime = visitRecord?.end_time || 'N/A';
  const duration = visitRecord?.actual_duration_minutes ? `${visitRecord.actual_duration_minutes} mins` : 'N/A';
  const carerName = `${report.staff?.first_name || ''} ${report.staff?.last_name || ''}`.trim() || 'N/A';

  doc.text(`Date: ${visitDate}`, 20, yPos);
  doc.text(`Time: ${startTime} - ${endTime}`, 20, yPos + 6);
  doc.text(`Duration: ${duration}`, 20, yPos + 12);
  doc.text(`Carer: ${carerName}`, 20, yPos + 18);
  doc.text(`Status: ${report.status || 'N/A'}`, 20, yPos + 24);
  yPos += 42;

  // Services Provided
  if (report.services_provided && report.services_provided.length > 0) {
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Services Provided:', 15, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    report.services_provided.forEach((service: string) => {
      doc.text(`• ${service}`, 20, yPos);
      yPos += 5;
    });
  }

  // ============= TASK DETAILS =============
  if (tasks && tasks.length > 0) {
    checkPageBreak(40);
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Task Details', 15, yPos);
    yPos += 8;

    const taskData = tasks.map(task => [
      task.task_categories?.name || 'Uncategorized',
      task.tasks?.name || 'N/A',
      task.is_completed ? '✓' : '✗',
      task.completed_at ? format(new Date(task.completed_at), 'HH:mm') : '-',
      task.notes || '-'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Task', 'Done', 'Time', 'Notes']],
      body: taskData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 45 },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 20 },
        4: { cellWidth: 'auto' }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    const completedCount = tasks.filter(t => t.is_completed).length;
    const completionRate = tasks.length > 0 ? ((completedCount / tasks.length) * 100).toFixed(0) : '0';
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Task Completion: ${completedCount}/${tasks.length} (${completionRate}%)`, 15, yPos);
    yPos += 10;
  }

  // ============= MEDICATION DETAILS =============
  if (medications && medications.length > 0) {
    checkPageBreak(40);
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Medication Details', 15, yPos);
    yPos += 8;

    const medData = medications.map(med => {
      const status = med.administration_status || 'pending';
      const statusText = status.charAt(0).toUpperCase() + status.slice(1);
      
      return [
        med.medications?.name || 'N/A',
        `${med.medications?.dosage || ''} ${med.medications?.route || ''}`.trim() || 'N/A',
        med.scheduled_time || '-',
        statusText,
        med.actual_admin_time || '-',
        med.notes || med.missed_reason || '-'
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Medication', 'Dosage', 'Scheduled', 'Status', 'Given At', 'Notes']],
      body: medData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 35 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 'auto' }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    const administeredCount = medications.filter(m => m.administration_status === 'administered').length;
    const missedCount = medications.filter(m => m.administration_status === 'missed').length;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Administered: ${administeredCount} | Missed: ${missedCount} | Pending: ${medications.length - administeredCount - missedCount}`, 15, yPos);
    yPos += 10;
  }

  // ============= NEWS2 & VITAL SIGNS =============
  if (news2Readings && news2Readings.length > 0) {
    checkPageBreak(60);
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('NEWS2 & Vital Signs', 15, yPos);
    yPos += 8;

    news2Readings.forEach((reading, index) => {
      checkPageBreak(40);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const readingTime = reading.recorded_at ? format(new Date(reading.recorded_at), 'HH:mm') : 'N/A';
      doc.text(`Reading ${index + 1} - ${readingTime}`, 15, yPos);
      yPos += 6;

      const news2Data = [
        ['Respiration Rate', reading.respiration_rate || '-', reading.rr_score || '0'],
        ['SpO2', reading.spo2 ? `${reading.spo2}%` : '-', reading.spo2_score || '0'],
        ['Temperature', reading.temperature ? `${reading.temperature}°C` : '-', reading.temp_score || '0'],
        ['Systolic BP', reading.systolic_bp || '-', reading.bp_score || '0'],
        ['Heart Rate', reading.heart_rate || '-', reading.hr_score || '0'],
        ['Consciousness', reading.consciousness_level || '-', reading.consciousness_score || '0'],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Parameter', 'Value', 'Score']],
        body: news2Data,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 40 },
          2: { cellWidth: 20, halign: 'center' }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 5;

      // Total score and risk level
      const totalScore = reading.total_score || 0;
      const riskLevel = reading.risk_level || 'unknown';
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total NEWS2 Score: ${totalScore} | Risk Level: ${riskLevel.toUpperCase()}`, 15, yPos);
      yPos += 8;

      // AI Recommendations if available
      if (reading.ai_recommendations) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        yPos = addWrappedText(`AI Recommendation: ${reading.ai_recommendations}`, 15, yPos, pageWidth - 30, 9);
        yPos += 5;
      }
    });
  }

  // Other Vital Signs
  if (otherVitals && otherVitals.length > 0) {
    checkPageBreak(30);
    yPos += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Other Vital Signs', 15, yPos);
    yPos += 6;

    const vitalData = otherVitals.map(vital => [
      vital.vital_type || 'N/A',
      vital.value || '-',
      vital.unit || '',
      vital.recorded_at ? format(new Date(vital.recorded_at), 'HH:mm') : '-',
      vital.notes || '-'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Type', 'Value', 'Unit', 'Time', 'Notes']],
      body: vitalData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // ============= EVENTS & INCIDENTS =============
  const hasEvents = (incidents && incidents.length > 0) || 
                    (accidents && accidents.length > 0) || 
                    (observations && observations.length > 0);

  if (hasEvents) {
    checkPageBreak(40);
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Events & Incidents', 15, yPos);
    yPos += 8;

    // Incidents
    if (incidents && incidents.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Incidents', 15, yPos);
      yPos += 6;

      incidents.forEach(incident => {
        checkPageBreak(25);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const incidentTime = incident.incident_time ? format(new Date(incident.incident_time), 'HH:mm') : 'N/A';
        doc.text(`${incidentTime} - ${incident.incident_type || 'N/A'}`, 20, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        yPos = addWrappedText(incident.description || 'No description', 20, yPos, pageWidth - 40, 9);
        
        if (incident.severity) {
          doc.text(`Severity: ${incident.severity}`, 20, yPos);
          yPos += 4;
        }
        yPos += 3;
      });
      yPos += 5;
    }

    // Accidents
    if (accidents && accidents.length > 0) {
      checkPageBreak(25);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Accidents', 15, yPos);
      yPos += 6;

      accidents.forEach(accident => {
        checkPageBreak(25);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const accidentTime = accident.accident_time ? format(new Date(accident.accident_time), 'HH:mm') : 'N/A';
        doc.text(`${accidentTime} - ${accident.accident_type || 'N/A'}`, 20, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        yPos = addWrappedText(accident.description || 'No description', 20, yPos, pageWidth - 40, 9);
        
        if (accident.requires_followup) {
          doc.text('⚠ Requires Follow-up', 20, yPos);
          yPos += 4;
        }
        yPos += 3;
      });
      yPos += 5;
    }

    // Observations
    if (observations && observations.length > 0) {
      checkPageBreak(25);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Observations', 15, yPos);
      yPos += 6;

      observations.forEach(obs => {
        checkPageBreak(20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const obsTime = obs.observation_time ? format(new Date(obs.observation_time), 'HH:mm') : 'N/A';
        doc.text(`${obsTime} - ${obs.observation_category || 'General'}`, 20, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        yPos = addWrappedText(obs.description || 'No description', 20, yPos, pageWidth - 40, 9);
        yPos += 3;
      });
    }
  }

  // ============= CARER VISIT DETAILS =============
  checkPageBreak(60);
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Carer Visit Details', 15, yPos);
  yPos += 8;

  doc.setFontSize(10);

  // Client Mood
  if (report.client_mood) {
    doc.setFont('helvetica', 'bold');
    doc.text('Client Mood:', 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(report.client_mood, 20, yPos);
    yPos += 8;
  }

  // Client Engagement
  if (report.client_engagement) {
    checkPageBreak(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Client Engagement:', 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(report.client_engagement, 20, yPos);
    yPos += 8;
  }

  // Activities Undertaken
  if (report.activities_undertaken) {
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Activities Undertaken:', 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    yPos = addWrappedText(report.activities_undertaken, 20, yPos, pageWidth - 35, 10);
    yPos += 5;
  }

  // Carer Observations
  if (report.carer_observations) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.text('Carer Observations:', 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    yPos = addWrappedText(report.carer_observations, 20, yPos, pageWidth - 35, 10);
    yPos += 5;
  }

  // Client Feedback
  if (report.client_feedback) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.text('Client Feedback:', 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    yPos = addWrappedText(report.client_feedback, 20, yPos, pageWidth - 35, 10);
    yPos += 5;
  }

  // Next Visit Preparations
  if (report.next_visit_preparations) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.text('Next Visit Preparations:', 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    yPos = addWrappedText(report.next_visit_preparations, 20, yPos, pageWidth - 35, 10);
    yPos += 5;
  }

  // Medication Notes
  if (report.medication_notes) {
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Medication Notes:', 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    yPos = addWrappedText(report.medication_notes, 20, yPos, pageWidth - 35, 10);
    yPos += 5;
  }

  // Incident Details
  if (report.incident_details) {
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Incident Details:', 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    yPos = addWrappedText(report.incident_details, 20, yPos, pageWidth - 35, 10);
    yPos += 5;
  }

  // ============= SIGNATURES =============
  if (report.carer_signature || report.client_signature) {
    checkPageBreak(50);
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Signatures', 15, yPos);
    yPos += 8;

    if (report.carer_signature) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Carer Signature:', 15, yPos);
      yPos += 5;
      
      try {
        doc.addImage(report.carer_signature, 'PNG', 15, yPos, 60, 20);
        yPos += 25;
      } catch (error) {
        doc.setFont('helvetica', 'italic');
        doc.text('[Signature image could not be loaded]', 15, yPos);
        yPos += 8;
      }
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`${report.staff?.first_name || ''} ${report.staff?.last_name || ''}`, 15, yPos);
      yPos += 4;
      if (report.submitted_at) {
        doc.text(format(new Date(report.submitted_at), 'dd/MM/yyyy HH:mm'), 15, yPos);
      }
      yPos += 10;
    }

    if (report.client_signature) {
      checkPageBreak(35);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Client Signature:', 15, yPos);
      yPos += 5;
      
      try {
        doc.addImage(report.client_signature, 'PNG', 15, yPos, 60, 20);
        yPos += 25;
      } catch (error) {
        doc.setFont('helvetica', 'italic');
        doc.text('[Signature image could not be loaded]', 15, yPos);
        yPos += 8;
      }
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`${report.clients?.first_name || ''} ${report.clients?.last_name || ''}`, 15, yPos);
      yPos += 10;
    }
  }

  // ============= ADMIN REVIEW =============
  if (report.review_notes || report.review_status) {
    checkPageBreak(30);
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Admin Review', 15, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Status: ${report.review_status || 'N/A'}`, 15, yPos);
    yPos += 6;

    if (report.review_notes) {
      doc.setFont('helvetica', 'normal');
      yPos = addWrappedText(report.review_notes, 15, yPos, pageWidth - 30, 10);
      yPos += 5;
    }

    if (report.reviewed_by) {
      doc.setFontSize(9);
      doc.text(`Reviewed by: ${report.reviewed_by}`, 15, yPos);
      yPos += 4;
    }

    if (report.reviewed_at) {
      doc.text(`Review date: ${format(new Date(report.reviewed_at), 'dd/MM/yyyy HH:mm')}`, 15, yPos);
    }
  }

  // ============= FOOTER =============
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${pageCount} | Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  // Save the PDF
  const clientName = `${report.clients?.first_name || ''}_${report.clients?.last_name || ''}`.trim() || 'Client';
  const reportDate = visitRecord?.visit_date ? format(new Date(visitRecord.visit_date), 'yyyy-MM-dd') : 'N/A';
  const fileName = `service_report_${clientName}_${reportDate}.pdf`;
  doc.save(fileName);
};
