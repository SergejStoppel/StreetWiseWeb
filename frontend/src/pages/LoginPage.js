import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaArrowRight, FaShieldAlt, FaChartLine, FaFileAlt } from 'react-icons/fa';

const LoginContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
`;

const LoginCard = styled.div`
  background-color: var(--color-white);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-2xl);
  overflow: hidden;
  max-width: 900px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    max-width: 400px;
  }
`;

const LoginForm = styled.div`
  padding: var(--spacing-2xl);
  
  @media (max-width: 768px) {
    padding: var(--spacing-xl);
  }
`;

const LoginSidebar = styled.div`
  background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
  color: var(--color-white);
  padding: var(--spacing-2xl);
  display: flex;
  flex-direction: column;
  justify-content: center;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const Logo = styled.div`
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-xl);
  text-align: center;
`;

const FormTitle = styled.h1`
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
  text-align: center;
`;

const FormSubtitle = styled.p`
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
`;

const FormGroup = styled.div`
  position: relative;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: var(--spacing-xs);
  font-family: var(--font-primary);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  padding-left: 3rem;
  font-family: var(--font-secondary);
  font-size: var(--font-size-body);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background-color: var(--color-white);
  border: 2px solid var(--color-gray-border);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }
  
  &::placeholder {
    color: var(--color-text-muted);
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0;
  
  &:hover {
    color: var(--color-primary);
  }
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 1rem 2rem;
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-md);
  font-family: var(--font-primary);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  
  &:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const FormLinks = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-md);
  font-size: var(--font-size-small);
`;

const FormLink = styled(Link)`
  color: var(--color-primary);
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ComingSoonNotice = styled.div`
  background-color: var(--color-warning-light);
  border: 2px solid var(--color-warning);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  text-align: center;
`;

const ComingSoonTitle = styled.h3`
  color: var(--color-warning-dark);
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-xs);
`;

const ComingSoonText = styled.p`
  color: var(--color-warning-dark);
  font-size: var(--font-size-small);
`;

const SidebarTitle = styled.h2`
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-lg);
  color: var(--color-white);
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin-bottom: var(--spacing-xl);
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  color: var(--color-white);
  font-size: var(--font-size-body);
`;

const FeatureIcon = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  background-color: rgba(255, 255, 255, 0.2);
  color: var(--color-white);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const SidebarQuote = styled.blockquote`
  font-style: italic;
  font-size: var(--font-size-body);
  color: var(--color-white);
  opacity: 0.9;
  margin: 0;
  padding: var(--spacing-md);
  border-left: 3px solid rgba(255, 255, 255, 0.3);
`;

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login attempt
    setTimeout(() => {
      setIsLoading(false);
      alert('Client portal is coming soon! We\'ll notify you when it\'s ready.');
    }, 2000);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <LoginContainer>
      <LoginCard>
        <LoginForm>
          <Logo>SiteCraft</Logo>
          
          <ComingSoonNotice>
            <ComingSoonTitle>Client Portal Coming Soon!</ComingSoonTitle>
            <ComingSoonText>
              We're building an amazing dashboard for you to track your projects and reports.
            </ComingSoonText>
          </ComingSoonNotice>

          <FormTitle>Welcome Back</FormTitle>
          <FormSubtitle>Sign in to access your client dashboard</FormSubtitle>

          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <FormLabel htmlFor="email">Email Address</FormLabel>
              <div style={{ position: 'relative' }}>
                <InputIcon>
                  <FaUser />
                </InputIcon>
                <FormInput
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="password">Password</FormLabel>
              <div style={{ position: 'relative' }}>
                <InputIcon>
                  <FaLock />
                </InputIcon>
                <FormInput
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
                <PasswordToggle
                  type="button"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </PasswordToggle>
              </div>
            </FormGroup>

            <LoginButton type="submit" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'} <FaArrowRight />
            </LoginButton>
          </Form>

          <FormLinks>
            <FormLink to="#" onClick={(e) => e.preventDefault()}>
              Forgot Password?
            </FormLink>
            <FormLink to="#" onClick={(e) => e.preventDefault()}>
              Request Access
            </FormLink>
          </FormLinks>
        </LoginForm>

        <LoginSidebar>
          <SidebarTitle>Your Client Portal Will Include:</SidebarTitle>
          
          <FeatureList>
            <FeatureItem>
              <FeatureIcon>
                <FaChartLine />
              </FeatureIcon>
              <span>Real-time project progress tracking</span>
            </FeatureItem>
            
            <FeatureItem>
              <FeatureIcon>
                <FaFileAlt />
              </FeatureIcon>
              <span>Downloadable accessibility & SEO reports</span>
            </FeatureItem>
            
            <FeatureItem>
              <FeatureIcon>
                <FaShieldAlt />
              </FeatureIcon>
              <span>Compliance certificates and documentation</span>
            </FeatureItem>
          </FeatureList>

          <SidebarQuote>
            "Having a dedicated portal to track our website improvements and access reports has been invaluable for our business."
          </SidebarQuote>
        </LoginSidebar>
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage;