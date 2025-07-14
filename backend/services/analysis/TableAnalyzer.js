const logger = require('../../utils/logger');
const AnalysisUtils = require('../utils/AnalysisUtils');

class TableAnalyzer {
  
  async analyze(page, analysisId) {
    try {
      logger.info('Running table analysis', { analysisId });
      
      const tableData = await page.evaluate(() => {
        const results = {
          // Basic table statistics
          totalTables: document.querySelectorAll('table').length,
          tablesForLayout: 0, // Deprecated practice
          tablesForData: 0,
          
          // Table accessibility analysis
          tableAnalysis: (() => {
            const tables = Array.from(document.querySelectorAll('table'));
            if (tables.length === 0) return null;
            
            const analysisData = {
              total: tables.length,
              withCaption: 0,
              withSummary: 0,
              withHeaders: 0,
              withThead: 0,
              withTbody: 0,
              withTfoot: 0,
              withScope: 0,
              withId: 0,
              withRole: 0,
              complexTables: 0,
              tablesTooLarge: 0,
              issues: []
            };
            
            const tableDetails = [];
            
            tables.forEach((table, index) => {
              const tableInfo = {
                index,
                hasCaption: !!table.querySelector('caption'),
                hasSummary: !!table.getAttribute('summary'),
                hasHeaders: false,
                hasThead: !!table.querySelector('thead'),
                hasTbody: !!table.querySelector('tbody'),
                hasTfoot: !!table.querySelector('tfoot'),
                hasScope: false,
                hasId: !!table.id,
                hasRole: !!table.getAttribute('role'),
                rowCount: table.querySelectorAll('tr').length,
                columnCount: 0,
                isComplex: false,
                issues: []
              };
              
              // Count columns (use first row as reference)
              const firstRow = table.querySelector('tr');
              if (firstRow) {
                tableInfo.columnCount = firstRow.querySelectorAll('td, th').length;
              }
              
              // Check if table is too large (accessibility concern)
              if (tableInfo.rowCount > 20 || tableInfo.columnCount > 10) {
                tableInfo.isComplex = true;
                analysisData.tablesTooLarge++;
              }
              
              // Check for header cells
              const headerCells = table.querySelectorAll('th');
              if (headerCells.length > 0) {
                tableInfo.hasHeaders = true;
                analysisData.withHeaders++;
                
                // Check for scope attributes
                const withScope = Array.from(headerCells).filter(th => th.getAttribute('scope'));
                if (withScope.length > 0) {
                  tableInfo.hasScope = true;
                  analysisData.withScope++;
                }
                
                // Check for proper scope usage in complex tables
                if (tableInfo.rowCount > 3 && tableInfo.columnCount > 3) {
                  tableInfo.isComplex = true;
                  analysisData.complexTables++;
                  
                  if (withScope.length === 0) {
                    tableInfo.issues.push('Complex table missing scope attributes');
                  }
                }
              } else {
                tableInfo.issues.push('Table has no header cells (th elements)');
              }
              
              // Check for caption
              if (tableInfo.hasCaption) {
                analysisData.withCaption++;
                const caption = table.querySelector('caption');
                if (!caption.textContent.trim()) {
                  tableInfo.issues.push('Table caption is empty');
                }
              } else {
                tableInfo.issues.push('Table missing caption');
              }
              
              // Check for summary (deprecated but still used)
              if (tableInfo.hasSummary) {
                analysisData.withSummary++;
                if (!table.getAttribute('summary').trim()) {
                  tableInfo.issues.push('Table summary is empty');
                }
              }
              
              // Check for proper table structure
              if (!tableInfo.hasThead && headerCells.length > 0) {
                tableInfo.issues.push('Header cells not wrapped in thead element');
              }
              
              if (tableInfo.hasThead) {
                analysisData.withThead++;
              }
              
              if (tableInfo.hasTbody) {
                analysisData.withTbody++;
              }
              
              if (tableInfo.hasTfoot) {
                analysisData.withTfoot++;
              }
              
              if (tableInfo.hasId) {
                analysisData.withId++;
              }
              
              if (tableInfo.hasRole) {
                analysisData.withRole++;
              }
              
              // Check for layout tables (deprecated)
              if (table.getAttribute('role') === 'presentation' || 
                  table.getAttribute('role') === 'none' ||
                  (headerCells.length === 0 && !tableInfo.hasCaption)) {
                analysisData.tablesForLayout++;
              } else {
                analysisData.tablesForData++;
              }
              
              // Collect all issues
              analysisData.issues.push(...tableInfo.issues.map(issue => ({
                tableIndex: index,
                issue,
                severity: issue.includes('missing') || issue.includes('no header') ? 'high' : 'medium'
              })));
              
              tableDetails.push(tableInfo);
            });
            
            analysisData.tableDetails = tableDetails;
            return analysisData;
          })(),
          
          // Headers and data cells analysis
          cellAnalysis: (() => {
            const allTh = Array.from(document.querySelectorAll('th'));
            const allTd = Array.from(document.querySelectorAll('td'));
            
            const cellData = {
              totalHeaderCells: allTh.length,
              totalDataCells: allTd.length,
              headerCellsWithScope: allTh.filter(th => th.getAttribute('scope')).length,
              headerCellsWithId: allTh.filter(th => th.id).length,
              dataCellsWithHeaders: allTd.filter(td => td.getAttribute('headers')).length,
              emptyHeaderCells: allTh.filter(th => !th.textContent.trim()).length,
              emptyDataCells: allTd.filter(td => !td.textContent.trim()).length,
              scopeUsage: {
                col: allTh.filter(th => th.getAttribute('scope') === 'col').length,
                row: allTh.filter(th => th.getAttribute('scope') === 'row').length,
                colgroup: allTh.filter(th => th.getAttribute('scope') === 'colgroup').length,
                rowgroup: allTh.filter(th => th.getAttribute('scope') === 'rowgroup').length
              }
            };
            
            return cellData;
          })(),
          
          // Responsive table analysis
          responsiveAnalysis: (() => {
            const tables = Array.from(document.querySelectorAll('table'));
            const responsiveData = {
              tablesInScrollableContainers: 0,
              tablesWithHorizontalScroll: 0,
              tablesWithResponsiveClass: 0,
              potentialMobileIssues: 0
            };
            
            tables.forEach(table => {
              // Check if table is in a scrollable container
              const scrollableParent = table.closest('.table-responsive, .overflow-auto, .overflow-x-auto, [style*="overflow"]');
              if (scrollableParent) {
                responsiveData.tablesInScrollableContainers++;
              }
              
              // Check for responsive classes
              const responsiveClasses = ['table-responsive', 'responsive-table', 'scroll-table'];
              if (responsiveClasses.some(cls => table.classList.contains(cls) || table.closest(`.${cls}`))) {
                responsiveData.tablesWithResponsiveClass++;
              }
              
              // Check table width
              const rect = table.getBoundingClientRect();
              if (rect.width > window.innerWidth) {
                responsiveData.tablesWithHorizontalScroll++;
              }
              
              // Check for potential mobile issues (many columns)
              const columnCount = table.querySelector('tr')?.querySelectorAll('td, th').length || 0;
              if (columnCount > 5) {
                responsiveData.potentialMobileIssues++;
              }
            });
            
            return responsiveData;
          })()
        };

        return results;
      });

      return tableData;
    } catch (error) {
      logger.error('Table analysis failed:', { error: error.message, analysisId });
      throw error;
    }
  }

  calculateScore(tableData) {
    if (!tableData || tableData.totalTables === 0) return 100; // No tables to evaluate
    
    let score = 100;
    const tableAnalysis = tableData.tableAnalysis;
    
    if (!tableAnalysis) return score;
    
    // Penalize tables without captions
    if (tableAnalysis.withCaption < tableAnalysis.total) {
      const missingCaptions = tableAnalysis.total - tableAnalysis.withCaption;
      score -= Math.min(missingCaptions * 15, 40);
    }
    
    // Penalize tables without headers
    if (tableAnalysis.withHeaders < tableAnalysis.total) {
      const missingHeaders = tableAnalysis.total - tableAnalysis.withHeaders;
      score -= Math.min(missingHeaders * 20, 50);
    }
    
    // Penalize complex tables without scope attributes
    if (tableAnalysis.complexTables > 0 && tableAnalysis.withScope === 0) {
      score -= Math.min(tableAnalysis.complexTables * 15, 30);
    }
    
    // Penalize empty header cells
    if (tableData.cellAnalysis?.emptyHeaderCells > 0) {
      score -= Math.min(tableData.cellAnalysis.emptyHeaderCells * 10, 25);
    }
    
    // Penalize layout tables (deprecated practice)
    if (tableData.tablesForLayout > 0) {
      score -= Math.min(tableData.tablesForLayout * 10, 20);
    }
    
    // Slight penalty for tables without proper structure
    if (tableAnalysis.withThead < tableAnalysis.withHeaders) {
      score -= 5;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  generateRecommendations(tableData, language = 'en') {
    const recommendations = [];
    
    if (!tableData || tableData.totalTables === 0) return recommendations;
    
    const tableAnalysis = tableData.tableAnalysis;
    if (!tableAnalysis) return recommendations;
    
    // Tables without captions
    if (tableAnalysis.withCaption < tableAnalysis.total) {
      const missingCaptions = tableAnalysis.total - tableAnalysis.withCaption;
      recommendations.push({
        type: 'table',
        priority: 'high',
        issue: 'Tables without captions',
        description: `Found ${missingCaptions} tables without caption elements`,
        suggestion: 'Add <caption> elements to describe the purpose and content of each table'
      });
    }
    
    // Tables without headers
    if (tableAnalysis.withHeaders < tableAnalysis.total) {
      const missingHeaders = tableAnalysis.total - tableAnalysis.withHeaders;
      recommendations.push({
        type: 'table',
        priority: 'high',
        issue: 'Tables without header cells',
        description: `Found ${missingHeaders} tables without th (header) elements`,
        suggestion: 'Use <th> elements to mark header cells in tables'
      });
    }
    
    // Complex tables without scope attributes
    if (tableAnalysis.complexTables > 0 && tableAnalysis.withScope === 0) {
      recommendations.push({
        type: 'table',
        priority: 'high',
        issue: 'Complex tables without scope attributes',
        description: `Found ${tableAnalysis.complexTables} complex tables without scope attributes`,
        suggestion: 'Add scope="col" or scope="row" attributes to header cells in complex tables'
      });
    }
    
    // Empty header cells
    if (tableData.cellAnalysis?.emptyHeaderCells > 0) {
      recommendations.push({
        type: 'table',
        priority: 'medium',
        issue: 'Empty header cells',
        description: `Found ${tableData.cellAnalysis.emptyHeaderCells} empty header cells`,
        suggestion: 'Provide meaningful text content for all header cells'
      });
    }
    
    // Layout tables (deprecated)
    if (tableData.tablesForLayout > 0) {
      recommendations.push({
        type: 'table',
        priority: 'medium',
        issue: 'Tables used for layout',
        description: `Found ${tableData.tablesForLayout} tables used for layout purposes`,
        suggestion: 'Use CSS Grid or Flexbox instead of tables for layout. Reserve tables for tabular data only'
      });
    }
    
    // Tables without proper structure
    if (tableAnalysis.withThead < tableAnalysis.withHeaders) {
      const missingThead = tableAnalysis.withHeaders - tableAnalysis.withThead;
      recommendations.push({
        type: 'table',
        priority: 'medium',
        issue: 'Tables without thead elements',
        description: `Found ${missingThead} tables with headers not wrapped in thead elements`,
        suggestion: 'Wrap header rows in <thead> elements for better structure'
      });
    }
    
    // Large tables without responsive design
    if (tableData.responsiveAnalysis?.potentialMobileIssues > 0) {
      recommendations.push({
        type: 'table',
        priority: 'medium',
        issue: 'Tables may not be mobile-friendly',
        description: `Found ${tableData.responsiveAnalysis.potentialMobileIssues} tables with many columns that may cause mobile usability issues`,
        suggestion: 'Consider making tables responsive or providing alternative views for mobile devices'
      });
    }
    
    // Tables without data association in complex scenarios
    if (tableData.cellAnalysis?.totalDataCells > 20 && tableData.cellAnalysis?.dataCellsWithHeaders === 0) {
      recommendations.push({
        type: 'table',
        priority: 'low',
        issue: 'Large tables without explicit data cell associations',
        description: 'Consider adding headers attributes to data cells in large or complex tables',
        suggestion: 'Use headers attributes on td elements to explicitly associate data cells with header cells'
      });
    }
    
    return recommendations;
  }
}

module.exports = TableAnalyzer;