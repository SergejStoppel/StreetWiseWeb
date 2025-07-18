import React, { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../config/supabase';
import { toast } from 'react-toastify';

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

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else if (session) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setInitializing(false);
        setLoading(false);
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
            
            // Check for pending profile update after successful authentication
            const pendingProfileUpdate = sessionStorage.getItem('pendingProfileUpdate');
            if (pendingProfileUpdate && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
              try {
                const userData = JSON.parse(pendingProfileUpdate);
                console.log('Updating user profile with pending data:', userData);
                
                // Fetch the profile first (should exist due to trigger)
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
                      console.error('Error updating profile:', updateError);
                    }
                  }, 1000); // Small delay to ensure profile exists
                }
                
                // Clear the pending data after successful fetch
                sessionStorage.removeItem('pendingProfileUpdate');
              } catch (error) {
                console.error('Error handling pending profile update:', error);
                // Try to fetch profile anyway
                try {
                  await fetchUserProfile(session.user.id);
                } catch (fetchError) {
                  console.error('Error fetching user profile:', fetchError);
                  setUserProfile(null);
                }
              }
            } else {
              // Normal flow - try to fetch existing profile
              try {
                await fetchUserProfile(session.user.id);
              } catch (error) {
                console.error('Error fetching user profile:', error);
                setUserProfile(null); // Ensure we set profile to null on error
              }
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

  // Sign out
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
          throw error;
        }
        
        console.log('✅ AuthContext signOut: Supabase sign out successful');
      } catch (timeoutError) {
        console.warn('⚠️ AuthContext signOut: Timeout occurred, proceeding with local signout');
        // Don't throw - continue with local signout
      }

      // Always clear local state regardless of API response
      setUser(null);
      setUserProfile(null);
      toast.success('Signed out successfully');
      
      console.log('✅ AuthContext signOut: Local state cleared');
    } catch (error) {
      console.error('❌ AuthContext signOut: Error:', error);
      
      // Even if there's an error, clear local state
      setUser(null);
      setUserProfile(null);
      toast.success('Signed out successfully');
      
      console.log('✅ AuthContext signOut: Local state cleared despite error');
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
    hasFeature
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}