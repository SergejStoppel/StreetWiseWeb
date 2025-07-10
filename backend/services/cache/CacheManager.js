const logger = require('../../utils/logger');

class CacheManager {
  constructor() {
    // In-memory storage for full analysis data (in production, use Redis or database)
    this.analysisCache = new Map();
    this.pdfCache = new Map();
    
    // Cache TTL: 24 hours for analysis data, 1 hour for PDFs (PDFs can be regenerated)
    this.ANALYSIS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
    this.PDF_CACHE_TTL = 60 * 60 * 1000; // 1 hour
    
    // Start cache cleanup interval
    this.startCacheCleanup();
  }

  /**
   * Store analysis results in cache
   */
  setAnalysis(analysisId, data) {
    try {
      this.analysisCache.set(analysisId, {
        data,
        timestamp: Date.now()
      });
      logger.info(`Analysis cached: ${analysisId}`);
    } catch (error) {
      logger.error('Failed to cache analysis:', { analysisId, error: error.message });
    }
  }

  /**
   * Retrieve analysis results from cache
   */
  getAnalysis(analysisId) {
    try {
      const cached = this.analysisCache.get(analysisId);
      if (!cached) return null;
      
      // Check if cache is still valid
      if (Date.now() - cached.timestamp > this.ANALYSIS_CACHE_TTL) {
        this.analysisCache.delete(analysisId);
        logger.info(`Expired analysis cache removed: ${analysisId}`);
        return null;
      }
      
      return cached.data;
    } catch (error) {
      logger.error('Failed to retrieve cached analysis:', { analysisId, error: error.message });
      return null;
    }
  }

  /**
   * Store PDF in cache
   */
  setPDF(analysisId, pdfBuffer, language = 'en') {
    try {
      const cacheKey = `${analysisId}_${language}`;
      this.pdfCache.set(cacheKey, {
        buffer: pdfBuffer,
        timestamp: Date.now()
      });
      logger.info(`PDF cached: ${cacheKey}`, { size: pdfBuffer.length });
    } catch (error) {
      logger.error('Failed to cache PDF:', { analysisId, language, error: error.message });
    }
  }

  /**
   * Retrieve PDF from cache
   */
  getPDF(analysisId, language = 'en') {
    try {
      const cacheKey = `${analysisId}_${language}`;
      const cached = this.pdfCache.get(cacheKey);
      if (!cached) return null;
      
      // Check if cache is still valid
      if (Date.now() - cached.timestamp > this.PDF_CACHE_TTL) {
        this.pdfCache.delete(cacheKey);
        logger.info(`Expired PDF cache removed: ${cacheKey}`);
        return null;
      }
      
      return cached.buffer;
    } catch (error) {
      logger.error('Failed to retrieve cached PDF:', { analysisId, language, error: error.message });
      return null;
    }
  }

  /**
   * Clear specific analysis and related PDF caches
   */
  clearCache(analysisId) {
    try {
      let cleared = 0;
      
      // Remove analysis cache
      if (this.analysisCache.has(analysisId)) {
        this.analysisCache.delete(analysisId);
        cleared++;
      }
      
      // Remove all related PDF caches (different languages)
      for (const [key] of this.pdfCache.entries()) {
        if (key.startsWith(analysisId + '_')) {
          this.pdfCache.delete(key);
          cleared++;
        }
      }
      
      if (cleared > 0) {
        logger.info(`Cleared ${cleared} cache entries for analysis: ${analysisId}`);
      }
      
      return cleared;
    } catch (error) {
      logger.error('Failed to clear cache:', { analysisId, error: error.message });
      return 0;
    }
  }

  /**
   * Clear all caches
   */
  clearAllCaches() {
    try {
      const analysisCount = this.analysisCache.size;
      const pdfCount = this.pdfCache.size;
      
      this.analysisCache.clear();
      this.pdfCache.clear();
      
      logger.info(`Cleared all caches: ${analysisCount} analysis, ${pdfCount} PDF`);
      return { analysis: analysisCount, pdf: pdfCount };
    } catch (error) {
      logger.error('Failed to clear all caches:', error);
      return { analysis: 0, pdf: 0 };
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    try {
      const now = Date.now();
      
      // Count valid vs expired entries
      let validAnalysis = 0;
      let expiredAnalysis = 0;
      for (const [, cached] of this.analysisCache.entries()) {
        if (now - cached.timestamp > this.ANALYSIS_CACHE_TTL) {
          expiredAnalysis++;
        } else {
          validAnalysis++;
        }
      }
      
      let validPdf = 0;
      let expiredPdf = 0;
      for (const [, cached] of this.pdfCache.entries()) {
        if (now - cached.timestamp > this.PDF_CACHE_TTL) {
          expiredPdf++;
        } else {
          validPdf++;
        }
      }
      
      return {
        analysis: {
          total: this.analysisCache.size,
          valid: validAnalysis,
          expired: expiredAnalysis
        },
        pdf: {
          total: this.pdfCache.size,
          valid: validPdf,
          expired: expiredPdf
        }
      };
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return null;
    }
  }

  /**
   * Start automatic cache cleanup
   */
  startCacheCleanup() {
    // Clean up expired cache entries every 30 minutes
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 30 * 60 * 1000);
    
    logger.info('Cache cleanup interval started (every 30 minutes)');
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCache() {
    try {
      const now = Date.now();
      let cleanedAnalysis = 0;
      let cleanedPdf = 0;
      
      // Clean up expired analysis cache
      for (const [analysisId, cached] of this.analysisCache.entries()) {
        if (now - cached.timestamp > this.ANALYSIS_CACHE_TTL) {
          this.analysisCache.delete(analysisId);
          cleanedAnalysis++;
        }
      }
      
      // Clean up expired PDF cache
      for (const [cacheKey, cached] of this.pdfCache.entries()) {
        if (now - cached.timestamp > this.PDF_CACHE_TTL) {
          this.pdfCache.delete(cacheKey);
          cleanedPdf++;
        }
      }
      
      if (cleanedAnalysis > 0 || cleanedPdf > 0) {
        logger.info(`Cache cleanup completed: ${cleanedAnalysis} analysis, ${cleanedPdf} PDF entries removed`);
      }
      
      logger.debug(`Cache cleanup completed. Analysis cache size: ${this.analysisCache.size}, PDF cache size: ${this.pdfCache.size}`);
      
      return { analysis: cleanedAnalysis, pdf: cleanedPdf };
    } catch (error) {
      logger.error('Cache cleanup failed:', error);
      return { analysis: 0, pdf: 0 };
    }
  }

  /**
   * Stop cache cleanup interval (for testing or shutdown)
   */
  stopCacheCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Cache cleanup interval stopped');
    }
  }
}

module.exports = CacheManager;