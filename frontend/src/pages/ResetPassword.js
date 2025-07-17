import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { FaEye, FaEyeSlash, FaLock, FaCheck } from 'react-icons/fa';

const ResetPasswordContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--color-surface-primary);
  padding: 20px;
`;

const ResetPasswordCard = styled.div`
  background: var(--color-surface-secondary);
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--color-border-primary);
`;

const Title = styled.h1`
  color: var(--color-text-primary);
  text-align: center;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
`;

const Subtitle = styled.p`
  color: var(--color-text-secondary);
  text-align: center;
  margin-bottom: 32px;
  font-size: 14px;
`;

const Form = styled.form`
  width: 100%;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: var(--color-text-primary);
  font-weight: 500;
  font-size: 14px;
`;

const InputContainer = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  padding-left: 44px;
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
  font-size: 14px;
  background: var(--color-surface-primary);
  color: var(--color-text-primary);
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  &::placeholder {
    color: var(--color-text-secondary);
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-secondary);
  font-size: 16px;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 16px;
  padding: 0;

  &:hover {
    color: var(--color-text-primary);
  }
`;

const PasswordStrength = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: ${props => {
    switch (props.strength) {
      case 'strong': return 'var(--color-success)';
      case 'medium': return 'var(--color-warning)';
      case 'weak': return 'var(--color-error)';
      default: return 'var(--color-text-secondary)';
    }
  }};
`;

const UpdateButton = styled.button`
  width: 100%;
  padding: 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 16px;

  &:hover {
    background: var(--color-primary-hover);
  }

  &:disabled {
    background: var(--color-disabled);
    cursor: not-allowed;
  }
`;

const LoginLink = styled(Link)`
  display: block;
  text-align: center;
  color: var(--color-primary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid var(--color-error);
  color: var(--color-error);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
`;

const SuccessMessage = styled.div`
  background: rgba(40, 167, 69, 0.1);
  border: 1px solid var(--color-success);
  color: var(--color-success);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');

  const { updatePassword } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check password strength
  useEffect(() => {
    if (password) {
      const strength = checkPasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength('');
    }
  }, [password]);

  const checkPasswordStrength = (password) => {
    if (password.length < 6) return 'weak';
    if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return 'strong';
    return 'medium';
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 'strong': return 'Strong password';
      case 'medium': return 'Medium password';
      case 'weak': return 'Weak password';
      default: return '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await updatePassword(password);
      setSuccess(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setError(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <ResetPasswordContainer>
        <ResetPasswordCard>
          <Title>{t('auth.passwordUpdated', 'Password Updated!')}</Title>
          <SuccessMessage>
            <FaCheck />
            Your password has been successfully updated. Redirecting to dashboard...
          </SuccessMessage>
        </ResetPasswordCard>
      </ResetPasswordContainer>
    );
  }

  return (
    <ResetPasswordContainer>
      <ResetPasswordCard>
        <Title>{t('auth.resetPassword', 'Reset Password')}</Title>
        <Subtitle>{t('auth.resetPasswordSubtitle', 'Enter your new password below')}</Subtitle>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>{t('auth.newPassword', 'New Password')}</Label>
            <InputContainer>
              <InputIcon>
                <FaLock />
              </InputIcon>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.passwordPlaceholder', 'Enter your new password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </PasswordToggle>
            </InputContainer>
            {passwordStrength && (
              <PasswordStrength strength={passwordStrength}>
                {getPasswordStrengthText()}
              </PasswordStrength>
            )}
          </FormGroup>

          <FormGroup>
            <Label>{t('auth.confirmPassword', 'Confirm Password')}</Label>
            <InputContainer>
              <InputIcon>
                <FaLock />
              </InputIcon>
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={t('auth.confirmPasswordPlaceholder', 'Confirm your new password')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </PasswordToggle>
            </InputContainer>
          </FormGroup>

          <UpdateButton type="submit" disabled={loading}>
            {loading ? t('common.loading', 'Loading...') : t('auth.updatePassword', 'Update Password')}
          </UpdateButton>
        </Form>

        <LoginLink to="/login">
          {t('auth.backToLogin', 'Back to Login')}
        </LoginLink>
      </ResetPasswordCard>
    </ResetPasswordContainer>
  );
};

export default ResetPassword;