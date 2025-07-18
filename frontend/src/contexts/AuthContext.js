import React, { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../config/supabase';
import { toast } from 'react-toastify';
import sessionManager from '../utils/sessionManager';

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
      return false;
    }

    try {
      console.log('🔍 Validating session with backend...');

      // Make a simple authenticated request to validate the token
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/analysis/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const isValid = response.status !== 401;
      console.log(`${isValid ? '✅' : '❌'} Session validation result:`, {
        status: response.status,
        isValid
      });

      return isValid;
    } catch (error) {
      console.warn('❌ Session validation failed:', error.message);
      return false;
    }
  };

  // Initialize auth state with proper validation
  useEffect(() => {
    // FORCE: Add timeout to prevent infinite loading
    const forceComplete = setTimeout(() => {
      console.log('⏰ FORCE: Auth initialization timeout, completing anyway');
      setInitializing(false);
      setLoading(false);
    }, 3000); // 3 second timeout

    // Get initial session and validate it (with container restart recovery)
    const getInitialSession = async () => {
      try {
        console.log('🔄 Initializing auth state...');
        console.log('🔍 DEBUG: About to check container restart');

        // Check if we might be recovering from a container restart
        if (sessionManager.isContainerRestart()) {
          console.log('🔄 Detected potential container restart, attempting recovery...');
          const recoveredSession = await sessionManager.recoverSessionAfterRestart();

          if (recoveredSession) {
            console.log('✅ Session recovered from container restart');

            // TEMPORARY: Skip backend validation for session recovery too
            console.log('⚠️ TEMPORARILY SKIPPING backend validation for session recovery');
            console.log('✅ Setting user state from recovered session (validation bypassed)');
            console.log('👤 Recovered user:', recoveredSession.user);

            setUser(recoveredSession.user);
            console.log('✅ User state set, fetching profile...');

            // TEMPORARY: Skip profile fetch to test dashboard loading
            console.log('⚠️ TEMPORARILY SKIPPING profile fetch for session recovery');
            // await fetchUserProfile(recoveredSession.user.id);
            console.log('✅ Profile fetch skipped, storing session metadata...');

            sessionManager.storeSessionMetadata(recoveredSession);
            console.log('✅ Session recovery complete, returning early');
            console.log('🔍 DEBUG: About to return from session recovery');
            return;

            // TODO: Re-enable this after testing
            // // Validate recovered session with backend
            // const isValid = await validateSessionWithBackend(recoveredSession);
            //
            // if (isValid) {
            //   setUser(recoveredSession.user);
            //   await fetchUserProfile(recoveredSession.user.id);
            //   sessionManager.storeSessionMetadata(recoveredSession);
            //   return;
            // } else {
            //   console.log('❌ Recovered session is invalid');
            //   sessionManager.clearSessionMetadata();
            // }
          } else {
            console.log('❌ No session recovered from container restart');
          }
        } else {
          console.log('ℹ️ No container restart detected, proceeding with normal initialization');
        }

        console.log('🔍 DEBUG: About to call normal session initialization');
        // Normal session initialization
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔍 DEBUG: Got session from Supabase:', !!session, !!error);

        if (error) {
          console.error('❌ Error getting session:', error);
          // Clear any stale session data
          await supabase.auth.signOut();
          sessionManager.clearSessionMetadata();
          setUser(null);
          setUserProfile(null);
        } else if (session) {
          console.log('📋 Found stored session, validating with backend...');

          // TEMPORARY: Skip backend validation to test dashboard
          console.log('⚠️ TEMPORARILY SKIPPING backend validation for testing');
          console.log('✅ Session found, setting user state (validation bypassed)');
          setUser(session.user);
          // TEMPORARY: Skip profile fetch to test dashboard loading
          console.log('⚠️ TEMPORARILY SKIPPING profile fetch for normal session');
          // await fetchUserProfile(session.user.id);
          // Store metadata for future container restart recovery
          sessionManager.storeSessionMetadata(session);

          // TODO: Re-enable this after testing
          // // Validate the session with the backend
          // const isValidSession = await validateSessionWithBackend(session);
          //
          // if (isValidSession) {
          //   console.log('✅ Session is valid, setting user state');
          //   setUser(session.user);
          //   await fetchUserProfile(session.user.id);
          //   // Store metadata for future container restart recovery
          //   sessionManager.storeSessionMetadata(session);
          // } else {
          //   console.log('❌ Session is invalid, clearing auth state');
          //   // Session is invalid, clear it
          //   await supabase.auth.signOut();
          //   sessionManager.clearSessionMetadata();
          //   setUser(null);
          //   setUserProfile(null);
          // }
        } else {
          console.log('ℹ️ No session found');
          sessionManager.clearSessionMetadata();
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        // On any error, clear auth state
        sessionManager.clearSessionMetadata();
        setUser(null);
        setUserProfile(null);
      } finally {
        console.log('🏁 Auth initialization complete, setting states to false');
        clearTimeout(forceComplete);
        setInitializing(false);
        setLoading(false);

        // Log final auth state
        setTimeout(() => {
          console.log('🏁 Final auth state after initialization:', {
            user: user ? { id: user.id, email: user.email } : null,
            initializing: false,
            loading: false
          });
        }, 100);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        try {
          if (session) {
            setUser(session.user);

            // Store session metadata for container restart recovery
            sessionManager.storeSessionMetadata(session);

            // Check for pending profile update after successful authentication
            const pendingProfileUpdate = sessionStorage.getItem('pendingProfileUpdate');
            if (pendingProfileUpdate && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
              try {
                const userData = JSON.parse(pendingProfileUpdate);
                console.log('Updating user profile with pending data:', userData);
                
                // TEMPORARY: Skip profile fetch to prevent hanging
                console.log('⚠️ TEMPORARILY SKIPPING profile fetch in auth state change');
                // await fetchUserProfile(session.user.id);
                
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
                      console.error('Error updating profile:', updateError);
                    }
                  }, 1000); // Small delay to ensure profile exists
                }
                
                // Clear the pending data after successful fetch
                sessionStorage.removeItem('pendingProfileUpdate');
              } catch (error) {
                console.error('Error handling pending profile update:', error);
                // TEMPORARY: Skip profile fetch to prevent hanging
                console.log('⚠️ TEMPORARILY SKIPPING profile fetch in error handler');
                setUserProfile(null);
                // try {
                //   await fetchUserProfile(session.user.id);
                // } catch (fetchError) {
                //   console.error('Error fetching user profile:', fetchError);
                //   setUserProfile(null);
                // }
              }
            } else {
              // TEMPORARY: Skip profile fetch to prevent hanging
              console.log('⚠️ TEMPORARILY SKIPPING profile fetch in normal flow');
              setUserProfile(null);
              // try {
              //   await fetchUserProfile(session.user.id);
              // } catch (error) {
              //   console.error('Error fetching user profile:', error);
              //   setUserProfile(null); // Ensure we set profile to null on error
              // }
            }
          } else {
            setUser(null);
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error in auth state change handler:', error);
          // Always ensure loading state is cleared
        } finally {
          // Always set loading to false, regardless of success or failure
          setLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(forceComplete);
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
          // Profile doesn't exist, create it
          console.log('User profile not found, will create on next login');
          setUserProfile(null);
        } else {
          console.error('Error fetching user profile:', error);
          toast.error('Error loading user profile');
        }
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
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
          first_name: userData.firstName,
          last_name: userData.lastName,
          company: userData.company,
          plan_type: 'free'
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
      console.error('Error creating user profile:', error);
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
      console.error('Error updating user profile:', error);
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
        // Profile will be created automatically by database trigger
        // But we'll update it with additional info if provided
        toast.success('Account created successfully!');
        
        if (userData.firstName || userData.lastName || userData.company) {
          // Store user data for profile update after auth state change
          sessionStorage.setItem('pendingProfileUpdate', JSON.stringify(userData));
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
      console.error('Error signing up:', error);
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
      console.error('Error signing in:', error);
      toast.error(error.message || 'Error signing in');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Clear all session data
  const clearSessionData = () => {
    console.log('🧹 Clearing all session data...');

    // Clear React state
    setUser(null);
    setUserProfile(null);

    // Use session manager for comprehensive cleanup
    sessionManager.performCompleteSessionCleanup();
  };

  // Sign out with comprehensive cleanup
  const signOut = async () => {
    try {
      console.log('🔓 AuthContext signOut: Starting sign out process...');
      setLoading(true);

      console.log('📡 AuthContext signOut: Calling supabase.auth.signOut()...');

      // Try to sign out with timeout
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign out timeout after 10 seconds')), 10000);
      });

      try {
        const result = await Promise.race([signOutPromise, timeoutPromise]);
        const { error } = result;

        if (error) {
          console.error('❌ AuthContext signOut: Supabase error:', error);
          // Don't throw - continue with cleanup
        } else {
          console.log('✅ AuthContext signOut: Supabase sign out successful');
        }
      } catch (timeoutError) {
        console.warn('⚠️ AuthContext signOut: Timeout occurred, proceeding with local signout');
        // Don't throw - continue with local signout
      }

      // Always clear all session data regardless of API response
      clearSessionData();
      toast.success('Signed out successfully');

      console.log('✅ AuthContext signOut: Complete cleanup finished');
    } catch (error) {
      console.error('❌ AuthContext signOut: Error:', error);

      // Even if there's an error, clear all session data
      clearSessionData();
      toast.success('Signed out successfully');

      console.log('✅ AuthContext signOut: Cleanup completed despite error');
    } finally {
      console.log('🔄 AuthContext signOut: Setting loading to false');
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
      console.error('Error resetting password:', error);
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
      console.error('Error updating password:', error);
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
      console.error('Error fetching usage:', error);
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
        console.error('Error logging action:', error);
      }
    } catch (error) {
      console.error('Error logging action:', error);
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
      console.log('🏥 Performing session health check...');

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        console.log('❌ Session health check failed: No valid session');
        if (user) {
          console.log('🧹 Clearing stale user state');
          clearSessionData();
        }
        return false;
      }

      // Validate with backend
      const isValid = await validateSessionWithBackend(session);

      if (!isValid && user) {
        console.log('❌ Session health check failed: Backend validation failed');
        console.log('🧹 Clearing invalid session');
        await supabase.auth.signOut();
        clearSessionData();
        return false;
      }

      console.log('✅ Session health check passed');
      return true;
    } catch (error) {
      console.error('❌ Session health check error:', error);
      if (user) {
        clearSessionData();
      }
      return false;
    }
  };

  // TEMPORARY: Disable periodic session health check for testing
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