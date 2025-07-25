import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from 'react-icons/fa';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--color-surface-primary);
  padding: 20px;
`;

const LoginCard = styled.div`
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

const LoginButton = styled.button`
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

const ForgotPassword = styled(Link)`
  display: block;
  text-align: center;
  color: var(--color-primary);
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 24px;

  &:hover {
    text-decoration: underline;
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

const SignUpLink = styled.p`
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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Title>{t('auth.signIn', 'Sign In')}</Title>
        <Subtitle>{t('auth.signInSubtitle', 'Sign in to your StreetWiseWeb account')}</Subtitle>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>{t('auth.email', 'Email')}</Label>
            <InputContainer>
              <InputIcon>
                <FaEnvelope />
              </InputIcon>
              <Input
                type="email"
                placeholder={t('auth.emailPlaceholder', 'Enter your email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </InputContainer>
          </FormGroup>

          <FormGroup>
            <Label>{t('auth.password', 'Password')}</Label>
            <InputContainer>
              <InputIcon>
                <FaLock />
              </InputIcon>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
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
          </FormGroup>

          <LoginButton type="submit" disabled={loading}>
            {loading ? t('common.loading', 'Loading...') : t('auth.signIn', 'Sign In')}
          </LoginButton>
        </Form>

        <ForgotPassword to="/forgot-password">
          {t('auth.forgotPassword', 'Forgot your password?')}
        </ForgotPassword>

        <Divider>
          <span>{t('auth.or', 'or')}</span>
        </Divider>

        <SignUpLink>
          {t('auth.noAccount', "Don't have an account?")}{' '}
          <Link to="/register">{t('auth.signUp', 'Sign Up')}</Link>
        </SignUpLink>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;