import React, { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../config/supabase';
import { toast } from 'react-toastify';
import sessionManager from '../utils/sessionManager';
import { authStore } from '../utils/authStore';

// Development-only logging utility
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

// Production-safe error logging
const logError = (message, error) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(message, error);
  } else {
    // In production, only log essential error information without sensitive data
    console.error(message, error?.message || 'Unknown error');
  }
};

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Validate session with backend
  const validateSessionWithBackend = async (session) => {
    if (!session?.access_token) {
      devWarn('❌ No access token in session');
      return false;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3005';
      devLog('🔍 Validating session with backend...', {
        apiUrl,
        hasToken: !!session.access_token,
        tokenLength: session.access_token?.length
      });

      // Create timeout with fallback for older browsers
      let signal;
      if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
        signal = AbortSignal.timeout(5000); // 5 second timeout
      }
      
      const fetchStart = Date.now();
      const response = await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        ...(signal && { signal })
      });
      
      const fetchTime = Date.now() - fetchStart;
      const isValid = response.status === 200;
      
      devLog(`${isValid ? '✅' : '❌'} Session validation result:`, {
        status: response.status,
        statusText: response.statusText,
        isValid,
        fetchTimeMs: fetchTime,
        url: `${apiUrl}/api/health`
      });

      return isValid;
    } catch (error) {
      devError('❌ Session validation failed:', {
        message: error.message,
        name: error.name,
        apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3005'
      });
      
      // Don't assume session is valid on network errors - this might be blocking initialization
      return false;
    }
  };

  // Test API connectivity
  const testApiConnectivity = async () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3005';
    devLog('🌐 Testing API connectivity to:', apiUrl);
    
    try {
      const response = await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      devLog('🌐 API connectivity test result:', {
        status: response.status,
        ok: response.ok,
        url: `${apiUrl}/api/health`
      });
    } catch (error) {
      devError('🌐 API connectivity test failed:', error);
    }
  };

  // Initialize auth state with proper validation
  useEffect(() => {
    // Get initial session and validate it (with container restart recovery)
    const getInitialSession = async () => {
      try {
        devLog('🚀 Starting getInitialSession...');
        
        // Fast initialization for anonymous users
        const { data: { session }, error } = await supabase.auth.getSession();
        
        devLog('📋 Supabase getSession result:', {
          hasSession: !!session,
          hasError: !!error,
          userId: session?.user?.id,
          email: session?.user?.email
        });

        if (error) {
          devError('❌ Supabase session error:', error);
          // Clear any stale session data
          await supabase.auth.signOut();
          sessionManager.clearSessionMetadata();
          setUser(null);
          setUserProfile(null);
        } else if (session) {
          devLog('🔍 Session found, validating with backend...');
          // Validate the session with the backend
          const isValidSession = await validateSessionWithBackend(session);
          
          devLog('✅ Session validation complete:', { isValidSession });

          if (isValidSession) {
            authStore.setSession(session);
            setUser(session.user);
            
            // Fetch user profile with timeout
            try {
              const profilePromise = fetchUserProfile(session.user.id);
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
              );
              
              await Promise.race([profilePromise, timeoutPromise]);
            } catch (profileError) {
              devWarn('⚠️ Profile fetch failed or timed out:', profileError.message);
              // Continue without profile - don't block the auth flow
              setUserProfile(null);
            }
            
            sessionManager.storeSessionMetadata(session);
          } else {
            // Session is invalid, clear it
            await supabase.auth.signOut();
            authStore.clearSession();
            sessionManager.clearSessionMetadata();
            setUser(null);
            setUserProfile(null);
          }
        } else {
          // No session found - anonymous user
          devLog('👤 No session found - setting anonymous user state');
          authStore.clearSession();
          sessionManager.clearSessionMetadata();
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        logError('❌ Error initializing auth:', error);
        // On any error, clear auth state
        authStore.clearSession();
        sessionManager.clearSessionMetadata();
        setUser(null);
        setUserProfile(null);
      } finally {
        devLog('🏁 getInitialSession complete - setting initializing and loading to false');
        setInitializing(false);
        setLoading(false);
      }
    };

    // Add timeout to initialization to prevent infinite loading
    const initTimeout = setTimeout(() => {
      if (initializing) {
        logError('⏱️ Auth initialization timeout after 3 seconds');
        setInitializing(false);
        setLoading(false);
      }
    }, 3000);

    // Test API connectivity first
    testApiConnectivity();
    
    getInitialSession().finally(() => {
      clearTimeout(initTimeout);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        devLog('Auth state changed:', event, session?.user?.email);
        
        // Handle sign out event
        if (event === 'SIGNED_OUT') {
          devLog('🔓 User signed out event received, clearing all state');
          clearSessionData();
          setLoading(false); // Ensure loading is cleared
          return;
        }
        
        try {
          if (session) {
            authStore.setSession(session);
            setUser(session.user);

            // Store session metadata for container restart recovery
            sessionManager.storeSessionMetadata(session);

            // Check for pending profile update after successful authentication
            const pendingProfileUpdate = sessionStorage.getItem('pendingProfileUpdate');
            if (pendingProfileUpdate && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
              try {
                const userData = JSON.parse(pendingProfileUpdate);
                devLog('Updating user profile with pending data:', userData);
                
                await fetchUserProfile(session.user.id);
                
                // Then update it with additional info if available
                if (userData.firstName || userData.lastName || userData.company) {
                  setTimeout(async () => {
                    try {
                      await updateUserProfile({
                        first_name: userData.firstName,
                        last_name: userData.lastName,
                        company: userData.company
                      });
                    } catch (updateError) {
                      logError('Error updating profile:', updateError);
                    }
                  }, 1000); // Small delay to ensure profile exists
                }
                
                // Clear the pending data after successful fetch
                sessionStorage.removeItem('pendingProfileUpdate');
              } catch (error) {
                logError('Error handling pending profile update:', error);
                try {
                  await fetchUserProfile(session.user.id);
                } catch (fetchError) {
                  logError('Error fetching user profile:', fetchError);
                  setUserProfile(null);
                }
              }
            } else {
              try {
                await fetchUserProfile(session.user.id);
              } catch (error) {
                logError('Error fetching user profile:', error);
                setUserProfile(null); // Ensure we set profile to null on error
              }
            }
          } else {
            authStore.clearSession();
            setUser(null);
            setUserProfile(null);
          }
        } catch (error) {
          logError('Error in auth state change handler:', error);
          // Always ensure loading state is cleared
        } finally {
          // Always set loading and initializing to false, regardless of success or failure
          setLoading(false);
          setInitializing(false);
        }
      }
    );

    return () => {
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile from database
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, try to create it
          devLog('User profile not found, attempting to create...');
          
          // Get user info from auth
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            try {
              const newProfile = await createUserProfile({
                firstName: authUser.user_metadata?.first_name || '',
                lastName: authUser.user_metadata?.last_name || '',
                company: authUser.user_metadata?.company || ''
              }, authUser);
              devLog('Profile created successfully');
            } catch (createError) {
              logError('Failed to auto-create profile:', createError);
              setUserProfile(null);
            }
          } else {
            setUserProfile(null);
          }
        } else {
          logError('Error fetching user profile:', error);
          toast.error('Error loading user profile');
        }
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      logError('Error fetching user profile:', error);
    }
  };

  // Create user profile
  const createUserProfile = async (userData, userInfo = null) => {
    try {
      // Use provided userInfo or fall back to current user state
      const currentUser = userInfo || user;
      
      if (!currentUser) {
        throw new Error('No user information available');
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: currentUser.id,
          email: currentUser.email,
          first_name: userData.firstName || '',
          last_name: userData.lastName || '',
          company: userData.company || null,
          plan_type: 'free',
          settings: {}
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setUserProfile(data);
      toast.success('Profile created successfully');
      return data;
    } catch (error) {
      logError('Error creating user profile:', error);
      toast.error('Error creating profile');
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updateData) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setUserProfile(data);
      toast.success('Profile updated successfully');
      return data;
    } catch (error) {
      logError('Error updating user profile:', error);
      toast.error('Error updating profile');
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            company: userData.company
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user && data.session) {
        // User is immediately signed in
        // Create profile manually (database trigger may not work in all Supabase configs)
        try {
          await createUserProfile(userData, data.user);
          toast.success('Account created successfully!');
        } catch (profileError) {
          devWarn('Profile creation failed, will retry later:', profileError);
          // Store user data for profile creation after auth state change
          sessionStorage.setItem('pendingProfileUpdate', JSON.stringify(userData));
          toast.success('Account created successfully!');
        }
      } else if (data.user && !data.session) {
        // Email confirmation required
        toast.success('Account created! Please check your email to verify your account.');
        if (userData.firstName || userData.lastName || userData.company) {
          sessionStorage.setItem('pendingProfileUpdate', JSON.stringify(userData));
        }
      }

      return data;
    } catch (error) {
      logError('Error signing up:', error);
      toast.error(error.message || 'Error creating account');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      toast.success('Signed in successfully');
      return data;
    } catch (error) {
      logError('Error signing in:', error);
      toast.error(error.message || 'Error signing in');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Clear all session data
  const clearSessionData = () => {
    devLog('🧹 Clearing all session data...');

    // Clear auth store
    authStore.clearSession();
    
    // Clear React state
    setUser(null);
    setUserProfile(null);

    // Use session manager for comprehensive cleanup
    sessionManager.performCompleteSessionCleanup();
  };

  // Sign out with comprehensive cleanup
  const signOut = async () => {
    try {
      devLog('🔓 AuthContext signOut: Starting sign out process...');
      setLoading(true);

      devLog('📡 AuthContext signOut: Calling supabase.auth.signOut()...');

      // Clear local state first to provide immediate feedback
      clearSessionData();
      
      // Try to sign out from Supabase with shorter timeout
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign out timeout after 3 seconds')), 3000);
      });

      try {
        const result = await Promise.race([signOutPromise, timeoutPromise]);
        const { error } = result;

        if (error) {
          logError('❌ AuthContext signOut: Supabase error:', error);
          // Don't throw - cleanup already done
        } else {
          devLog('✅ AuthContext signOut: Supabase sign out successful');
        }
      } catch (timeoutError) {
        devWarn('⚠️ AuthContext signOut: Timeout occurred, but local cleanup already complete');
        // Don't throw - cleanup already done
      }

      toast.success('Signed out successfully');
      devLog('✅ AuthContext signOut: Complete cleanup finished');
      
      // Redirect to home page after successful logout
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    } catch (error) {
      logError('❌ AuthContext signOut: Error:', error);

      // Even if there's an error, clear all session data
      clearSessionData();
      toast.success('Signed out successfully');

      devLog('✅ AuthContext signOut: Cleanup completed despite error');
    } finally {
      devLog('🔄 AuthContext signOut: Setting loading to false');
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw error;
      }

      toast.success('Password reset email sent! Check your inbox and click the link to reset your password.');
    } catch (error) {
      logError('Error resetting password:', error);
      toast.error(error.message || 'Error sending reset email');
      throw error;
    }
  };

  // Update password
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      toast.success('Password updated successfully');
    } catch (error) {
      logError('Error updating password:', error);
      toast.error(error.message || 'Error updating password');
      throw error;
    }
  };

  // Get user's monthly usage
  const getMonthlyUsage = async (action = 'analysis') => {
    if (!user) return 0;

    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('usage_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('action', action)
        .gte('created_at', startOfMonth.toISOString());

      if (error) {
        throw error;
      }

      return data ? data.length : 0;
    } catch (error) {
      logError('Error fetching usage:', error);
      return 0;
    }
  };

  // Log user action
  const logAction = async (action, resourceId = null, metadata = {}) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('usage_logs')
        .insert({
          user_id: user.id,
          action: action,
          resource_id: resourceId,
          metadata: metadata
        });

      if (error) {
        logError('Error logging action:', error);
      }
    } catch (error) {
      logError('Error logging action:', error);
    }
  };

  // Get plan limits
  const getPlanLimits = () => {
    const planType = userProfile?.plan_type || 'free';
    
    const limits = {
      free: {
        analysesPerMonth: 5,
        projectsMax: 2,
        features: ['basic_analysis', 'pdf_export']
      },
      basic: {
        analysesPerMonth: 50,
        projectsMax: 10,
        features: ['basic_analysis', 'detailed_analysis', 'pdf_export', 'project_management']
      },
      premium: {
        analysesPerMonth: 200,
        projectsMax: 50,
        features: ['basic_analysis', 'detailed_analysis', 'pdf_export', 'project_management', 'team_collaboration', 'api_access']
      }
    };

    return limits[planType] || limits.free;
  };

  // Check if user has feature access
  const hasFeature = (feature) => {
    const limits = getPlanLimits();
    return limits.features.includes(feature);
  };

  // Session health check - can be called to verify session is still valid
  const checkSessionHealth = async () => {
    try {
      devLog('🏥 Performing session health check...');

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        devLog('❌ Session health check failed: No valid session');
        if (user) {
          devLog('🧹 Clearing stale user state');
          clearSessionData();
        }
        return false;
      }

      // Validate with backend
      const isValid = await validateSessionWithBackend(session);

      if (!isValid && user) {
        devLog('❌ Session health check failed: Backend validation failed');
        devLog('🧹 Clearing invalid session');
        await supabase.auth.signOut();
        clearSessionData();
        return false;
      }

      devLog('✅ Session health check passed');
      return true;
    } catch (error) {
      logError('❌ Session health check error:', error);
      if (user) {
        clearSessionData();
      }
      return false;
    }
  };

  // Periodic session health check - disabled by default to prevent unnecessary API calls
  // Uncomment if you need automatic session validation
  // useEffect(() => {
  //   if (!user) return;
  //
  //   const healthCheckInterval = setInterval(async () => {
  //     if (document.visibilityState === 'visible') {
  //       await checkSessionHealth();
  //     }
  //   }, 5 * 60 * 1000); // 5 minutes
  //
  //   return () => clearInterval(healthCheckInterval);
  // }, [user]);

  const value = {
    user,
    userProfile,
    loading,
    initializing,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    createUserProfile,
    updateUserProfile,
    getMonthlyUsage,
    logAction,
    getPlanLimits,
    hasFeature,
    checkSessionHealth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}