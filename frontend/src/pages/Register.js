import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUser, FaBuilding } from 'react-icons/fa';

const RegisterContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--color-surface-primary);
  padding: 20px;
`;

const RegisterCard = styled.div`
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

const FormRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  flex: 1;
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
    border-color: var(--color-border-focus);
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
      case 'strong': return 'var(--color-success-text)';
      case 'medium': return 'var(--color-warning-text)';
      case 'weak': return 'var(--color-error-text)';
      default: return 'var(--color-text-secondary)';
    }
  }};
`;

const RegisterButton = styled.button`
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

const Terms = styled.div`
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: center;
  margin-bottom: 24px;
  
  a {
    color: var(--color-primary);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Divider = styled.div`
  text-align: center;
  margin: 24px 0;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--color-border-primary);
  }
  
  span {
    background: var(--color-surface-secondary);
    padding: 0 16px;
    color: var(--color-text-secondary);
    font-size: 14px;
  }
`;

const SignInLink = styled.p`
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
  margin: 0;
  
  a {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 600;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorMessage = styled.div`
  background: var(--color-error-light);
  border: 1px solid var(--color-border-error);
  color: var(--color-error-text);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
`;

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');

  const { signUp, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Check password strength
  useEffect(() => {
    if (formData.password) {
      const strength = checkPasswordStrength(formData.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength('');
    }
  }, [formData.password]);

  const checkPasswordStrength = (password) => {
    if (password.length < 6) return 'weak';
    if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return 'strong';
    return 'medium';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company
      });
      
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 'strong': return 'Strong password';
      case 'medium': return 'Medium password';
      case 'weak': return 'Weak password';
      default: return '';
    }
  };

  return (
    <RegisterContainer>
      <RegisterCard>
        <Title>{t('auth.signUp', 'Sign Up')}</Title>
        <Subtitle>{t('auth.signUpSubtitle', 'Create your StreetWiseWeb account')}</Subtitle>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <FormRow>
            <FormGroup>
              <Label>{t('auth.firstName', 'First Name')} *</Label>
              <InputContainer>
                <InputIcon>
                  <FaUser />
                </InputIcon>
                <Input
                  type="text"
                  name="firstName"
                  placeholder={t('auth.firstNamePlaceholder', 'John')}
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </InputContainer>
            </FormGroup>

            <FormGroup>
              <Label>{t('auth.lastName', 'Last Name')} *</Label>
              <InputContainer>
                <InputIcon>
                  <FaUser />
                </InputIcon>
                <Input
                  type="text"
                  name="lastName"
                  placeholder={t('auth.lastNamePlaceholder', 'Doe')}
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </InputContainer>
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label>{t('auth.email', 'Email')} *</Label>
            <InputContainer>
              <InputIcon>
                <FaEnvelope />
              </InputIcon>
              <Input
                type="email"
                name="email"
                placeholder={t('auth.emailPlaceholder', 'john@example.com')}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </InputContainer>
          </FormGroup>

          <FormGroup>
            <Label>{t('auth.company', 'Company')} ({t('common.optional', 'optional')})</Label>
            <InputContainer>
              <InputIcon>
                <FaBuilding />
              </InputIcon>
              <Input
                type="text"
                name="company"
                placeholder={t('auth.companyPlaceholder', 'Acme Inc.')}
                value={formData.company}
                onChange={handleChange}
              />
            </InputContainer>
          </FormGroup>

          <FormGroup>
            <Label>{t('auth.password', 'Password')} *</Label>
            <InputContainer>
              <InputIcon>
                <FaLock />
              </InputIcon>
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
                value={formData.password}
                onChange={handleChange}
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
            <Label>{t('auth.confirmPassword', 'Confirm Password')} *</Label>
            <InputContainer>
              <InputIcon>
                <FaLock />
              </InputIcon>
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder={t('auth.confirmPasswordPlaceholder', 'Confirm your password')}
                value={formData.confirmPassword}
                onChange={handleChange}
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

          <RegisterButton type="submit" disabled={loading}>
            {loading ? t('common.loading', 'Loading...') : t('auth.createAccount', 'Create Account')}
          </RegisterButton>
        </Form>

        <Terms>
          {t('auth.termsAgreement', 'By creating an account, you agree to our')}{' '}
          <Link to="/terms">{t('auth.termsOfService', 'Terms of Service')}</Link> {t('common.and', 'and')}{' '}
          <Link to="/privacy">{t('auth.privacyPolicy', 'Privacy Policy')}</Link>
        </Terms>

        <Divider>
          <span>{t('auth.or', 'or')}</span>
        </Divider>

        <SignInLink>
          {t('auth.haveAccount', 'Already have an account?')}{' '}
          <Link to="/login">{t('auth.signIn', 'Sign In')}</Link>
        </SignInLink>
      </RegisterCard>
    </RegisterContainer>
  );
};

export default Register;