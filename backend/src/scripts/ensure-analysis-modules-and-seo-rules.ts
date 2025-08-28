import { supabase } from '@/config/supabase';
import { createLogger } from '@/config/logger';

const logger = createLogger('ensure-modules-and-seo-rules');

async function ensureModule(name: string, description: string) {
  const { data: existing, error: selectError } = await supabase
    .from('analysis_modules')
    .select('id')
    .eq('name', name)
    .limit(1);

  if (selectError) {
    logger.warn('Failed to query analysis_modules', { error: selectError.message, name });
  }

  if (existing && existing.length > 0) {
    logger.info('Module exists', { name });
    return existing[0].id as string;
  }

  const { data: inserted, error: insertError } = await supabase
    .from('analysis_modules')
    .insert({ name, description })
    .select('id')
    .limit(1);

  if (insertError) {
    throw new Error(`Failed to insert module ${name}: ${insertError.message}`);
  }

  logger.info('Module created', { name, id: inserted?.[0]?.id });
  return inserted?.[0]?.id as string;
}

async function getRuleIds(moduleId: string, ruleKeys: string[]) {
  const { data, error } = await supabase
    .from('rules')
    .select('rule_key')
    .eq('module_id', moduleId)
    .in('rule_key', ruleKeys);

  if (error) {
    logger.warn('Failed to query existing rules', { error: error.message });
    return new Set<string>();
  }
  return new Set((data || []).map(r => r.rule_key));
}

async function ensureSeoRules(moduleId: string) {
  const requiredRules = [
    {
      rule_key: 'SEO_TEC_01_ROBOTS_TXT_MISSING',
      name: 'robots.txt File Missing',
      description: 'robots.txt provides crawl guidance to search engines',
      default_severity: 'serious',
    },
    {
      rule_key: 'SEO_TEC_02_ROBOTS_TXT_ERRORS',
      name: 'robots.txt Syntax Errors',
      description: 'robots.txt must have correct syntax for proper crawl control',
      default_severity: 'serious',
    },
    {
      rule_key: 'SEO_TEC_05_CANONICAL_MISSING',
      name: 'Canonical Tag Missing',
      description: 'Canonical tags prevent duplicate content issues',
      default_severity: 'critical',
    },
    {
      rule_key: 'SEO_TEC_06_CANONICAL_SELF_REFERENCE',
      name: 'Canonical Self-Reference Missing',
      description: 'Pages should canonically reference themselves',
      default_severity: 'moderate',
    },
  ];

  const existing = await getRuleIds(moduleId, requiredRules.map(r => r.rule_key));
  const toInsert = requiredRules
    .filter(r => !existing.has(r.rule_key))
    .map(r => ({ ...r, module_id: moduleId }));

  if (toInsert.length === 0) {
    logger.info('All required SEO rules already exist');
    return;
  }

  const { error } = await supabase
    .from('rules')
    .insert(toInsert);

  if (error) {
    throw new Error(`Failed to insert SEO rules: ${error.message}`);
  }

  logger.info('Inserted missing SEO rules', { count: toInsert.length });
}

export async function ensureModulesAndSeoRules() {
  logger.info('Ensuring analysis modules and SEO rules exist');
  const fetcherId = await ensureModule('Fetcher', 'Website asset extraction and storage');
  const accessibilityId = await ensureModule('Accessibility', 'WCAG checks');
  const seoId = await ensureModule('SEO', 'Search Engine Optimization and technical analysis');
  const performanceId = await ensureModule('Performance', 'Website performance and CWV');

  await ensureSeoRules(seoId);
  logger.info('Ensure modules and rules completed');
}

// Run if called directly
if (require.main === module) {
  ensureModulesAndSeoRules()
    .then(() => {
      logger.info('Script completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Script failed', { error: err.message });
      process.exit(1);
    });
}


