/**
 * AI Analysis Worker
 * Provides deep AI-powered content analysis using OpenAI
 * Only runs for Tier 2 (paid) deep analysis
 */

import { Job, Worker } from 'bullmq';
import OpenAI from 'openai';
import { config } from '@/config';
import { createLogger } from '@/config/logger';
import { supabase } from '@/config/supabase';

const logger = createLogger('ai-analysis-worker');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

interface AiAnalysisJobData {
  analysisId: string;
  workspaceId: string;
  userId: string;
  pageContent: {
    url: string;
    title: string;
    metaDescription: string;
    headings: string[];
    bodyText: string;
    html?: string;
  };
}

interface AiInsight {
  category: string;
  title: string;
  finding: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
}

interface AiAnalysisResult {
  success: boolean;
  overallAssessment: string;
  contentQualityScore: number;
  seoReadinessScore: number;
  insights: AiInsight[];
  keywordSuggestions: string[];
  contentGaps: string[];
  competitiveAdvantages: string[];
  actionItems: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

/**
 * Main AI analysis function
 */
async function performAiAnalysis(pageContent: AiAnalysisJobData['pageContent']): Promise<AiAnalysisResult> {
  logger.info('Starting AI analysis', { url: pageContent.url });

  try {
    // Prepare content for analysis (limit to avoid token limits)
    const truncatedBody = pageContent.bodyText.substring(0, 8000);
    const headingsText = pageContent.headings.slice(0, 20).join('\n');

    const prompt = buildAnalysisPrompt(pageContent, truncatedBody, headingsText);

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective but capable
      messages: [
        {
          role: 'system',
          content: `You are an expert SEO and content analyst. Analyze websites and provide actionable insights to improve their search engine visibility, content quality, and user experience. Be specific and practical in your recommendations. Always respond with valid JSON.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower for more consistent analysis
      max_tokens: 2000
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse the response
    const analysis = JSON.parse(responseText) as AiAnalysisResult;
    analysis.success = true;

    logger.info('AI analysis completed', {
      url: pageContent.url,
      contentScore: analysis.contentQualityScore,
      seoScore: analysis.seoReadinessScore,
      insightsCount: analysis.insights?.length || 0
    });

    return analysis;

  } catch (error) {
    logger.error('AI analysis failed', { error: (error as Error).message });

    return {
      success: false,
      overallAssessment: 'AI analysis could not be completed. Please try again.',
      contentQualityScore: 0,
      seoReadinessScore: 0,
      insights: [],
      keywordSuggestions: [],
      contentGaps: [],
      competitiveAdvantages: [],
      actionItems: {
        immediate: [],
        shortTerm: [],
        longTerm: []
      }
    };
  }
}

/**
 * Build the analysis prompt
 */
function buildAnalysisPrompt(
  pageContent: AiAnalysisJobData['pageContent'],
  truncatedBody: string,
  headingsText: string
): string {
  return `Analyze this webpage and provide SEO and content quality insights.

## Page Information
- URL: ${pageContent.url}
- Title: ${pageContent.title}
- Meta Description: ${pageContent.metaDescription || 'Not set'}

## Headings Structure
${headingsText || 'No headings found'}

## Page Content (first 8000 characters)
${truncatedBody}

## Analysis Required
Provide a comprehensive analysis in JSON format with the following structure:
{
  "overallAssessment": "A 2-3 sentence summary of the page's SEO and content health",
  "contentQualityScore": <number 0-100>,
  "seoReadinessScore": <number 0-100>,
  "insights": [
    {
      "category": "Content|SEO|UX|Technical",
      "title": "Short insight title",
      "finding": "What you found",
      "recommendation": "Specific actionable recommendation",
      "priority": "high|medium|low",
      "estimatedImpact": "Brief description of expected improvement"
    }
  ],
  "keywordSuggestions": ["keyword1", "keyword2", ...],
  "contentGaps": ["Missing topic 1", "Missing topic 2", ...],
  "competitiveAdvantages": ["Strength 1", "Strength 2", ...],
  "actionItems": {
    "immediate": ["Quick win 1", "Quick win 2"],
    "shortTerm": ["1-2 week improvement 1"],
    "longTerm": ["Strategic improvement 1"]
  }
}

Focus on:
1. Content-title alignment and relevance
2. Keyword usage and opportunities
3. Content structure and readability
4. Missing elements that competitors likely have
5. Quick wins for immediate improvement

Provide 5-8 specific, actionable insights.`;
}

/**
 * Store AI analysis results
 */
async function storeAiResults(analysisId: string, results: AiAnalysisResult): Promise<void> {
  try {
    // Store in analysis metadata
    const { error } = await supabase
      .from('analyses')
      .update({
        ai_analysis: results,
        ai_analyzed_at: new Date().toISOString()
      })
      .eq('id', analysisId);

    if (error) {
      logger.error('Failed to store AI results', { analysisId, error });
    }

    // Also store insights as SEO issues for display
    if (results.insights && results.insights.length > 0) {
      const seoIssues = results.insights
        .filter(insight => insight.category === 'SEO' || insight.category === 'Content')
        .map(insight => ({
          analysis_id: analysisId,
          rule_key: `AI_${insight.category.toUpperCase()}_${insight.priority.toUpperCase()}`,
          severity: insight.priority === 'high' ? 'serious' : insight.priority === 'medium' ? 'moderate' : 'minor',
          message: insight.finding,
          location_path: 'AI Analysis',
          fix_suggestion: insight.recommendation,
          code_snippet: `Estimated Impact: ${insight.estimatedImpact}`
        }));

      if (seoIssues.length > 0) {
        await supabase.from('seo_issues').insert(seoIssues);
      }
    }

    logger.info('AI results stored', { analysisId, insightsCount: results.insights?.length || 0 });

  } catch (error) {
    logger.error('Error storing AI results', { analysisId, error: (error as Error).message });
  }
}

/**
 * Create the BullMQ worker
 */
export const aiAnalysisWorker = new Worker('ai-analysis', async (job: Job<AiAnalysisJobData>) => {
  const { analysisId, pageContent } = job.data;

  logger.info('Starting AI analysis job', { analysisId, url: pageContent.url });

  try {
    // Check if OpenAI is configured
    if (!config.openai.apiKey) {
      logger.warn('OpenAI API key not configured, skipping AI analysis');
      return { success: false, reason: 'not_configured' };
    }

    // Perform AI analysis
    const results = await performAiAnalysis(pageContent);

    // Store results
    await storeAiResults(analysisId, results);

    return results;

  } catch (error) {
    logger.error('AI analysis job failed', {
      analysisId,
      error: (error as Error).message
    });
    throw error;
  }
}, {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
  },
  concurrency: 3, // Limit concurrent AI calls to manage costs
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down AI analysis worker...');
  await aiAnalysisWorker.close();
});

export default aiAnalysisWorker;
