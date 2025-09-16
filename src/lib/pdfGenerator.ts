import jsPDF from 'jspdf';
import { Schedule, Driver } from '@/types';

export function generatePDF(schedule: Schedule, driverGroups: Record<string, Driver[]>): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Helper function to add a new page with header
  const addNewPage = (title: string) => {
    doc.addPage();
    let yPos = margin;
    
    // Page title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;
    
    // Basic info (only for driver groups page)
    if (title === 'Driver Groups' || title === 'Driver Groups (Continued)') {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Drivers: ${schedule.drivers.length}`, margin, yPos);
      yPos += 10;
      doc.text(`Run Groups: ${schedule.config.numberOfRunGroups}`, margin, yPos);
      yPos += 20;
    } else {
      // Full info for schedule page
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPos);
      yPos += 10;
      doc.text(`Total Drivers: ${schedule.drivers.length}`, margin, yPos);
      yPos += 10;
      doc.text(`Run Groups: ${schedule.config.numberOfRunGroups}`, margin, yPos);
      yPos += 10;
      doc.text(`Session Duration: ${schedule.config.sessionDuration} minutes`, margin, yPos);
      yPos += 10;
      doc.text(`Start Time: ${schedule.config.startTime}`, margin, yPos);
      yPos += 20;
    }
    
    return yPos;
  };
  
  // Helper function to draw a table
  const drawTable = (headers: string[], colWidths: number[], rows: string[][], startY: number) => {
    let yPosition = startY;
    
    // Table headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    let xPosition = margin;
    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    yPosition += 10;
    
    // Draw line under headers
    doc.line(margin, yPosition - 5, margin + contentWidth, yPosition - 5);
    
    // Table rows
    doc.setFont('helvetica', 'normal');
    rows.forEach(row => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin + 20;
      }
      
      xPosition = margin;
      row.forEach((data, index) => {
        doc.text(data, xPosition, yPosition);
        xPosition += colWidths[index];
      });
      yPosition += 8;
    });
    
    return yPosition + 20;
  };
  
  // PAGE 1: SCHEDULE (start immediately, no blank page)
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
  yPosition += 10;
  doc.text(`Start Time: ${schedule.config.startTime}`, margin, yPosition);
  yPosition += 20;
  
  // Schedule table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Session Schedule', margin, yPosition);
  yPosition += 15;
  
  const scheduleHeaders = ['Start Time', 'End Time', 'Group', 'Description'];
  const scheduleColWidths = [30, 30, 60, 50];
  const scheduleRows = schedule.sessions.map(session => [
    session.startTime,
    session.endTime,
    session.group,
    session.description
  ]);
  
  yPosition = drawTable(scheduleHeaders, scheduleColWidths, scheduleRows, yPosition);
  
  // PAGE 2: DRIVER GROUPS
  yPosition = addNewPage('Driver Groups');
  
  // Driver groups
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Driver Assignments', margin, yPosition);
  yPosition += 15;
  
  Object.entries(driverGroups).forEach(([groupName, drivers]) => {
    // Check if we need a new page
    const estimatedSpace = 20 + (drivers.length * 8) + 20;
    if (yPosition + estimatedSpace > pageHeight - 30) {
      yPosition = addNewPage('Driver Groups (Continued)');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Driver Assignments', margin, yPosition);
      yPosition += 15;
    }
    
    // Group header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${groupName} (${drivers.length} drivers)`, margin, yPosition);
    yPosition += 10;
    
    // Draw a box around the group
    const groupStartY = yPosition - 5;
    const groupHeight = (drivers.length * 8) + 10;
    
    // Group background
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, groupStartY, contentWidth, groupHeight, 'F');
    
    // Group border
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, groupStartY, contentWidth, groupHeight, 'S');
    
    // Driver list
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    drivers.forEach((driver, index) => {
      const driverY = yPosition + (index * 8);
      
      // Driver name
      doc.text(driver.name, margin + 5, driverY);
      
      // Skill level with color coding
      const skillX = margin + contentWidth - 40;
      doc.setFont('helvetica', 'bold');
      doc.text(driver.skillLevel.toUpperCase(), skillX, driverY);
      doc.setFont('helvetica', 'normal');
    });
    
    yPosition += groupHeight + 15;
  });
  
  // PAGE 3: DRIVER SUMMARY (if there are many drivers)
  const totalDrivers = Object.values(driverGroups).reduce((total, group) => total + group.length, 0);
  if (totalDrivers > 20) {
    yPosition = addNewPage('Driver Summary');
    
    // Create a summary table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Driver Summary by Skill Level', margin, yPosition);
    yPosition += 15;
    
    // Count drivers by skill level
    const skillCounts = { beginner: 0, intermediate: 0, advanced: 0 };
    Object.values(driverGroups).forEach(group => {
      group.forEach(driver => {
        skillCounts[driver.skillLevel]++;
      });
    });
    
    const summaryHeaders = ['Skill Level', 'Count', 'Percentage'];
    const summaryColWidths = [60, 30, 30];
    const summaryRows = [
      ['Beginner', skillCounts.beginner.toString(), `${Math.round((skillCounts.beginner / totalDrivers) * 100)}%`],
      ['Intermediate', skillCounts.intermediate.toString(), `${Math.round((skillCounts.intermediate / totalDrivers) * 100)}%`],
      ['Advanced', skillCounts.advanced.toString(), `${Math.round((skillCounts.advanced / totalDrivers) * 100)}%`],
      ['Total', totalDrivers.toString(), '100%']
    ];
    
    drawTable(summaryHeaders, summaryColWidths, summaryRows, yPosition);
  }
  
  // Save the PDF
  doc.save('track-day-schedule.pdf');
}
