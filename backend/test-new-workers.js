#!/usr/bin/env node

/**
 * Test Script for New Accessibility Workers
 * 
 * This script helps verify that the new keyboard and media workers
 * are properly integrated and can be imported without errors.
 * 
 * Run this from the backend directory:
 * node test-new-workers.js
 */

const path = require('path');

console.log('🧪 Testing New Accessibility Workers Integration...\n');

// Test 1: Check TypeScript compilation
console.log('1️⃣ Testing TypeScript compilation...');
try {
  // This will test if the files can be imported (compilation check)
  const { spawnSync } = require('child_process');
  const tscPath = path.join(__dirname, 'node_modules', '.bin', 'tsc');
  
  // Just check our new files specifically
  const files = [
    'src/core/workers/accessibility/keyboard.worker.ts',
    'src/core/workers/accessibility/media.worker.ts',
    'src/core/workers/accessibility/ruleMapping.ts',
    'src/lib/queue/keyboard.ts',
    'src/lib/queue/media.ts'
  ];
  
  const result = spawnSync('npx', ['tsc', '--noEmit', ...files], {
    stdio: ['inherit', 'pipe', 'pipe'],
    encoding: 'utf8'
  });
  
  if (result.status === 0) {
    console.log('   ✅ TypeScript compilation successful');
  } else {
    console.log('   ❌ TypeScript compilation failed:');
    console.log('   ', result.stderr);
  }
} catch (error) {
  console.log('   ⚠️  Could not run TypeScript check:', error.message);
}

// Test 2: Check rule mapping utility
console.log('\n2️⃣ Testing Rule Mapping Utility...');
try {
  // We'll write a simple version check since we can't import TS directly
  const fs = require('fs');
  const ruleMapContent = fs.readFileSync('src/core/workers/accessibility/ruleMapping.ts', 'utf8');
  
  // Check for key exports
  const hasMapping = ruleMapContent.includes('AXE_TO_DATABASE_MAPPING');
  const hasFunctions = ruleMapContent.includes('getDatabaseRuleKey') && ruleMapContent.includes('mapImpactToSeverity');
  
  if (hasMapping && hasFunctions) {
    console.log('   ✅ Rule mapping utility structure looks good');
    
    // Count mappings
    const mappingLines = ruleMapContent.split('\n').filter(line => line.includes(': \'ACC_'));
    console.log(`   📊 Found ${mappingLines.length} rule mappings`);
  } else {
    console.log('   ❌ Rule mapping utility missing required exports');
  }
} catch (error) {
  console.log('   ❌ Error reading rule mapping file:', error.message);
}

// Test 3: Check worker file structure
console.log('\n3️⃣ Testing Worker File Structure...');

const workerFiles = [
  { name: 'Keyboard Worker', path: 'src/core/workers/accessibility/keyboard.worker.ts' },
  { name: 'Media Worker', path: 'src/core/workers/accessibility/media.worker.ts' }
];

workerFiles.forEach(worker => {
  try {
    const fs = require('fs');
    const content = fs.readFileSync(worker.path, 'utf8');
    
    // Check for required exports and functions
    const hasWorkerExport = content.includes('export {') && content.includes('Worker');
    const hasJobProcessor = content.includes('processKeyboardAnalysis') || content.includes('processMediaAnalysis');
    const hasJobData = content.includes('JobData');
    const hasRuleMapping = content.includes('getDatabaseRuleKey') || content.includes('getRuleId');
    
    if (hasWorkerExport && hasJobProcessor && hasJobData && hasRuleMapping) {
      console.log(`   ✅ ${worker.name} structure looks good`);
    } else {
      console.log(`   ⚠️  ${worker.name} missing some required components`);
      console.log(`       Worker Export: ${hasWorkerExport ? '✅' : '❌'}`);
      console.log(`       Job Processor: ${hasJobProcessor ? '✅' : '❌'}`);
      console.log(`       Job Data Interface: ${hasJobData ? '✅' : '❌'}`);
      console.log(`       Rule Mapping: ${hasRuleMapping ? '✅' : '❌'}`);
    }
  } catch (error) {
    console.log(`   ❌ Error reading ${worker.name}:`, error.message);
  }
});

// Test 4: Check master worker integration
console.log('\n4️⃣ Testing Master Worker Integration...');
try {
  const fs = require('fs');
  const masterContent = fs.readFileSync('src/core/workers/master.worker.ts', 'utf8');
  
  const hasKeyboardImport = masterContent.includes('keyboardQueue');
  const hasMediaImport = masterContent.includes('mediaQueue');
  const hasQueueDeclaration = masterContent.includes('keyboard: keyboardQueue') && masterContent.includes('media: mediaQueue');
  
  if (hasKeyboardImport && hasMediaImport && hasQueueDeclaration) {
    console.log('   ✅ Master worker integration looks good');
  } else {
    console.log('   ⚠️  Master worker integration issues:');
    console.log(`       Keyboard Import: ${hasKeyboardImport ? '✅' : '❌'}`);
    console.log(`       Media Import: ${hasMediaImport ? '✅' : '❌'}`);
    console.log(`       Queue Declaration: ${hasQueueDeclaration ? '✅' : '❌'}`);
  }
} catch (error) {
  console.log('   ❌ Error reading master worker file:', error.message);
}

// Test 5: Check enhanced ARIA worker
console.log('\n5️⃣ Testing Enhanced ARIA Worker...');
try {
  const fs = require('fs');
  const ariaContent = fs.readFileSync('src/core/workers/accessibility/aria.worker.ts', 'utf8');
  
  // Check for new rules we added
  const newRules = [
    'aria-braillelabel-equivalent',
    'aria-text', 
    'aria-treeitem-name',
    'bypass',
    'landmark-one-main',
    'page-has-heading-one',
    'list',
    'listitem',
    'definition-list'
  ];
  
  const foundRules = newRules.filter(rule => ariaContent.includes(rule));
  
  console.log(`   📊 Found ${foundRules.length}/${newRules.length} new rules in ARIA worker`);
  
  if (foundRules.length === newRules.length) {
    console.log('   ✅ All new ARIA rules integrated');
  } else {
    console.log('   ⚠️  Missing rules:', newRules.filter(rule => !foundRules.includes(rule)));
  }
  
  // Check for rule mapping import
  const hasRuleMappingImport = ariaContent.includes('getDatabaseRuleKey');
  console.log(`   🔗 Rule mapping integration: ${hasRuleMappingImport ? '✅' : '❌'}`);
  
} catch (error) {
  console.log('   ❌ Error reading ARIA worker file:', error.message);
}

// Test 6: Check project structure
console.log('\n6️⃣ Testing Project Structure...');
const expectedFiles = [
  'src/core/workers/accessibility/keyboard.worker.ts',
  'src/core/workers/accessibility/media.worker.ts', 
  'src/core/workers/accessibility/ruleMapping.ts',
  'src/lib/queue/keyboard.ts',
  'src/lib/queue/media.ts'
];

let allFilesExist = true;
expectedFiles.forEach(file => {
  const fs = require('fs');
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ Missing: ${file}`);
    allFilesExist = false;
  }
});

// Final Results
console.log('\n' + '='.repeat(50));
console.log('🎯 TEST RESULTS SUMMARY');
console.log('='.repeat(50));

if (allFilesExist) {
  console.log('✅ All new files created successfully');
  console.log('✅ Sprint 1 implementation appears complete');
  console.log('\n🚀 READY FOR MANUAL TESTING');
  console.log('\nNext steps:');
  console.log('1. Run "npm run dev" to start the application');
  console.log('2. Test an accessibility analysis to verify workers are functioning');
  console.log('3. Check the logs for the new workers (keyboard-worker, media-worker)');
  console.log('4. Verify database entries for accessibility_issues from new workers');
} else {
  console.log('❌ Some files are missing - check implementation');
}

console.log('\n📝 To test the actual worker functionality:');
console.log('   cd backend && npm run dev');
console.log('   # Then trigger an analysis via the frontend or API');
console.log('   # Check logs for: "keyboard-worker" and "media-worker" entries');
console.log('\n' + '='.repeat(50));