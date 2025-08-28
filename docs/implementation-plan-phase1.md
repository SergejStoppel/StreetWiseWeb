# 🚀 Phase 1 Implementation Plan - Next Sprint (1-2 weeks)

## Overview
Complete the foundational accessibility analysis capabilities to achieve competitive parity with basic tools like WAVE and axe DevTools.

---

## 🎯 Sprint Goals

### Goal 1: Activate Missing axe-core Rules in Existing Workers
**Outcome**: Increase rule coverage from 34 to 45+ rules without new infrastructure

### Goal 2: Implement Keyboard Navigation Worker  
**Outcome**: Add critical keyboard accessibility testing (8 new rules)

### Goal 3: Add Media Analysis Capabilities
**Outcome**: Implement video/audio accessibility checking (3 new rules)

**Total New Rules**: +22 rules (from 34 to 56+ active rules)

---

## 📋 Task Breakdown

## **Task 1: Activate Missing axe-core Rules** 
*Estimated: 4-6 hours*

### **1.1 Enhance ARIA Worker** (2-3 hours)
**File**: `backend/src/core/workers/accessibility/aria.worker.ts`

**Current Rules**: 31 rules  
**Target**: 38+ rules

**Missing Rules to Activate**:
```typescript
// Add to runOnly array in aria.worker.ts
const newRulesToAdd = [
  // Missing ARIA rules
  'aria-braillelabel-equivalent',
  'aria-text', 
  'aria-treeitem-name',
  
  // Missing structural rules  
  'bypass',                    // Skip navigation links
  'landmark-one-main',         // Single main landmark
  'landmark-complementary-is-top-level', // Complementary landmarks
  'landmark-main-is-top-level', // Main landmark placement
  'page-has-heading-one',      // H1 presence check
  'landmark-unique',           // Unique landmark labels
  
  // Missing list and table rules
  'list',                      // Proper list structure
  'listitem',                  // List item structure
  'definition-list',           // Definition list structure
];
```

**Implementation Steps**:
1. Review current `runOnly` array in aria.worker.ts:350-407
2. Add missing rules to both `rules` config and `runOnly` array
3. Test with sample violations to ensure rules fire correctly
4. Update rule mapping to match database rule keys

### **1.2 Enhance Color Contrast Worker** (1-2 hours)
**File**: `backend/src/core/workers/accessibility/colorContrast.worker.ts`

**Current Rules**: 3 rules  
**Target**: 5+ rules

**Missing Rules to Activate**:
```typescript
// Add to runOnly array
const newColorRules = [
  'focus-order-semantics',     // Focus indicator testing
  'scrollable-region-focusable', // Scrollable area focus
];
```

### **1.3 Update Rule Mapping** (1 hour)
**File**: Need to create mapping utility

Create mapping between axe-core rule IDs and database rule keys:
```typescript
// backend/src/core/workers/accessibility/ruleMapping.ts
export const AXE_TO_DATABASE_MAPPING = {
  // ARIA rules
  'aria-braillelabel-equivalent': 'ACC_ARIA_11_BRAILLE_EQUIVALENT',
  'bypass': 'ACC_STR_08_SKIP_LINK_MISSING',
  'landmark-one-main': 'ACC_STR_10_LANDMARK_MISSING',
  'page-has-heading-one': 'ACC_STR_02_NO_H1',
  'list': 'ACC_STR_12_LIST_STRUCTURE_INVALID',
  // ... continue mapping
};
```

## **Task 2: Implement Keyboard Navigation Worker**
*Estimated: 12-16 hours*

### **2.1 Create Keyboard Worker File** (8-10 hours)
**New File**: `backend/src/core/workers/accessibility/keyboard.worker.ts`

**Architecture Pattern**: Follow existing aria.worker.ts structure

**Rules to Implement** (8 rules):
```typescript
const keyboardRules = [
  'tabindex',                  // Positive tabindex issues  
  'focus-order-semantics',     // Logical focus order
  'focusable-content',         // Interactive elements focusable
  'focus-order-semantics',     // Tab order validation
  'accesskeys',                // Duplicate access keys
  'skip-link',                 // Skip link functionality
];
```

**Implementation Approach**:
```typescript
interface KeyboardJobData {
  analysisId: string;
  workspaceId: string;
  websiteId: string;
  userId: string;
  assetPath: string;
  metadata: any;
}

async function processKeyboardAnalysis(job: Job<KeyboardJobData>) {
  const { analysisId, workspaceId, assetPath } = job.data;
  
  // 1. Load stored HTML from Supabase Storage
  const htmlContent = await loadStoredAsset(assetPath, 'html/index.html');
  
  // 2. Launch Puppeteer with stored HTML
  const browser = await puppeteer.launch(config.puppeteer.options);
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  
  // 3. Inject axe-core and run keyboard-specific rules
  await page.addScriptTag({ path: require.resolve('axe-core') });
  
  const results = await page.evaluate(() => {
    const axeConfig = {
      rules: {
        'tabindex': { enabled: true },
        'focus-order-semantics': { enabled: true },
        'focusable-content': { enabled: true },
        'accesskeys': { enabled: true },
        'skip-link': { enabled: true },
      },
      runOnly: ['tabindex', 'focus-order-semantics', 'focusable-content', 'accesskeys', 'skip-link']
    };
    
    return (globalThis as any).axe.run(globalThis.document, axeConfig);
  });
  
  // 4. Process violations and store in database
  await processViolations(results.violations, analysisId, 'keyboard');
  
  await browser.close();
}
```

### **2.2 Advanced Keyboard Testing** (2-3 hours)
**Enhanced Detection Methods**:

```typescript
// Advanced keyboard testing beyond basic axe rules
async function advancedKeyboardTesting(page: Page) {
  // Test 1: Keyboard trap detection
  const keyboardTraps = await page.evaluate(() => {
    // Simulate tab navigation through all focusable elements
    const focusableElements = document.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    
    // Check for elements that trap focus
    // Implementation: Tab through elements and detect if focus gets stuck
  });
  
  // Test 2: Focus visibility testing  
  const focusVisibility = await page.evaluate(() => {
    // Check if focus indicators are visible and meet contrast requirements
    // This goes beyond basic axe checking
  });
  
  // Test 3: Custom keyboard shortcuts detection
  const shortcutConflicts = await page.evaluate(() => {
    // Detect if page uses keyboard shortcuts that conflict with assistive tech
  });
}
```

### **2.3 Integration & Queue Setup** (2-3 hours)

**Update Master Worker**:
```typescript
// backend/src/core/workers/master.worker.ts
// Add keyboard worker to the parallel analysis jobs

const analyzerJobs = [
  { queue: 'accessibility-aria', type: 'analyze-aria' },
  { queue: 'accessibility-color', type: 'analyze-color-contrast' },
  { queue: 'accessibility-keyboard', type: 'analyze-keyboard', }, // NEW
];
```

**Create Queue Configuration**:
```typescript
// backend/src/lib/queue/keyboard.ts
import { Queue, Worker } from 'bullmq';
import { config } from '@/config';

export const keyboardQueue = new Queue('accessibility-keyboard', {
  connection: config.redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: 'exponential'
  }
});
```

## **Task 3: Add Media Analysis Capabilities**
*Estimated: 8-10 hours*

### **3.1 Create Media Worker File** (6-8 hours)  
**New File**: `backend/src/core/workers/accessibility/media.worker.ts`

**Rules to Implement** (3 rules):
- Video caption detection
- Audio transcript validation  
- Media control accessibility

**Implementation Approach**:
```typescript
async function processMediaAnalysis(job: Job<MediaJobData>) {
  const { analysisId, workspaceId, assetPath } = job.data;
  
  // 1. Load stored HTML
  const htmlContent = await loadStoredAsset(assetPath, 'html/index.html');
  const browser = await puppeteer.launch(config.puppeteer.options);
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  
  // 2. Detect media elements
  const mediaElements = await page.evaluate(() => {
    const videos = Array.from(document.querySelectorAll('video'));
    const audios = Array.from(document.querySelectorAll('audio')); 
    const embeds = Array.from(document.querySelectorAll('iframe[src*="youtube"], iframe[src*="vimeo"]'));
    
    return {
      videos: videos.map(v => ({
        src: v.src,
        hasControls: v.hasAttribute('controls'),
        hasCaptions: v.querySelector('track[kind="captions"]') !== null,
        hasSubtitles: v.querySelector('track[kind="subtitles"]') !== null,
        html: v.outerHTML
      })),
      audios: audios.map(a => ({
        src: a.src,
        hasControls: a.hasAttribute('controls'),
        hasTranscript: false, // Need to detect nearby transcript links
        html: a.outerHTML
      })),
      embeds: embeds.map(e => ({
        src: e.src,
        title: e.title,
        html: e.outerHTML
      }))
    };
  });
  
  // 3. Analyze each media element
  const violations = [];
  
  // Check videos for captions
  for (const video of mediaElements.videos) {
    if (!video.hasCaptions && !video.hasSubtitles) {
      violations.push({
        ruleId: 'ACC_MED_01_VIDEO_CAPTIONS',
        severity: 'critical',
        element: video.html,
        message: 'Video missing captions or subtitles',
        impact: 'critical'
      });
    }
  }
  
  // Check audio for transcripts  
  for (const audio of mediaElements.audios) {
    if (!audio.hasTranscript) {
      violations.push({
        ruleId: 'ACC_MED_02_AUDIO_TRANSCRIPT', 
        severity: 'critical',
        element: audio.html,
        message: 'Audio content missing transcript',
        impact: 'critical'
      });
    }
  }
  
  // Store violations in database
  await processViolations(violations, analysisId, 'media');
  
  await browser.close();
}
```

### **3.2 Enhanced Media Detection** (2 hours)
**Advanced Media Analysis**:

```typescript
// Detect transcript links near audio elements
async function detectTranscripts(page: Page, audioElement: any) {
  const hasTranscript = await page.evaluate((audio) => {
    // Look for transcript links within 200px of audio element
    const audioRect = audio.getBoundingClientRect();
    const transcriptKeywords = ['transcript', 'text version', 'audio description'];
    
    const nearbyLinks = Array.from(document.querySelectorAll('a'))
      .filter(link => {
        const linkRect = link.getBoundingClientRect();
        const distance = Math.sqrt(
          Math.pow(linkRect.left - audioRect.left, 2) + 
          Math.pow(linkRect.top - audioRect.top, 2)
        );
        return distance < 200;
      });
    
    return nearbyLinks.some(link => 
      transcriptKeywords.some(keyword => 
        link.textContent?.toLowerCase().includes(keyword)
      )
    );
  }, audioElement);
  
  return hasTranscript;
}

// Detect embedded video captions (YouTube, Vimeo)
async function detectEmbeddedCaptions(embedSrc: string) {
  // Check if YouTube/Vimeo videos have captions enabled
  // This might require API calls to video platforms
}
```

## **Task 4: Integration & Testing**
*Estimated: 6-8 hours*

### **4.1 Update Master Worker Integration** (2 hours)
```typescript
// Add new workers to master worker orchestration
const analyzerJobs = [
  { queue: 'accessibility-aria', type: 'analyze-aria' },
  { queue: 'accessibility-color', type: 'analyze-color-contrast' },
  { queue: 'accessibility-keyboard', type: 'analyze-keyboard' }, // NEW
  { queue: 'accessibility-media', type: 'analyze-media' },       // NEW
];
```

### **4.2 Database Integration** (2 hours)  
**Update rule mappings and ensure all new rules are properly mapped to database entries**

### **4.3 Testing & Validation** (2-4 hours)
**Create test cases for each new worker**:
```typescript
// backend/src/core/workers/accessibility/__tests__/keyboard.worker.test.ts
// backend/src/core/workers/accessibility/__tests__/media.worker.test.ts
```

**Test scenarios**:
- Keyboard navigation issues
- Missing video captions
- Audio without transcripts
- Integration with master worker

---

## 📊 Success Metrics

### **Before Sprint**:
- 34 active accessibility rules
- 2 accessibility workers  
- Basic WCAG coverage

### **After Sprint** ✅ **IMPLEMENTED**:
- **45+ active accessibility rules** (+32% increase from 34 rules)
  - ARIA Worker: 34 rules (added 12 new structural & ARIA rules)
  - Color Contrast Worker: 5 rules (added 2 focus-related rules) 
  - Keyboard Worker: 6+ rules (new worker with custom testing)
  - Media Worker: 3+ rules (new worker with embedded media support)
- **4 accessibility workers** (+100% increase from 2 workers)
- **Comprehensive WCAG coverage** including keyboard navigation and media accessibility
- **Competitive with WAVE/axe DevTools** basic functionality
- **Advanced features**: Custom keyboard testing, embedded video analysis, proximity-based transcript detection

---

## 🚨 Risk Mitigation

### **Risk 1: axe-core Rule Compatibility**
**Mitigation**: Test each new rule individually with known violations

### **Risk 2: Performance Impact**  
**Mitigation**: Run workers in parallel, monitor queue performance

### **Risk 3: False Positives**
**Mitigation**: Validate rule mappings with manual testing

---

## 📋 Checklist

**Task 1: Activate Missing Rules** ✅ **COMPLETED**
- [x] Add 12 new rules to ARIA worker (9 structural + 3 ARIA)
- [x] Add 2 new rules to Color Contrast worker (focus-order-semantics, scrollable-region-focusable)
- [x] Create centralized rule mapping utility (ruleMapping.ts)
- [x] Update both workers to use centralized mappings

**Task 2: Keyboard Worker** ✅ **COMPLETED**
- [x] Create keyboard.worker.ts file with full architecture
- [x] Implement 6 axe-core keyboard rules (tabindex, focus-order-semantics, etc.)
- [x] Add 3 advanced custom keyboard testing functions
- [x] Create keyboard queue configuration (keyboard.ts)
- [x] Update master worker integration

**Task 3: Media Worker** ✅ **COMPLETED**
- [x] Create media.worker.ts file with comprehensive analysis
- [x] Implement video caption detection (HTML5 video + track elements)
- [x] Implement audio transcript detection (proximity-based)
- [x] Add embedded media analysis (YouTube, Vimeo iframe detection)
- [x] Create media queue configuration (media.ts)
- [x] Add complex image detection (charts, graphs needing descriptions)

**Task 4: Integration** ✅ **COMPLETED**
- [x] Update master worker orchestration (added keyboard + media queues)
- [x] Verify database rule mappings (centralized in ruleMapping.ts)
- [x] Job coordination between all 4 accessibility workers
- [ ] **PENDING**: Create test cases for new workers
- [ ] **PENDING**: End-to-end testing

**Final Validation** 🟡 **READY FOR TESTING**
- [ ] **READY**: All 45+ rules active and firing correctly
- [ ] **READY**: Performance benchmarks maintained  
- [ ] **READY**: No regressions in existing functionality
- [ ] **READY**: Documentation updated

---

## 🎯 Next Sprint Preview

After completing Phase 1, the next sprint will focus on:
1. Advanced visual analysis features
2. Dynamic content testing capabilities  
3. Business impact scoring system foundation

This sprint establishes the technical foundation needed for advanced competitive features in subsequent sprints.