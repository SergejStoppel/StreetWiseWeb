// Session Manager Utility
// Handles session persistence across container restarts and browser refreshes

import supabase from '../config/supabase';

// Development-only logging utilities
const devLog = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

const devWarn = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args);
  }
};

const devError = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  }
};

// Session metadata storage key
const SESSION_METADATA_KEY = 'sitecraft_session_metadata';

// Store session metadata for container restart recovery
export const storeSessionMetadata = (session) => {
  if (!session) return;
  
  try {
    const metadata = {
      userId: session.user.id,
      email: session.user.email,
      expiresAt: session.expires_at,
      refreshToken: session.refresh_token,
      storedAt: Date.now(),
      version: '1.0'
    };
    
    localStorage.setItem(SESSION_METADATA_KEY, JSON.stringify(metadata));
    devLog('📦 Session metadata stored for container restart recovery');
  } catch (error) {
    devWarn('Failed to store session metadata:', error);
  }
};

// Retrieve session metadata
export const getSessionMetadata = () => {
  try {
    const stored = localStorage.getItem(SESSION_METADATA_KEY);
    if (!stored) return null;
    
    const metadata = JSON.parse(stored);
    
    // Check if metadata is too old (more than 30 days)
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    if (Date.now() - metadata.storedAt > maxAge) {
      devLog('🗑️ Session metadata expired, removing');
      clearSessionMetadata();
      return null;
    }
    
    return metadata;
  } catch (error) {
    devWarn('Failed to retrieve session metadata:', error);
    return null;
  }
};

// Clear session metadata
export const clearSessionMetadata = () => {
  try {
    localStorage.removeItem(SESSION_METADATA_KEY);
    devLog('🗑️ Session metadata cleared');
  } catch (error) {
    devWarn('Failed to clear session metadata:', error);
  }
};

// Check if we're recovering from a container restart
export const isContainerRestart = () => {
  // Check if we have session metadata but no active Supabase session
  const metadata = getSessionMetadata();
  if (!metadata) return false;
  
  // Simple heuristic: if we have metadata but the page was just loaded,
  // it might be a container restart scenario
  const pageLoadTime = performance.now();
  return pageLoadTime < 5000 && metadata; // Page loaded less than 5 seconds ago
};

// Attempt to recover session after container restart
export const recoverSessionAfterRestart = async () => {
  try {
    devLog('🔄 Attempting session recovery after container restart...');
    
    const metadata = getSessionMetadata();
    if (!metadata) {
      devLog('ℹ️ No session metadata found for recovery');
      return null;
    }
    
    // Check if the stored session is expired
    if (metadata.expiresAt && new Date(metadata.expiresAt * 1000) <= new Date()) {
      devLog('⏰ Stored session is expired, attempting refresh...');
      
      try {
        // Attempt to refresh using the stored refresh token
        const { data, error } = await supabase.auth.refreshSession({
          refresh_token: metadata.refreshToken
        });
        
        if (error || !data.session) {
          devLog('❌ Session refresh failed during recovery');
          clearSessionMetadata();
          return null;
        }
        
        devLog('✅ Session refreshed successfully during recovery');
        storeSessionMetadata(data.session);
        return data.session;
      } catch (refreshError) {
        devWarn('❌ Session refresh error during recovery:', refreshError);
        clearSessionMetadata();
        return null;
      }
    }
    
    // Session should still be valid, let Supabase handle it
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      devLog('❌ Session recovery failed, clearing metadata');
      clearSessionMetadata();
      return null;
    }
    
    devLog('✅ Session recovered successfully');
    return session;
  } catch (error) {
    devError('❌ Session recovery error:', error);
    clearSessionMetadata();
    return null;
  }
};

// Validate session with backend (for cross-container validation)
export const validateSessionWithBackend = async (session, apiUrl) => {
  if (!session?.access_token || !apiUrl) {
    return false;
  }

  try {
    console.log('🔍 Validating session with backend after restart...');
    
    const response = await fetch(`${apiUrl}/api/analysis/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    const isValid = response.status !== 401;
    devLog(`${isValid ? '✅' : '❌'} Backend validation result:`, { 
      status: response.status, 
      isValid 
    });
    
    return isValid;
  } catch (error) {
    devWarn('❌ Backend validation failed:', error.message);
    return false;
  }
};

// Complete session cleanup (for logout or invalid sessions)
export const performCompleteSessionCleanup = () => {
  devLog('🧹 Performing complete session cleanup...');
  
  // Clear session metadata
  clearSessionMetadata();
  
  // Clear all Supabase-related localStorage
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth-token')) {
        localStorage.removeItem(key);
        devLog(`🗑️ Removed localStorage key: ${key}`);
      }
    });
  } catch (error) {
    devWarn('Failed to clear localStorage:', error);
  }
  
  // Also clear cookies that might contain auth data
  try {
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name.includes('sb-') || name.includes('supabase')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        devLog(`🍪 Cleared cookie: ${name}`);
      }
    });
  } catch (error) {
    devWarn('Failed to clear cookies:', error);
  }
  
  // Clear sessionStorage
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key === 'pendingProfileUpdate') {
        sessionStorage.removeItem(key);
        devLog(`🗑️ Removed sessionStorage key: ${key}`);
      }
    });
  } catch (error) {
    devWarn('Failed to clear sessionStorage:', error);
  }
  
  devLog('✅ Complete session cleanup finished');
};

const sessionManager = {
  storeSessionMetadata,
  getSessionMetadata,
  clearSessionMetadata,
  isContainerRestart,
  recoverSessionAfterRestart,
  validateSessionWithBackend,
  performCompleteSessionCleanup
};

export default sessionManager;
