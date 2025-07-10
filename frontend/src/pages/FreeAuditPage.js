import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaRocket, FaShieldAlt, FaUsers, FaChartLine, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const AuditContainer = styled.div`
  min-height: 100vh;
  background-color: var(--color-surface-primary);
`;

const HeroSection = styled.section`
  padding: var(--spacing-4xl) 0 var(--spacing-2xl);
  background: linear-gradient(135deg, var(--color-interactive-primary) 0%, var(--color-interactive-primary-hover) 100%);
  color: var(--color-text-inverse);
  text-align: center;
`;

const HeroContent = styled.div`
  max-width: 75%;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  
  @media (min-width: 768px) {
    padding: 0 var(--spacing-lg);
  }
  
  @media (min-width: 1200px) {
    padding: 0 var(--spacing-xl);
  }
`;

const HeroTitle = styled.h1`
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-extrabold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-inverse);
  line-height: var(--line-height-tight);
`;

const HeroSubtitle = styled.p`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-regular);
  font-family: var(--font-family-secondary);
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-inverse);
  opacity: 0.9;
  max-width: var(--content-max-width);
  margin-left: auto;
  margin-right: auto;
  line-height: var(--line-height-relaxed);
`;

const ScanFormSection = styled.section`
  padding: var(--spacing-2xl) 0;
  background-color: var(--color-surface-primary);
  margin-top: -2rem;
  border-radius: var(--border-radius-2xl) var(--border-radius-2xl) 0 0;
`;

const ScanFormContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  
  @media (min-width: 768px) {
    padding: 0 var(--spacing-lg);
  }
`;

const ScanForm = styled.form`
  background-color: var(--color-surface-elevated);
  padding: var(--spacing-2xl);
  border-radius: var(--border-radius-2xl);
  box-shadow: var(--shadow-2xl);
  border: 1px solid var(--color-border-primary);
`;

const FormTitle = styled.h2`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-xl);
  color: var(--color-text-primary);
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: var(--spacing-lg);
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: var(--spacing-sm);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
`;

const FormInput = styled.input`
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  font-family: var(--font-family-secondary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background-color: var(--color-surface-primary);
  border: 2px solid var(--color-border-primary);
  border-radius: var(--border-radius-lg);
  transition: all var(--transition-fast);
  
  &:focus {
    outline: none;
    border-color: var(--color-interactive-primary);
    background-color: var(--color-surface-elevated);
    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
  }
  
  &::placeholder {
    color: var(--color-text-tertiary);
  }
`;

const ScanButton = styled.button`
  width: 100%;
  padding: var(--spacing-lg) var(--spacing-xl);
  background-color: var(--color-interactive-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--border-radius-lg);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  
  &:hover:not(:disabled) {
    background-color: var(--color-interactive-primary-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const FormDisclaimer = styled.p`
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  text-align: center;
  margin-top: var(--spacing-md);
  line-height: var(--line-height-relaxed);
`;

const HowItWorksSection = styled.section`
  padding: var(--spacing-4xl) 0;
  background-color: var(--color-surface-secondary);
`;

const HowItWorksContainer = styled.div`
  max-width: 75%;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  
  @media (min-width: 768px) {
    padding: 0 var(--spacing-lg);
  }
  
  @media (min-width: 1200px) {
    padding: 0 var(--spacing-xl);
  }
`;

const SectionTitle = styled.h2`
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-2xl);
  color: var(--color-text-primary);
  text-align: center;
`;

const StepsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-2xl);
  margin-top: var(--spacing-2xl);
`;

const StepCard = styled.div`
  text-align: center;
  padding: var(--spacing-lg);
  background-color: var(--color-surface-elevated);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-primary);
  transition: all var(--transition-fast);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
`;

const StepNumber = styled.div`
  width: 3.5rem;
  height: 3.5rem;
  background-color: var(--color-interactive-primary);
  color: var(--color-text-inverse);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  margin: 0 auto var(--spacing-lg) auto;
  box-shadow: var(--shadow-sm);
`;

const StepTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
`;

const StepDescription = styled.p`
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
`;

const BenefitsSection = styled.section`
  padding: var(--spacing-4xl) 0;
`;

const BenefitsContainer = styled.div`
  max-width: 75%;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  
  @media (min-width: 768px) {
    padding: 0 var(--spacing-lg);
  }
  
  @media (min-width: 1200px) {
    padding: 0 var(--spacing-xl);
  }
`;

const BenefitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-2xl);
  margin-top: var(--spacing-2xl);
`;

const BenefitCard = styled.div`
  background-color: var(--color-surface-elevated);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-primary);
  text-align: center;
  transition: all var(--transition-fast);
  
  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }
`;

const BenefitIcon = styled.div`
  width: 4.5rem;
  height: 4.5rem;
  background-color: var(--color-success);
  color: var(--color-text-inverse);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  margin: 0 auto var(--spacing-lg) auto;
  box-shadow: var(--shadow-sm);
`;

const BenefitTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
`;

const BenefitDescription = styled.p`
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
`;

const WarningSection = styled.section`
  padding: var(--spacing-4xl) 0;
  background: linear-gradient(135deg, var(--color-warning-light) 0%, var(--color-warning-lighter) 100%);
  border-left: 4px solid var(--color-warning);
`;

const WarningContainer = styled.div`
  max-width: 75%;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-xl);
  
  @media (min-width: 768px) {
    padding: 0 var(--spacing-lg);
  }
  
  @media (min-width: 1200px) {
    padding: 0 var(--spacing-xl);
  }
  
  @media (max-width: 640px) {
    flex-direction: column;
    gap: var(--spacing-lg);
  }
`;

const WarningIcon = styled.div`
  width: 3.5rem;
  height: 3.5rem;
  background-color: var(--color-warning);
  color: var(--color-text-inverse);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
`;

const WarningContent = styled.div`
  flex: 1;
`;

const WarningTitle = styled.h3`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
`;

const WarningText = styled.p`
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-md);
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const CTASection = styled.section`
  padding: var(--spacing-4xl) 0;
  background: linear-gradient(135deg, var(--color-interactive-primary) 0%, var(--color-interactive-primary-hover) 100%);
  color: var(--color-text-inverse);
  text-align: center;
`;

const CTAContainer = styled.div`
  max-width: 75%;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  
  @media (min-width: 768px) {
    padding: 0 var(--spacing-lg);
  }
  
  @media (min-width: 1200px) {
    padding: 0 var(--spacing-xl);
  }
`;

const CTATitle = styled.h2`
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-xl);
  color: var(--color-text-inverse);
`;

const CTAButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) var(--spacing-xl);
  background-color: var(--color-surface-elevated);
  color: var(--color-interactive-primary);
  text-decoration: none;
  border-radius: var(--border-radius-lg);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-md);
  
  &:hover {
    background-color: var(--color-surface-primary);
    color: var(--color-interactive-primary);
    text-decoration: none;
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
`;

const FreeAuditPage = () => {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsScanning(true);
    
    // Simulate scanning process
    setTimeout(() => {
      setIsScanning(false);
      // In real implementation, would redirect to results or show results inline
      console.log('Scanning complete for:', url);
    }, 3000);
  };

  return (
    <AuditContainer>
      <HeroSection>
        <HeroContent>
          <HeroTitle>Instant Website Accessibility Check</HeroTitle>
          <HeroSubtitle>
            Discover your website's accessibility strengths and weaknesses in seconds. No commitment, just insights.
          </HeroSubtitle>
        </HeroContent>
      </HeroSection>

      <ScanFormSection>
        <ScanFormContainer>
          <ScanForm onSubmit={handleSubmit}>
            <FormTitle>Enter Your Website URL</FormTitle>
            <FormGroup>
              <FormLabel htmlFor="website-url">Website URL</FormLabel>
              <FormInput
                type="url"
                id="website-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.yourbusiness.com"
                required
                disabled={isScanning}
              />
            </FormGroup>
            <ScanButton type="submit" disabled={isScanning}>
              {isScanning ? (
                <>
                  <div className="spinner" />
                  Scanning Your Website...
                </>
              ) : (
                <>
                  <FaRocket />
                  Scan My Website Now
                </>
              )}
            </ScanButton>
            <FormDisclaimer>
              This is an automated, high-level scan. A detailed report is available as a paid service.
            </FormDisclaimer>
          </ScanForm>
        </ScanFormContainer>
      </ScanFormSection>

      <HowItWorksSection>
        <HowItWorksContainer>
          <SectionTitle>How It Works</SectionTitle>
          <StepsContainer>
            <StepCard>
              <StepNumber>1</StepNumber>
              <StepTitle>Enter Your URL</StepTitle>
              <StepDescription>
                Simply paste your website URL into the form above.
              </StepDescription>
            </StepCard>
            
            <StepCard>
              <StepNumber>2</StepNumber>
              <StepTitle>Our AI Scans Your Site</StepTitle>
              <StepDescription>
                Our advanced AI analyzes your website for accessibility issues.
              </StepDescription>
            </StepCard>
            
            <StepCard>
              <StepNumber>3</StepNumber>
              <StepTitle>Get Instant Feedback</StepTitle>
              <StepDescription>
                Receive immediate insights about your website's accessibility.
              </StepDescription>
            </StepCard>
          </StepsContainer>
        </HowItWorksContainer>
      </HowItWorksSection>

      <BenefitsSection>
        <BenefitsContainer>
          <SectionTitle>Benefits of an Accessible Website</SectionTitle>
          <BenefitsGrid>
            <BenefitCard>
              <BenefitIcon>
                <FaShieldAlt />
              </BenefitIcon>
              <BenefitTitle>Legal Protection</BenefitTitle>
              <BenefitDescription>
                Protect your business from ADA lawsuits and compliance issues.
              </BenefitDescription>
            </BenefitCard>
            
            <BenefitCard>
              <BenefitIcon>
                <FaUsers />
              </BenefitIcon>
              <BenefitTitle>Wider Audience</BenefitTitle>
              <BenefitDescription>
                Reach 15% more potential customers by making your site accessible.
              </BenefitDescription>
            </BenefitCard>
            
            <BenefitCard>
              <BenefitIcon>
                <FaChartLine />
              </BenefitIcon>
              <BenefitTitle>Better SEO</BenefitTitle>
              <BenefitDescription>
                Accessible websites often rank higher in search engine results.
              </BenefitDescription>
            </BenefitCard>
            
            <BenefitCard>
              <BenefitIcon>
                <FaCheck />
              </BenefitIcon>
              <BenefitTitle>Improved UX</BenefitTitle>
              <BenefitDescription>
                Better user experience for all visitors, not just those with disabilities.
              </BenefitDescription>
            </BenefitCard>
          </BenefitsGrid>
        </BenefitsContainer>
      </BenefitsSection>

      <WarningSection>
        <WarningContainer>
          <WarningIcon>
            <FaExclamationTriangle />
          </WarningIcon>
          <WarningContent>
            <WarningTitle>Do you know if you are at risk of being sued for lack of ADA compliance?</WarningTitle>
            <WarningText>
              The average cost of an accessibility lawsuit is $25,000…but you can protect yourself for less than a dollar per day in just a few minutes.
            </WarningText>
            <WarningText>
              <strong>Let us run a FREE ACCESSIBILITY SCAN on your website to see if you need to protect yourself today!</strong>
            </WarningText>
          </WarningContent>
        </WarningContainer>
      </WarningSection>

      <CTASection>
        <CTAContainer>
          <CTATitle>Want a Deeper Dive?</CTATitle>
          <CTAButton to="/pricing">
            Get Your Detailed Accessibility Report
          </CTAButton>
        </CTAContainer>
      </CTASection>
    </AuditContainer>
  );
};

export default FreeAuditPage;