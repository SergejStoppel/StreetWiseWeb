const supabase = require('../config/supabase');
const AnalysisSummary = require('./AnalysisSummary');
const StorageObject = require('./StorageObject');
const AnalysisViolation = require('./AnalysisViolation');
const AnalysisScreenshot = require('./AnalysisScreenshot');

class Analysis {
  /**
   * Create a new analysis with optimized storage
   * @param {Object} analysisData - Analysis data
   * @returns {Promise<Object>} Created analysis with related data
   */
  static async create(analysisData) {
    // Start a transaction-like operation
    try {
      // 1. Create the main analysis record (without violations, screenshots, etc.)
      const mainAnalysisData = {
        id: analysisData.analysisId, // Use the provided analysis ID to match screenshot storage paths
        user_id: analysisData.userId,
        project_id: analysisData.projectId,
        url: analysisData.url,
        report_type: analysisData.reportType || 'overview',
        language: analysisData.language || 'en',
        overall_score: analysisData.overallScore,
        accessibility_score: analysisData.accessibilityScore,
        seo_score: analysisData.seoScore,
        performance_score: analysisData.performanceScore,
        // Store core analysis data without large fields
        analysis_data: {
          ...analysisData.analysisData,
          violations: undefined, // Remove violations from main data
          screenshot: undefined, // Remove screenshots from main data
        },
        metadata: analysisData.metadata || {},
        status: analysisData.status || 'completed'
      };

      const { data: analysis, error: analysisError } = await supabase
        .from('analyses')
        .insert(mainAnalysisData)
        .select()
        .single();

      if (analysisError) {
        throw new Error(`Error creating analysis: ${analysisError.message}`);
      }

      // 2. Create violations record if violations exist
      if (analysisData.analysisData?.violations && analysisData.analysisData.violations.length > 0) {
        await AnalysisViolation.create(analysis.id, analysisData.analysisData.violations);
      }

      // 3. Create screenshot records if screenshots exist
      const screenshots = [];
      if (analysisData.analysisData?.screenshot) {
        // Handle different screenshot data formats
        const screenshotData = analysisData.analysisData.screenshot;
        
        console.log('📸 Analysis.create: Processing screenshot data:', {
          screenshotData,
          type: typeof screenshotData,
          hasDesktop: !!screenshotData.desktop,
          hasMobile: !!screenshotData.mobile,
          hasUrl: !!screenshotData.url
        });
        
        if (typeof screenshotData === 'string') {
          // Single screenshot URL
          screenshots.push({
            url: screenshotData,
            type: 'main',
            storageObjectId: null
          });
        } else if (screenshotData.url) {
          // Screenshot object with URL
          screenshots.push({
            url: screenshotData.url,
            type: 'main',
            storageObjectId: screenshotData.storageObjectId || null,
            metadata: screenshotData.metadata || {}
          });
        } else if (screenshotData.desktop || screenshotData.mobile) {
          // Desktop/Mobile screenshot object
          if (screenshotData.desktop) {
            screenshots.push({
              url: screenshotData.desktop,
              type: 'desktop',
              storageObjectId: null,
              metadata: { timestamp: screenshotData.timestamp }
            });
          }
          if (screenshotData.mobile) {
            screenshots.push({
              url: screenshotData.mobile,
              type: 'mobile',
              storageObjectId: null,
              metadata: { timestamp: screenshotData.timestamp }
            });
          }
        }
      }

      if (screenshots.length > 0) {
        await AnalysisScreenshot.createMultiple(analysis.id, screenshots);
      }

      // 4. Create summary record for fast dashboard queries
      if (analysisData.analysisData?.summary) {
        try {
          await AnalysisSummary.createOrUpdate(analysis.id, analysisData.analysisData.summary);
        } catch (summaryError) {
          console.warn('Failed to create analysis summary:', summaryError.message);
        }
      }

      // Return the complete analysis object
      return {
        ...analysis,
        violations: analysisData.analysisData?.violations || [],
        screenshot: analysisData.analysisData?.screenshot || null
      };

    } catch (error) {
      console.error('Error in Analysis.create:', error);
      throw error;
    }
  }

  /**
   * Get analysis by ID with all related data
   * @param {string} analysisId - Analysis ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object|null>} Complete analysis or null if not found
   */
  static async findById(analysisId, userId) {
    try {
      // Get main analysis record
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Analysis not found
        }
        throw new Error(`Error fetching analysis: ${error.message}`);
      }

      // Get violations
      const violations = await AnalysisViolation.getByAnalysisId(analysisId);

      // Get screenshots
      const screenshots = await AnalysisScreenshot.getByAnalysisId(analysisId);
      
      console.log('📸 Analysis.findById: Retrieved screenshots from database:', {
        analysisId,
        userId,
        screenshotCount: screenshots?.length || 0,
        screenshots: screenshots,
        screenshotTypes: screenshots?.map(s => s.screenshot_type) || []
      });

      // Transform to expected format
      return this.transformDbRecord(data, { violations, screenshots });
    } catch (error) {
      console.error('Error in Analysis.findById:', error);
      throw error;
    }
  }

  /**
   * Get all analyses for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of analyses
   */
  static async findByUserId(userId, options = {}) {
    let query = supabase
      .from('analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options.projectId) {
      query = query.eq('project_id', options.projectId);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching analyses: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Get violations and screenshots for all analyses in batch
    const analysisIds = data.map(analysis => analysis.id);
    const [violationsMap, screenshotsMap] = await Promise.all([
      AnalysisViolation.getByAnalysisIds(analysisIds),
      AnalysisScreenshot.getByAnalysisIds(analysisIds)
    ]);

    // Transform each record with its violations and screenshots
    return data.map(record => 
      this.transformDbRecord(record, {
        violations: violationsMap[record.id] || [],
        screenshots: screenshotsMap[record.id] || []
      })
    );
  }

  /**
   * Get recent analyses with optimized query
   * @param {string} userId - User ID
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} Recent analyses
   */
  static async getRecent(userId, limit = 10) {
    return this.findByUserId(userId, { limit, status: 'completed' });
  }

  /**
   * Get cached analysis by URL (for deduplication)
   * @param {string} url - URL to check
   * @param {string} userId - User ID
   * @param {number} cacheHours - Cache duration in hours
   * @returns {Promise<Object|null>} Cached analysis or null
   */
  static async getCachedAnalysis(url, userId, cacheHours = 24) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - cacheHours);

    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('url', url)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', cutoffTime.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No cached analysis found
      }
      throw new Error(`Error checking cached analysis: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Get related data
    const [violations, screenshots] = await Promise.all([
      AnalysisViolation.getByAnalysisId(data.id),
      AnalysisScreenshot.getByAnalysisId(data.id)
    ]);

    return this.transformDbRecord(data, { violations, screenshots });
  }

  /**
   * Update analysis status
   * @param {string} analysisId - Analysis ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated analysis
   */
  static async updateStatus(analysisId, status) {
    const { data, error } = await supabase
      .from('analyses')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', analysisId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating analysis status: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete analysis (cascade delete will handle related records)
   * @param {string} analysisId - Analysis ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<void>}
   */
  static async delete(analysisId, userId) {
    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', analysisId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error deleting analysis: ${error.message}`);
    }
  }

  /**
   * Get analysis statistics using materialized view
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User statistics
   */
  static async getStats(userId) {
    try {
      // Try to get stats from materialized view first
      const { data: viewData, error: viewError } = await supabase
        .from('user_dashboard_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!viewError && viewData) {
        return {
          totalAnalyses: viewData.total_analyses,
          totalProjects: viewData.total_projects,
          avgOverallScore: parseFloat(viewData.avg_overall_score) || 0,
          avgAccessibilityScore: parseFloat(viewData.avg_accessibility_score) || 0,
          avgSeoScore: parseFloat(viewData.avg_seo_score) || 0,
          avgPerformanceScore: parseFloat(viewData.avg_performance_score) || 0,
          lastAnalysisDate: viewData.last_analysis_date,
          totalStorageUsed: parseInt(viewData.total_storage_used) || 0
        };
      }

      // Fallback to manual calculation if view is not available
      return this.calculateStatsManually(userId);
    } catch (error) {
      console.error('Error getting stats from view, falling back to manual calculation:', error);
      return this.calculateStatsManually(userId);
    }
  }

  /**
   * Manually calculate statistics (fallback method)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User statistics
   */
  static async calculateStatsManually(userId) {
    try {
      // Get analyses
      const { data: analyses, error: analysesError } = await supabase
        .from('analyses')
        .select('created_at, overall_score, accessibility_score, seo_score, performance_score')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (analysesError) throw analysesError;

      // Get projects count
      const { count: projectCount, error: projectError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (projectError) throw projectError;

      // Get storage usage
      const { data: storageData, error: storageError } = await supabase
        .from('storage_objects')
        .select('file_size')
        .eq('user_id', userId);

      if (storageError) throw storageError;

      // Calculate averages
      const totalAnalyses = analyses?.length || 0;
      const totalStorageUsed = storageData?.reduce((sum, obj) => sum + (obj.file_size || 0), 0) || 0;

      let avgOverallScore = 0, avgAccessibilityScore = 0, avgSeoScore = 0, avgPerformanceScore = 0;

      if (totalAnalyses > 0) {
        const sums = analyses.reduce((acc, analysis) => ({
          overall: acc.overall + (analysis.overall_score || 0),
          accessibility: acc.accessibility + (analysis.accessibility_score || 0),
          seo: acc.seo + (analysis.seo_score || 0),
          performance: acc.performance + (analysis.performance_score || 0)
        }), { overall: 0, accessibility: 0, seo: 0, performance: 0 });

        avgOverallScore = Math.round(sums.overall / totalAnalyses);
        avgAccessibilityScore = Math.round(sums.accessibility / totalAnalyses);
        avgSeoScore = Math.round(sums.seo / totalAnalyses);
        avgPerformanceScore = Math.round(sums.performance / totalAnalyses);
      }

      return {
        totalAnalyses,
        totalProjects: projectCount || 0,
        avgOverallScore,
        avgAccessibilityScore,
        avgSeoScore,
        avgPerformanceScore,
        lastAnalysisDate: analyses[0]?.created_at || null,
        totalStorageUsed
      };
    } catch (error) {
      throw new Error(`Error calculating analysis stats: ${error.message}`);
    }
  }

  /**
   * Transform database record to expected frontend format
   * @param {Object} dbRecord - Database record
   * @param {Object} relatedData - Related data from other tables
   * @returns {Object} Transformed record
   */
  static transformDbRecord(dbRecord, relatedData = {}) {
    if (!dbRecord) return null;

    const { violations = [], screenshots = [] } = relatedData;

    // If analysis_data exists, merge it with related data
    if (dbRecord.analysis_data) {
      // Remove screenshot from analysis_data to prevent conflicts
      const { screenshot: _, ...analysisDataWithoutScreenshot } = dbRecord.analysis_data;
      
      return {
        ...analysisDataWithoutScreenshot,
        // Add database-specific fields
        id: dbRecord.id,
        analysisId: dbRecord.id,
        databaseId: dbRecord.id,
        createdAt: dbRecord.created_at,
        updatedAt: dbRecord.updated_at,
        userId: dbRecord.user_id,
        projectId: dbRecord.project_id,
        status: dbRecord.status,
        isAnonymous: dbRecord.is_anonymous,
        // Add related data
        violations: violations,
        screenshot: this.formatScreenshotsForFrontend(screenshots, dbRecord.user_id, dbRecord.id),
        // Override with database scores (provide both camelCase and snake_case for compatibility)
        overallScore: dbRecord.overall_score ?? dbRecord.analysis_data.overallScore,
        accessibilityScore: dbRecord.accessibility_score ?? dbRecord.analysis_data.accessibilityScore,
        seoScore: dbRecord.seo_score ?? dbRecord.analysis_data.seoScore,
        performanceScore: dbRecord.performance_score ?? dbRecord.analysis_data.performanceScore,
        // Add snake_case versions for dashboard compatibility
        overall_score: dbRecord.overall_score ?? dbRecord.analysis_data.overallScore,
        accessibility_score: dbRecord.accessibility_score ?? dbRecord.analysis_data.accessibilityScore,
        seo_score: dbRecord.seo_score ?? dbRecord.analysis_data.seoScore,
        performance_score: dbRecord.performance_score ?? dbRecord.analysis_data.performanceScore,
        // Ensure summary includes database scores
        summary: {
          ...dbRecord.analysis_data.summary,
          overallScore: dbRecord.overall_score ?? dbRecord.analysis_data.summary?.overallScore,
          accessibilityScore: dbRecord.accessibility_score ?? dbRecord.analysis_data.summary?.accessibilityScore,
          seoScore: dbRecord.seo_score ?? dbRecord.analysis_data.summary?.seoScore,
          performanceScore: dbRecord.performance_score ?? dbRecord.analysis_data.summary?.performanceScore,
        }
      };
    }

    // Fallback: construct from separate database fields
    return {
      analysisId: dbRecord.id,
      id: dbRecord.id,
      databaseId: dbRecord.id,
      url: dbRecord.url,
      reportType: dbRecord.report_type,
      language: dbRecord.language,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
      userId: dbRecord.user_id,
      projectId: dbRecord.project_id,
      status: dbRecord.status,
      isAnonymous: dbRecord.is_anonymous,
      overallScore: dbRecord.overall_score,
      accessibilityScore: dbRecord.accessibility_score,
      seoScore: dbRecord.seo_score,
      performanceScore: dbRecord.performance_score,
      // Add snake_case versions for dashboard compatibility
      overall_score: dbRecord.overall_score,
      accessibility_score: dbRecord.accessibility_score,
      seo_score: dbRecord.seo_score,
      performance_score: dbRecord.performance_score,
      violations: violations,
      summary: {
        overallScore: dbRecord.overall_score,
        accessibilityScore: dbRecord.accessibility_score,
        seoScore: dbRecord.seo_score,
        performanceScore: dbRecord.performance_score,
        ...dbRecord.summary
      },
      metadata: dbRecord.metadata,
      screenshot: this.formatScreenshotsForFrontend(screenshots, dbRecord.user_id, dbRecord.id),
      seo: dbRecord.seo_analysis,
      aiInsights: dbRecord.ai_insights
    };
  }

  /**
   * Construct screenshot URL from analysis data
   * @param {string} userId - User ID
   * @param {string} analysisId - Analysis ID
   * @param {string} type - Screenshot type (desktop/mobile)
   * @param {number} timestamp - Timestamp for the screenshot
   * @returns {string} Constructed screenshot URL
   */
  static constructScreenshotUrl(userId, analysisId, type) {
    const supabaseUrl = process.env.SUPABASE_URL || require('../config/environment').SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/analysis-screenshots/${userId}/${analysisId}/screenshots/${type}.jpg`;
  }

  /**
   * Format screenshots for frontend compatibility
   * @param {Array} screenshots - Array of screenshot records
   * @param {string} userId - User ID for URL construction
   * @param {string} analysisId - Analysis ID for URL construction
   * @returns {Object|string|null} Formatted screenshot data
   */
  static formatScreenshotsForFrontend(screenshots, userId, analysisId) {
    console.log('📸 formatScreenshotsForFrontend called with:', {
      screenshots: screenshots,
      length: screenshots?.length,
      types: screenshots?.map(s => s.screenshot_type),
      userId,
      analysisId
    });
    
    if (!screenshots || screenshots.length === 0) {
      console.log('📸 No screenshots found, returning null');
      return null;
    }

    // If we have desktop and mobile screenshots, construct their URLs
    const desktop = screenshots.find(s => s.screenshot_type === 'desktop');
    const mobile = screenshots.find(s => s.screenshot_type === 'mobile');

    if (desktop || mobile) {
      const result = {};
      
      if (desktop) {
        result.desktop = this.constructScreenshotUrl(userId, analysisId, 'desktop');
      }
      
      if (mobile) {
        result.mobile = this.constructScreenshotUrl(userId, analysisId, 'mobile');
      }
      
      if (desktop?.metadata?.timestamp) result.timestamp = desktop.metadata.timestamp;
      
      console.log('📸 Returning constructed screenshots:', result);
      return result;
    }

    // For single screenshots or main type, construct URL
    if (screenshots.length === 1) {
      const screenshot = screenshots[0];
      const type = screenshot.screenshot_type === 'main' ? 'desktop' : screenshot.screenshot_type;
      return this.constructScreenshotUrl(userId, analysisId, type);
    }

    // Return array of constructed URLs for multiple screenshots
    return screenshots.map(s => {
      const type = s.screenshot_type === 'main' ? 'desktop' : s.screenshot_type;
      return this.constructScreenshotUrl(userId, analysisId, type);
    });
  }
}

module.exports = Analysis;