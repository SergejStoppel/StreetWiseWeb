/**
 * Quota and Payment API Service
 * Handles quota checking, instant scans, and payment flows
 */

import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance with auth
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const quotaApi = {
  /**
   * Get current user's quota information
   */
  getQuota: async () => {
    try {
      const response = await api.get('/api/quota');
      return response.data;
    } catch (error) {
      console.error('Failed to get quota:', error);
      throw error;
    }
  },

  /**
   * Check if user can scan a specific URL
   */
  checkQuota: async (url) => {
    try {
      const response = await api.get('/api/quota/check', { params: { url } });
      return response.data;
    } catch (error) {
      console.error('Failed to check quota:', error);
      throw error;
    }
  }
};

export const instantScanApi = {
  /**
   * Start an instant scan
   */
  startScan: async (url) => {
    try {
      const response = await api.post('/api/instant-scan', { url });
      return response.data;
    } catch (error) {
      console.error('Failed to start scan:', error);
      throw error;
    }
  },

  /**
   * Get scan results
   */
  getResults: async (analysisId) => {
    try {
      const response = await api.get(`/api/instant-scan/${analysisId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get scan results:', error);
      throw error;
    }
  },

  /**
   * Poll for scan completion
   */
  pollStatus: async (analysisId) => {
    try {
      const response = await api.get(`/api/instant-scan/${analysisId}/poll`);
      return response.data;
    } catch (error) {
      console.error('Failed to poll status:', error);
      throw error;
    }
  }
};

export const paymentApi = {
  /**
   * Get pricing information
   */
  getPrice: async () => {
    try {
      const response = await api.get('/api/payments/price');
      return response.data;
    } catch (error) {
      console.error('Failed to get price:', error);
      throw error;
    }
  },

  /**
   * Create checkout session for deep analysis
   */
  createCheckout: async (url) => {
    try {
      const response = await api.post('/api/payments/checkout', { url });
      return response.data;
    } catch (error) {
      console.error('Failed to create checkout:', error);
      throw error;
    }
  },

  /**
   * Get payment history
   */
  getHistory: async () => {
    try {
      const response = await api.get('/api/payments/history');
      return response.data;
    } catch (error) {
      console.error('Failed to get payment history:', error);
      throw error;
    }
  },

  /**
   * Get specific payment details
   */
  getPayment: async (paymentId) => {
    try {
      const response = await api.get(`/api/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get payment:', error);
      throw error;
    }
  }
};

export default { quotaApi, instantScanApi, paymentApi };
