import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaLock, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import supabase from '../config/supabase';
import { authStore } from '../utils/authStore';

const SettingsContainer = styled.div`
  min-height: 80vh;
  padding: var(--spacing-4xl) var(--container-padding);
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: var(--font-size-3xl);
  color: var(--color-text-primary);
  font-family: var(--font-family-primary);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-md);
`;

const Subtitle = styled.p`
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-4xl);
`;

const SettingsSection = styled.div`
  background-color: var(--color-surface-elevated);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-2xl);
  margin-bottom: var(--spacing-xl);
  border: 1px solid var(--color-border-primary);
`;

const SectionTitle = styled.h2`
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
`;

const SectionDescription = styled.p`
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
`;

const Label = styled.label`
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
`;

const Input = styled.input`
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--border-radius-md);
  background-color: var(--color-background-primary);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);

  &:focus {
    outline: none;
    border-color: var(--color-interactive-primary);
    box-shadow: 0 0 0 2px var(--color-interactive-primary-alpha);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Button = styled.button`
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  border-radius: var(--border-radius-md);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  align-self: flex-start;

  ${props => props.$variant === 'primary' && `
    background-color: var(--color-interactive-primary);
    color: white;

    &:hover:not(:disabled) {
      background-color: var(--color-interactive-primary-hover);
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }
  `}

  ${props => props.$variant === 'danger' && `
    background-color: var(--color-error);
    color: white;

    &:hover:not(:disabled) {
      background-color: var(--color-error-dark, #a00);
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DangerZone = styled.div`
  background-color: var(--color-error-surface, rgba(220, 38, 38, 0.05));
  border: 1px solid var(--color-error);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-2xl);
`;

const WarningText = styled.p`
  font-size: var(--font-size-base);
  color: var(--color-error-text, var(--color-error));
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  line-height: var(--line-height-relaxed);

  svg {
    margin-top: 2px;
    flex-shrink: 0;
    color: var(--color-error);
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-index-modal, 1000);
  padding: var(--spacing-xl);
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background-color: var(--color-surface-elevated);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-2xl);
  max-width: 500px;
  width: 100%;
  box-shadow: var(--shadow-2xl);
  border: 1px solid var(--color-border-primary);
`;

const ModalTitle = styled.h3`
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  color: var(--color-error);
`;

const ModalText = styled.p`
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: var(--line-height-relaxed);
`;

const ModalButtons = styled.div`
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-xl);
`;

const ModalButton = styled.button`
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-family-primary);
  background-color: var(--color-surface-secondary);
  color: var(--color-text-primary);

  &:hover:not(:disabled) {
    background-color: var(--color-surface-elevated);
    border-color: var(--color-border-secondary);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Settings = () => {
  const { user, userProfile, updatePassword, signOut } = useAuth();
  const navigate = useNavigate();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [isDeleteEnabled, setIsDeleteEnabled] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setUpdatingPassword(true);
      await updatePassword(passwordForm.newPassword);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast.success('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      console.log('Starting account deletion process...');
      
      if (!user) {
        throw new Error('No authenticated user');
      }
      
      // Get the session from the auth store (faster and more reliable)
      console.log('Getting session from auth store...');
      
      let session = authStore.getSession();
      console.log('Auth store session:', { hasSession: !!session, hasToken: !!session?.access_token });
      
      if (!session?.access_token) {
        console.log('No session in auth store, trying Supabase directly...');
        // Fallback: try to get session from Supabase with a short timeout
        try {
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session fetch timeout')), 2000)
          );
          
          const result = await Promise.race([sessionPromise, timeoutPromise]);
          session = result.data.session;
          console.log('Supabase session:', { hasSession: !!session, hasToken: !!session?.access_token });
        } catch (sessionError) {
          console.error('Failed to get session:', sessionError);
          throw new Error('Unable to authenticate - please sign in again');
        }
      }
      
      if (!session?.access_token) {
        throw new Error('No valid session token available');
      }
      
      console.log('Got session token, calling backend to delete account...');
      
      // Call backend to delete account
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3005';
      console.log('API URL:', apiUrl);
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(`${apiUrl}/api/auth/account`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          let errorMessage = 'Failed to delete account';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If response is not JSON, use default error message
          }
          throw new Error(errorMessage);
        }
        
        // Only parse JSON if response is ok
        let data;
        try {
          data = await response.json();
          console.log('Response data:', data);
        } catch (e) {
          // Response might not have JSON body
          console.log('No JSON response body');
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        throw fetchError;
      }

      toast.success('Account deleted successfully');
      
      // Clear modal state before signing out
      setShowDeleteModal(false);
      setDeleteConfirmEmail('');
      setIsDeleteEnabled(false);
      
      // Small delay to ensure state updates
      setTimeout(async () => {
        // Sign out and redirect to home
        await signOut();
        navigate('/');
      }, 100);
      
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Failed to delete account. Please try again.');
      setDeletingAccount(false);
    }
  };

  return (
    <SettingsContainer>
      <Title>Account Settings</Title>
      <Subtitle>Manage your account settings and preferences</Subtitle>

      {/* Account Information */}
      <SettingsSection>
        <SectionTitle>Account Information</SectionTitle>
        <FormGroup>
          <Label>Email</Label>
          <Input 
            type="email" 
            value={user?.email || ''} 
            disabled 
            readOnly
          />
        </FormGroup>
        {userProfile?.full_name && (
          <FormGroup>
            <Label>Name</Label>
            <Input 
              type="text" 
              value={userProfile.full_name} 
              disabled 
              readOnly
            />
          </FormGroup>
        )}
      </SettingsSection>

      {/* Change Password */}
      <SettingsSection>
        <SectionTitle>
          <FaLock /> Change Password
        </SectionTitle>
        <SectionDescription>
          Update your password to keep your account secure
        </SectionDescription>
        <Form onSubmit={handlePasswordUpdate}>
          <FormGroup>
            <Label>New Password</Label>
            <Input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              placeholder="Enter new password"
              required
              minLength={6}
              disabled={updatingPassword}
              autoComplete="new-password"
            />
          </FormGroup>
          <FormGroup>
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="Confirm new password"
              required
              minLength={6}
              disabled={updatingPassword}
              autoComplete="new-password"
            />
          </FormGroup>
          <Button 
            type="submit" 
            $variant="primary" 
            disabled={updatingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
          >
            {updatingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </Form>
      </SettingsSection>

      {/* Delete Account */}
      <SettingsSection>
        <SectionTitle>
          <FaTrash /> Delete Account
        </SectionTitle>
        <DangerZone>
          <WarningText>
            <FaExclamationTriangle />
            <span>
              <strong>Warning:</strong> Deleting your account is permanent and cannot be undone. 
              All your data, including analysis history and saved reports, will be permanently deleted.
            </span>
          </WarningText>
          <Button 
            $variant="danger" 
            onClick={() => setShowDeleteModal(true)}
          >
            <FaTrash /> Delete My Account
          </Button>
        </DangerZone>
      </SettingsSection>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal onClick={() => setShowDeleteModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              <FaExclamationTriangle /> Delete Account
            </ModalTitle>
            <ModalText>
              Are you absolutely sure you want to delete your account? This action cannot be undone. 
              All your data will be permanently deleted.
            </ModalText>
            <ModalText style={{ fontWeight: 'bold' }}>
              Type your email address ({user?.email}) to confirm:
            </ModalText>
            <Input
              type="email"
              placeholder="Enter your email to confirm"
              value={deleteConfirmEmail}
              onChange={(e) => {
                const value = e.target.value;
                setDeleteConfirmEmail(value);
                setIsDeleteEnabled(value === user?.email);
                if (value === user?.email) {
                  e.target.style.borderColor = 'var(--color-success)';
                } else {
                  e.target.style.borderColor = 'var(--color-border-secondary)';
                }
              }}
              style={{ marginBottom: 'var(--spacing-xl)' }}
            />
            <ModalButtons>
              <ModalButton 
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmEmail('');
                  setIsDeleteEnabled(false);
                }}
                disabled={deletingAccount}
              >
                Cancel
              </ModalButton>
              <Button 
                $variant="danger" 
                onClick={handleDeleteAccount}
                disabled={deletingAccount || !isDeleteEnabled}
              >
                {deletingAccount ? 'Deleting...' : 'Delete My Account'}
              </Button>
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}
    </SettingsContainer>
  );
};

export default Settings;