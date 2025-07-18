import axios from 'axios';
import supabase from '../config/supabase';

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

// Helper function to check if session is expired
const isSessionExpired = (session) => {
  if (!session?.expires_at) return false;
  return new Date(session.expires_at * 1000) <= new Date();
};

// Request interceptor with enhanced session handling
api.interceptors.request.use(
  async (config) => {
    console.log('🔧 Request interceptor called for:', config.url);

    try {
      console.log('🔍 Getting Supabase session...');

      // Add timeout to prevent hanging
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Supabase session timeout')), 10000);
      });

      const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);

      if (error) {
        console.warn('❌ Session retrieval error:', error.message);
        return config;
      }

      if (session?.access_token) {
        // Check if session is expired
        if (isSessionExpired(session)) {
          console.warn('⏰ Session is expired, attempting refresh...');
          try {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !refreshData.session) {
              console.warn('❌ Session refresh failed, clearing auth');
              await supabase.auth.signOut();
              return config;
            }
            // Use refreshed session
            config.headers.Authorization = `Bearer ${refreshData.session.access_token}`;
            console.log('🔄 Used refreshed auth token');
          } catch (refreshErr) {
            console.warn('❌ Session refresh error:', refreshErr.message);
            return config;
          }
        } else {
          // Use existing valid session
          config.headers.Authorization = `Bearer ${session.access_token}`;
          console.log('🔑 Added auth token to request');
        }
      } else {
        console.log('ℹ️ No auth session found, proceeding without token');
      }
    } catch (error) {
      console.warn('❌ Failed to get auth session, proceeding without auth:', error.message);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('📥 Response interceptor - Success:', response.status, response.statusText);
    return response;
  },
  async (error) => {
    console.error('📥 Response interceptor - Error:', {
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
        console.warn('🔐 Authentication error detected, clearing session');

        // Clear the session and redirect to login if needed
        try {
          await supabase.auth.signOut();

          // Force a page reload to clear any stale state
          if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
            console.log('🔄 Redirecting to login due to auth error');
            window.location.href = '/login';
            return;
          }
        } catch (signOutError) {
          console.warn('Failed to sign out after auth error:', signOutError);
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
      console.error('📡 Network error details:', error.request);
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
      console.log('🚀 API Call Starting:', {
        baseURL: API_BASE_URL,
        endpoint: '/api/accessibility/analyze',
        payload: { url, reportType, language },
        timestamp: new Date().toISOString()
      });
      
      console.log('📡 Making POST request to /api/accessibility/analyze...');
      const response = await api.post('/api/accessibility/analyze', { url, reportType, language });
      
      console.log('✅ API Response Received:', {
        status: response.status,
        statusText: response.statusText,
        dataKeys: Object.keys(response.data || {}),
        dataSize: JSON.stringify(response.data || {}).length
      });
      
      console.log('📦 Response data:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ API Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
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
      console.log(`📊 API: Making request to /api/analysis/recent?limit=${limit}`);
      const response = await api.get(`/api/analysis/recent?limit=${limit}`);
      console.log('✅ API: getRecent response received', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: getRecent failed', error);
      throw error;
    }
  },

  // Get specific analysis by ID
  getById: async (analysisId) => {
    try {
      console.log(`📊 API: Making request to /api/analysis/${analysisId}`);
      const response = await api.get(`/api/analysis/${analysisId}`);
      console.log('✅ API: getById response received', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: getById failed', error);
      throw error;
    }
  },

  // Get analysis statistics
  getStats: async () => {
    try {
      console.log('📊 API: Making request to /api/analysis/stats');
      const response = await api.get('/api/analysis/stats');
      console.log('✅ API: getStats response received', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API: getStats failed', error);
      throw error;
    }
  },

  // Get specific analysis by ID
  getById: async (analysisId) => {
    try {
      const response = await api.get(`/api/analysis/${analysisId}`);
      return response.data;
    } catch (error) {
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