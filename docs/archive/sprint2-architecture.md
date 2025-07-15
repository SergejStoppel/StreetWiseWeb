# Sprint 2 + Analysis Expansion: Modular Architecture

## Frontend Architecture

### 1. Report Display Modules

```
src/components/reports/
├── DetailedReport/
│   ├── index.js                 # Main detailed report container
│   ├── IssueTable/
│   │   ├── IssueTable.js       # Main table component
│   │   ├── IssueRow.js         # Individual row with expand/collapse
│   │   ├── IssueFilters.js     # Filter and sort controls
│   │   └── TablePagination.js  # Pagination controls
│   ├── IssueDetails/
│   │   ├── IssueExpanded.js    # Expanded issue view
│   │   ├── CodeExamples.js     # Before/after code display
│   │   ├── WcagMapping.js      # WCAG criteria details
│   │   └── RemediationSteps.js # Fix instructions
│   └── ExportControls/
│       ├── PDFExport.js        # PDF generation
│       └── CSVExport.js        # CSV data export
└── OverviewReport/
    ├── index.js                 # Current overview report
    └── CriticalIssues.js       # Enhanced from Sprint 1
```

### 2. Analysis Data Models

```
src/models/
├── AccessibilityIssue.js       # Issue data structure
├── WcagCriteria.js             # WCAG mapping data
├── CodeExample.js              # Code snippet structure
└── AnalysisReport.js           # Full report structure
```

### 3. Utilities and Services

```
src/utils/
├── codeHighlighting.js         # Syntax highlighting utilities
├── wcagLookup.js              # WCAG criteria lookup
├── domSelector.js             # DOM element utilities
└── reportFilters.js           # Filtering and sorting logic

src/services/
├── analysisAPI.js             # Enhanced API client
├── codeAnalyzer.js            # Code parsing utilities
└── reportGenerator.js         # Report generation logic
```

## Backend Architecture Expansion

### 1. Analysis Engine Modules

```
backend/src/analysis/
├── core/
│   ├── AnalysisEngine.js      # Main orchestrator
│   ├── IssueAggregator.js     # Combine results from multiple tools
│   └── ReportGenerator.js     # Format output
├── checkers/
│   ├── AxeChecker.js          # Axe-core integration
│   ├── WaveChecker.js         # WAVE API integration
│   ├── ManualChecker.js       # Manual testing guidelines
│   ├── KeyboardChecker.js     # Keyboard navigation
│   ├── ScreenReaderChecker.js # Screen reader compatibility
│   └── ColorChecker.js        # Color and contrast analysis
├── extractors/
│   ├── HTMLExtractor.js       # Extract HTML snippets
│   ├── CSSExtractor.js        # Extract relevant CSS
│   ├── JSExtractor.js         # Extract JavaScript context
│   └── DOMPathExtractor.js    # Generate DOM selectors
└── validators/
    ├── WcagValidator.js       # WCAG compliance validation
    ├── CodeValidator.js       # Code quality checks
    └── AccessibilityValidator.js # Overall accessibility validation
```

### 2. Data Models

```
backend/src/models/
├── AccessibilityIssue.js      # Issue structure
├── AnalysisResult.js          # Complete analysis result
├── WcagCriterion.js           # WCAG criteria model
└── CodeSnippet.js             # Code example model
```

### 3. Enhanced Issue Detection

```
backend/src/detectors/
├── FormAnalyzer.js            # Form accessibility
├── ImageAnalyzer.js           # Image and media
├── NavigationAnalyzer.js      # Navigation patterns
├── AriaAnalyzer.js            # ARIA implementation
├── HeadingAnalyzer.js         # Heading structure
├── ColorAnalyzer.js           # Color dependencies
├── KeyboardAnalyzer.js        # Keyboard accessibility
├── TouchTargetAnalyzer.js     # Touch target sizing
└── MotionAnalyzer.js          # Animation/motion sensitivity
```

## Implementation Strategy

### Phase 1: Backend Analysis Engine (Week 3)
1. **Core Engine Setup**
   - Create modular analysis engine
   - Implement issue aggregation
   - Add comprehensive checkers

2. **Enhanced Detection**
   - Expand from 5 to 50+ checks
   - Add element-specific reporting
   - Include DOM path extraction

### Phase 2: Frontend Report Structure (Week 4)
1. **Tabular Display**
   - Build sortable/filterable table
   - Add expandable rows
   - Implement pagination

2. **Enhanced Details**
   - Add code syntax highlighting
   - Create before/after examples
   - Build WCAG mapping display

### Phase 3: Integration & Testing (Week 4)
1. **API Integration**
   - Connect new analysis engine
   - Update report generation
   - Add export capabilities

2. **Testing & Optimization**
   - Test with real websites
   - Optimize performance
   - Validate accuracy

## Key Design Principles

1. **Modularity**: Each checker/component is independent
2. **Extensibility**: Easy to add new analysis types
3. **Performance**: Lazy loading and efficient data structures
4. **Maintainability**: Clear separation of concerns
5. **Testability**: Each module can be tested independently

## Technology Stack

- **Frontend**: React, Styled Components, Prism.js (syntax highlighting)
- **Backend**: Node.js, Express, Puppeteer (enhanced), Axe-core
- **Data Processing**: Lodash, Cheerio (HTML parsing)
- **Export**: jsPDF, Papa Parse (CSV)

This modular approach ensures we can incrementally enhance both the analysis depth and report presentation while maintaining code quality and performance.