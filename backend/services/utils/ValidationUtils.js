const logger = require('../../utils/logger');

class ValidationUtils {
  
  validateUrl(url) {
    try {
      // Basic URL validation
      if (!url || typeof url !== 'string') {
        throw new Error('URL is required and must be a string');
      }

      // Remove leading/trailing whitespace
      url = url.trim();

      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // Create URL object to validate
      const urlObj = new URL(url);

      // Check for valid protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('URL must use HTTP or HTTPS protocol');
      }

      // Check for valid hostname
      if (!urlObj.hostname || urlObj.hostname.length === 0) {
        throw new Error('URL must have a valid hostname');
      }

      // Basic hostname validation
      const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!hostnameRegex.test(urlObj.hostname)) {
        throw new Error('URL hostname is not valid');
      }

      // Prevent localhost and private IPs in production
      const privatePrefixes = ['10.', '172.', '192.168.', '127.', 'localhost'];
      const isPrivate = privatePrefixes.some(prefix => 
        urlObj.hostname.startsWith(prefix) || urlObj.hostname === 'localhost'
      );
      
      if (isPrivate && process.env.NODE_ENV === 'production') {
        throw new Error('Cannot analyze private or localhost URLs in production');
      }

      return urlObj.href;
    } catch (error) {
      logger.error('URL validation failed:', { url, error: error.message });
      throw new Error(`Invalid URL: ${error.message}`);
    }
  }

  validateReportType(reportType) {
    const validTypes = ['overview', 'detailed'];
    if (!validTypes.includes(reportType)) {
      throw new Error(`Invalid report type. Must be one of: ${validTypes.join(', ')}`);
    }
    return reportType;
  }

  validateLanguage(language) {
    // Basic language code validation (ISO 639-1)
    const languageRegex = /^[a-z]{2}$/;
    if (!languageRegex.test(language)) {
      logger.warn(`Invalid language code: ${language}, defaulting to 'en'`);
      return 'en';
    }
    return language;
  }

  sanitizeAnalysisId(analysisId) {
    if (!analysisId || typeof analysisId !== 'string') {
      throw new Error('Analysis ID is required and must be a string');
    }
    
    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(analysisId)) {
      throw new Error('Analysis ID must be a valid UUID');
    }
    
    return analysisId;
  }

  validateAnalysisOptions(options = {}) {
    const defaults = {
      skipImages: false,
      skipVideos: false,
      skipFrames: false,
      maxTimeout: 45000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    const validated = { ...defaults, ...options };

    // Validate timeout
    if (validated.maxTimeout < 5000 || validated.maxTimeout > 120000) {
      validated.maxTimeout = defaults.maxTimeout;
      logger.warn(`Invalid timeout value, using default: ${defaults.maxTimeout}ms`);
    }

    return validated;
  }
}

module.exports = ValidationUtils;