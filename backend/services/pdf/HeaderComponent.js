/**
 * HeaderComponent - PDF document header and branding
 * 
 * This module handles the creation of professional document headers including
 * company branding, report type badges, website information, and decorative elements.
 * It provides a consistent visual identity across all accessibility reports.
 */

const BasePDFDocument = require('./BasePDFDocument');

class HeaderComponent extends BasePDFDocument {
  /**
   * Add the main document header with branding and report information
   */
  addDocumentHeader(doc, reportData) {
    // Professional header background
    doc.rect(0, 0, this.pageWidth, 120)
       .fill(this.primaryColor);
    
    // Company branding
    doc.fontSize(28)
       .fillColor('white')
       .text('SiteCraft', this.margins.left, 30, { align: 'left' })
       .fontSize(16)
       .fillColor('white')
       .text('Professional Accessibility Analysis', this.margins.left, 65);
    
    // Report type badge
    const badgeX = 400;
    doc.rect(badgeX, 35, 120, 25)
       .fill('white')
       .fontSize(12)
       .fillColor(this.primaryColor)
       .text('DETAILED REPORT', badgeX + 10, 43, { width: 100, align: 'center' });
    
    // Website information section
    doc.rect(0, 120, this.pageWidth, 80)
       .fill(this.backgroundColor);
    
    doc.fontSize(20)
       .fillColor(this.textColor)
       .text('Website Analysis Report', this.margins.left, 140)
       .fontSize(12)
       .fillColor(this.grayColor)
       .text(`URL: ${reportData.url}`, this.margins.left, 170)
       .text(`Generated: ${this.formatDate(reportData.timestamp)}`, 300, 170)
       .text(`Analysis ID: ${reportData.analysisId}`, this.margins.left, 185);
    
    // Decorative border
    doc.rect(this.margins.left, 220, this.contentWidth, 2)
       .fill(this.primaryColor);
    
    doc.y = 250;
    
    // Add footer to first page
    this.addFooterToCurrentPage(doc);
    
    return doc.y;
  }

  /**
   * Add a page header for subsequent pages
   */
  addPageHeader(doc, sectionTitle = '') {
    // Simplified header for continuation pages
    doc.rect(0, 0, this.pageWidth, 60)
       .fill(this.backgroundColor);
    
    doc.fontSize(14)
       .fillColor(this.primaryColor)
       .text('SiteCraft', this.margins.left, 20)
       .fontSize(10)
       .fillColor(this.grayColor)
       .text(sectionTitle, this.margins.left, 35);
    
    // Add thin decorative line
    doc.rect(this.margins.left, 50, this.contentWidth, 1)
       .fill(this.borderColor);
    
    doc.y = 70;
    return doc.y;
  }

  /**
   * Format timestamp for display
   */
  formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    });
  }

  /**
   * Add company watermark (subtle branding for professional appearance)
   */
  addWatermark(doc) {
    const currentY = doc.y;
    
    doc.fontSize(60)
       .fillColor('#f8fafc')
       .text('SiteCraft', 200, 400, { 
         align: 'center',
         opacity: 0.1,
         rotate: -45
       });
    
    doc.y = currentY;
  }

  /**
   * Add professional footer with page numbering and report info
   */
  addReportFooter(doc, reportData, pageNumber) {
    const footerY = this.pageHeight - 40;
    
    // Footer background
    doc.rect(0, footerY - 10, this.pageWidth, 50)
       .fill(this.backgroundColor);
    
    // Footer content
    doc.fontSize(8)
       .fillColor(this.grayColor)
       .text(`SiteCraft Accessibility Report - ${reportData.url}`, this.margins.left, footerY, { width: 400 })
       .text(`Page ${pageNumber}`, this.pageWidth - 100, footerY, { width: 50, align: 'right' });
    
    // Add subtle line above footer
    doc.rect(this.margins.left, footerY - 5, this.contentWidth, 1)
       .fill(this.borderColor);
  }
}

module.exports = HeaderComponent;