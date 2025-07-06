import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes timeout for analysis
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 429) {
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
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      // Other error
      throw new Error(error.message || 'An unexpected error occurred.');
    }
  }
);

export const accessibilityAPI = {
  analyzeWebsite: async (url) => {
    try {
      const response = await api.post('/api/accessibility/analyze', { url });
      return response.data;
    } catch (error) {
      throw error;
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

export default api;