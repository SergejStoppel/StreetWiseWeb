/**
 * Debug script to verify performance analysis setup
 * Run with: node debug-performance-setup.js
 */

const { createClient } = require('@supabase/supabase-js');

// You'll need to provide these values
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

async function debugPerformanceSetup() {
  console.log('🔍 Debugging Performance Analysis Setup...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // Check 1: Performance module exists
    console.log('1. Checking Performance module...');
    const { data: performanceModule, error: moduleError } = await supabase
      .from('analysis_modules')
      .select('*')
      .eq('name', 'Performance')
      .single();
    
    if (moduleError || !performanceModule) {
      console.log('❌ Performance module not found!');
      console.log('   Error:', moduleError?.message);
      console.log('   Solution: Run migration script 007_complete_performance_setup.sql');
    } else {
      console.log('✅ Performance module found:', performanceModule.name);
    }
    
    // Check 2: Performance rules exist
    console.log('\n2. Checking Performance rules...');
    if (performanceModule) {
      const { data: performanceRules, error: rulesError } = await supabase
        .from('rules')
        .select('rule_key, name')
        .eq('module_id', performanceModule.id);
      
      if (rulesError || !performanceRules || performanceRules.length === 0) {
        console.log('❌ No performance rules found!');
        console.log('   Error:', rulesError?.message);
        console.log('   Solution: Run migration script 007_complete_performance_setup.sql');
      } else {
        console.log(`✅ Found ${performanceRules.length} performance rules:`);
        performanceRules.forEach(rule => {
          console.log(`   - ${rule.rule_key}: ${rule.name}`);
        });
      }
    }
    
    // Check 3: Performance tables have correct columns
    console.log('\n3. Checking database schema...');
    const { data: analyses, error: analysesError } = await supabase
      .from('analyses')
      .select('lcp_value, cls_value, tbt_value, fcp_value, performance_data')
      .limit(1);
    
    if (analysesError) {
      console.log('❌ analyses table missing performance columns!');
      console.log('   Error:', analysesError.message);
      console.log('   Solution: Run migration script 007_complete_performance_setup.sql');
    } else {
      console.log('✅ analyses table has performance metrics columns');
    }
    
    const { data: performanceIssues, error: issuesError } = await supabase
      .from('performance_issues')
      .select('metric_value, improvement_potential, resource_url, savings_bytes, savings_ms')
      .limit(1);
    
    if (issuesError) {
      console.log('❌ performance_issues table missing enhanced columns!');
      console.log('   Error:', issuesError.message);
      console.log('   Solution: Run migration script 007_complete_performance_setup.sql');
    } else {
      console.log('✅ performance_issues table has enhanced columns');
    }
    
    // Check 4: Recent analyses
    console.log('\n4. Checking recent analyses...');
    const { data: recentAnalyses, error: recentError } = await supabase
      .from('analyses')
      .select(`
        id, 
        status, 
        performance_score,
        lcp_value,
        cls_value,
        analysis_jobs!inner (
          id,
          status,
          analysis_modules (
            name
          )
        )
      `)
      .eq('analysis_jobs.analysis_modules.name', 'Performance')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.log('❌ Could not fetch recent performance analyses');
      console.log('   Error:', recentError.message);
    } else if (!recentAnalyses || recentAnalyses.length === 0) {
      console.log('⚠️  No performance analyses found yet');
      console.log('   This is normal if you haven\'t run any analyses with performance workers running');
    } else {
      console.log(`✅ Found ${recentAnalyses.length} recent performance analyses:`);
      recentAnalyses.forEach((analysis, index) => {
        console.log(`   ${index + 1}. Analysis ${analysis.id}:`);
        console.log(`      - Status: ${analysis.status}`);
        console.log(`      - Performance Score: ${analysis.performance_score || 'Not calculated'}`);
        console.log(`      - LCP: ${analysis.lcp_value || 'Not measured'}s`);
        console.log(`      - CLS: ${analysis.cls_value || 'Not measured'}`);
        console.log(`      - Performance Job Status: ${analysis.analysis_jobs?.[0]?.status || 'Unknown'}`);
      });
    }
    
    console.log('\n✅ Debug complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. Make sure performance workers are running: npm run worker:performance');
    console.log('   2. Run a new analysis to test performance analysis');
    console.log('   3. Check logs for any worker errors');
    
  } catch (error) {
    console.log('❌ Debug script failed:', error.message);
    console.log('   Make sure SUPABASE_URL and SUPABASE_ANON_KEY environment variables are set');
  }
}

debugPerformanceSetup();