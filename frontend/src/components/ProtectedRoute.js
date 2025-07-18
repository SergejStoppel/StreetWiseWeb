import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styled from 'styled-components';

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--color-surface-primary);
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border-primary);
  border-top: 4px solid var(--color-interactive-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  margin-left: var(--spacing-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
`;

const ProtectedRoute = ({ children, requireProfile = false, requiredFeature = null }) => {
  const { user, userProfile, loading, initializing, hasFeature } = useAuth();
  const location = useLocation();

  console.log('🛡️ ProtectedRoute: State check', {
    user: user ? { id: user.id, email: user.email } : null,
    userProfile: userProfile ? { id: userProfile.id } : null,
    loading,
    initializing,
    pathname: location.pathname
  });

  // Show loading spinner while initializing or loading
  if (initializing || loading) {
    console.log('🛡️ ProtectedRoute: Showing loading spinner', { initializing, loading });
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>Loading...</LoadingText>
      </LoadingContainer>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('🛡️ ProtectedRoute: No user found, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to profile setup if profile is required but doesn't exist
  if (requireProfile && !userProfile) {
    console.log('🛡️ ProtectedRoute: Profile required but not found, redirecting to setup');
    return <Navigate to="/setup-profile" state={{ from: location }} replace />;
  }

  // Check feature access if required
  if (requiredFeature && !hasFeature(requiredFeature)) {
    console.log('🛡️ ProtectedRoute: Feature access denied, redirecting to upgrade');
    return <Navigate to="/upgrade" state={{ from: location, feature: requiredFeature }} replace />;
  }

  console.log('🛡️ ProtectedRoute: All checks passed, rendering children');
  return children;
};

export default ProtectedRoute;