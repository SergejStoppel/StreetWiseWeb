import axios from 'axios';
import supabase from '../config/supabase';
import { authStore } from '../utils/authStore';

// Debug logging helper - only logs in development
const debugLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

const debugWarn = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args);
  }
};

const debugError = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  }
};

// Production-safe error logging for critical errors
const prodError = (...args) => {
  console.error(...args);
};

// API Base URL Configuration
// In Docker development, we need to use the full URL since proxy may not work reliably
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3005';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes timeout for analysis
  headers: {
    'Content-Type': 'application/json',
  },
});

// Session validation cache to avoid repeated backend calls (currently unused but reserved for future optimization)
// let sessionValidationCache = {
//   token: null,
//   isValid: false,
//   timestamp: 0,
//   cacheDuration: 5 * 60 * 1000 // 5 minutes
// };

// Helper function to check if session is expired (with 5 minute buffer)
const isSessionExpired = (session) => {
  if (!session?.expires_at) return false;
  const expiryTime = new Date(session.expires_at * 1000);
  const now = new Date();
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
  const expired = expiryTime <= new Date(now.getTime() + bufferTime);
  
  if (expired) {
    debugLog('🕐 Session expiry check:', {
      expiryTime: expiryTime.toISOString(),
      now: now.toISOString(),
      expired,
      minutesToExpiry: Math.floor((expiryTime.getTime() - now.getTime()) / (1000 * 60))
    });
  }
  
  return expired;
};

// Request interceptor with enhanced session handling
api.interceptors.request.use(
  async (config) => {
    debugLog('🔧 Request interceptor called for:', config.url);

    try {
      debugLog('🔍 Getting session from auth store...');

      // Get session from the auth store (no async calls, no timeouts)
      const session = authStore.getSession();

      if (!session) {
        debugLog('ℹ️ No session in auth store, proceeding without auth');
        return config;
      }

      if (session?.access_token) {
        // Check if session is expired
        if (isSessionExpired(session)) {
          debugWarn('⏰ Session is expired, attempting refresh...');
          try {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !refreshData.session) {
              debugWarn('❌ Session refresh failed, clearing auth:', refreshError?.message || 'No session returned');
              await supabase.auth.signOut();
              authStore.clearSession();
              
              // Force redirect to login after failed refresh
              if (window.location.pathname !== '/login') {
                debugLog('🔄 Redirecting to login due to failed session refresh');
                window.location.href = '/login';
              }
              return config;
            }
            // Update auth store with refreshed session
            authStore.setSession(refreshData.session);
            // Use refreshed session
            config.headers.Authorization = `Bearer ${refreshData.session.access_token}`;
            debugLog('🔄 Session refreshed successfully, using new auth token');
          } catch (refreshErr) {
            debugWarn('❌ Session refresh error:', refreshErr.message);
            // Clear session on refresh failure
            await supabase.auth.signOut();
            authStore.clearSession();
            
            // Force redirect to login after refresh error
            if (window.location.pathname !== '/login') {
              debugLog('🔄 Redirecting to login due to session refresh error');
              window.location.href = '/login';
            }
            return config;
          }
        } else {
          // Use existing valid session
          config.headers.Authorization = `Bearer ${session.access_token}`;
          debugLog('🔑 Added auth token to request');
        }
      } else {
        debugLog('ℹ️ No auth session found, proceeding without token');
      }
    } catch (error) {
      debugWarn('❌ Failed to get auth session, proceeding without auth:', error.message);
    }

    return config;
  },
  (error) => {
    debugError('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    debugLog('📥 Response interceptor - Success:', response.status, response.statusText);
    return response;
  },
  async (error) => {
    debugError('📥 Response interceptor - Error:', {
      message: error.message,
      response: error.response,
      request: error.request,
      config: error.config
    });
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 401) {
        // Authentication error - token may be expired
        debugWarn('🔐 Authentication error detected, clearing session');

        // Clear the session and redirect to login if needed
        try {
          await supabase.auth.signOut();

          // Force a page reload to clear any stale state
          if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
            debugLog('🔄 Redirecting to login due to auth error');
            window.location.href = '/login';
            return;
          }
        } catch (signOutError) {
          prodError('Failed to sign out after auth error:', signOutError);
        }
        throw new Error('Your session has expired. Please sign in again.');
      } else if (status === 429) {
        throw new Error('Too many requests. Please try again later.');
      } else if (status === 422) {
        throw new Error(data.message || 'Unable to analyze the website. Please check the URL and try again.');
      } else if (status === 400) {
        throw new Error(data.message || 'Invalid request. Please check your input.');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(data.message || 'An unexpected error occurred.');
      }
    } else if (error.request) {
      // Network error
      debugError('📡 Network error details:', error.request);
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      // Other error
      throw new Error(error.message || 'An unexpected error occurred.');
    }
  }
);

export const accessibilityAPI = {
  analyzeWebsite: async (url, reportType = 'overview', language = 'en') => {
    try {
      debugLog('🚀 API Call Starting:', {
        baseURL: API_BASE_URL,
        endpoint: '/api/accessibility/analyze',
        payload: { url, reportType, language },
        timestamp: new Date().toISOString()
      });
      
      debugLog('📡 Making POST request to /api/accessibility/analyze...');
      const response = await api.post('/api/accessibility/analyze', { url, reportType, language });
      
      debugLog('✅ API Response Received:', {
        status: response.status,
        statusText: response.statusText,
        dataKeys: Object.keys(response.data || {}),
        dataSize: JSON.stringify(response.data || {}).length
      });
      
      debugLog('📦 Response data:', response.data);
      
      return response.data;
    } catch (error) {
      prodError('❌ API Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  getDetailedReport: async (analysisId, language = 'en') => {
    try {
      const response = await api.get(`/api/accessibility/detailed/${analysisId}?language=${language}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  downloadPDF: async (analysisId, language = 'en') => {
    try {
      const response = await api.get(`/api/accessibility/pdf/${analysisId}?language=${language}`, {
        responseType: 'blob'
      });
      
      // Create blob and download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `accessibility-report-${analysisId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  generatePDF: async (analysisId, reportData, language = 'en') => {
    try {
      // Try the new cached PDF endpoint first
      return await accessibilityAPI.downloadPDF(analysisId, language);
    } catch (error) {
      // Fallback to legacy endpoint if needed
      try {
        const response = await api.post('/api/accessibility/generate-pdf', {
          analysisId,
          reportData,
          language
        }, {
          responseType: 'blob'
        });
        
        // Create blob and download link
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `accessibility-report-${analysisId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return { success: true };
      } catch (legacyError) {
        throw legacyError;
      }
    }
  },

  getHealth: async () => {
    try {
      const response = await api.get('/api/accessibility/health');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getDemo: async () => {
    try {
      const response = await api.get('/api/accessibility/demo');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export const analysisAPI = {
  // Get user's analysis history
  getHistory: async (options = {}) => {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);
      if (options.projectId) params.append('projectId', options.projectId);
      if (options.status) params.append('status', options.status);
      
      const response = await api.get(`/api/analysis?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get recent analyses
  getRecent: async (limit = 5) => {
    try {
      debugLog(`📊 API: Making request to /api/analysis/recent?limit=${limit}`);
      const response = await api.get(`/api/analysis/recent?limit=${limit}`);
      debugLog('✅ API: getRecent response received', response.data);
      return response.data;
    } catch (error) {
      prodError('❌ API: getRecent failed', error);
      throw error;
    }
  },

  // Get specific analysis by ID
  getById: async (analysisId) => {
    try {
      debugLog(`📊 API: Making request to /api/analysis/${analysisId}`);
      const response = await api.get(`/api/analysis/${analysisId}`);
      debugLog('✅ API: getById response received', response.data);
      return response.data;
    } catch (error) {
      prodError('❌ API: getById failed', error);
      throw error;
    }
  },

  // Get analysis statistics
  getStats: async () => {
    try {
      debugLog('📊 API: Making request to /api/analysis/stats');
      const response = await api.get('/api/analysis/stats');
      debugLog('✅ API: getStats response received', response.data);
      return response.data;
    } catch (error) {
      prodError('❌ API: getStats failed', error);
      throw error;
    }
  },

  // Delete analysis
  delete: async (analysisId) => {
    try {
      const response = await api.delete(`/api/analysis/${analysisId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Search analyses by URL
  search: async (term, limit = 10) => {
    try {
      const response = await api.get(`/api/analysis/search/${encodeURIComponent(term)}?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default api;