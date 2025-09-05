import jsPDF from 'jspdf';
import { Schedule, Driver } from '@/types';

export function generatePDF(schedule: Schedule, driverGroups: Record<string, Driver[]>): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Track Day Schedule', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;
  
  // Date and basic info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 10;
  doc.text(`Total Drivers: ${schedule.drivers.length}`, margin, yPosition);
  yPosition += 10;
  doc.text(`Run Groups: ${schedule.config.numberOfRunGroups}`, margin, yPosition);
  yPosition += 10;
  doc.text(`Session Duration: ${schedule.config.sessionDuration} minutes`, margin, yPosition);
  yPosition += 20;
  
  // Schedule table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Schedule', margin, yPosition);
  yPosition += 15;
  
  // Table headers
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const colWidths = [30, 30, 60, 50];
  const headers = ['Start', 'End', 'Group', 'Description'];
  
  let xPosition = margin;
  headers.forEach((header, index) => {
    doc.text(header, xPosition, yPosition);
    xPosition += colWidths[index];
  });
  yPosition += 10;
  
  // Draw line under headers
  doc.line(margin, yPosition - 5, margin + contentWidth, yPosition - 5);
  
  // Schedule rows
  doc.setFont('helvetica', 'normal');
  schedule.sessions.forEach(session => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
    }
    
    xPosition = margin;
    const rowData = [session.startTime, session.endTime, session.group, session.description];
    
    rowData.forEach((data, index) => {
      doc.text(data, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    yPosition += 8;
  });
  
  yPosition += 20;
  
  // Driver groups
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Driver Groups', margin, yPosition);
  yPosition += 15;
  
  Object.entries(driverGroups).forEach(([groupName, drivers]) => {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${groupName} (${drivers.length} drivers)`, margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    drivers.forEach(driver => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.text(`• ${driver.name} (${driver.skillLevel})`, margin + 10, yPosition);
      yPosition += 6;
    });
    
    yPosition += 10;
  });
  
  // Save the PDF
  doc.save('track-day-schedule.pdf');
}
