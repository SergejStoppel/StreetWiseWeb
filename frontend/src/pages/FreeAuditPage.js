import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaRocket, FaShieldAlt, FaUsers, FaChartLine, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const AuditContainer = styled.div`
  min-height: 100vh;
  background-color: var(--color-bg-primary);
`;

const HeroSection = styled.section`
  padding: var(--spacing-2xl) 0;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-white);
  text-align: center;
`;

const HeroContent = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
`;

const HeroTitle = styled.h1`
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-white);
`;

const HeroSubtitle = styled.p`
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-regular);
  margin-bottom: var(--spacing-lg);
  color: var(--color-white);
  opacity: 0.9;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
`;

const ScanFormSection = styled.section`
  padding: var(--spacing-xl) 0;
  background-color: var(--color-white);
  margin-top: -2rem;
  border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
`;

const ScanFormContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 0 var(--container-padding);
`;

const ScanForm = styled.form`
  background-color: var(--color-white);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--color-gray-border);
`;

const FormTitle = styled.h2`
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: var(--spacing-md);
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

const ScanButton = styled.button`
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

const FormDisclaimer = styled.p`
  font-size: var(--font-size-small);
  color: var(--color-text-muted);
  text-align: center;
  margin-top: var(--spacing-sm);
  line-height: var(--line-height-relaxed);
`;

const HowItWorksSection = styled.section`
  padding: var(--spacing-xl) 0;
  background-color: var(--color-bg-secondary);
`;

const HowItWorksContainer = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
`;

const SectionTitle = styled.h2`
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
  text-align: center;
`;

const StepsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
`;

const StepCard = styled.div`
  text-align: center;
  padding: var(--spacing-md);
`;

const StepNumber = styled.div`
  width: 3rem;
  height: 3rem;
  background-color: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-bold);
  margin: 0 auto var(--spacing-md) auto;
`;

const StepTitle = styled.h3`
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
`;

const StepDescription = styled.p`
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
`;

const BenefitsSection = styled.section`
  padding: var(--spacing-xl) 0;
`;

const BenefitsContainer = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
`;

const BenefitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
`;

const BenefitCard = styled.div`
  background-color: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  text-align: center;
  transition: all var(--transition-normal);
  
  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
`;

const BenefitIcon = styled.div`
  width: 4rem;
  height: 4rem;
  background-color: var(--color-success);
  color: var(--color-white);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin: 0 auto var(--spacing-md) auto;
`;

const BenefitTitle = styled.h3`
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
`;

const BenefitDescription = styled.p`
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
`;

const WarningSection = styled.section`
  padding: var(--spacing-xl) 0;
  background-color: var(--color-warning-light);
  border-left: 4px solid var(--color-warning);
`;

const WarningContainer = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
`;

const WarningIcon = styled.div`
  width: 3rem;
  height: 3rem;
  background-color: var(--color-warning);
  color: var(--color-white);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
`;

const WarningContent = styled.div`
  flex: 1;
`;

const WarningTitle = styled.h3`
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
`;

const WarningText = styled.p`
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-sm);
`;

const CTASection = styled.section`
  padding: var(--spacing-xl) 0;
  background-color: var(--color-primary-dark);
  color: var(--color-white);
  text-align: center;
`;

const CTAContainer = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
`;

const CTATitle = styled.h2`
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-md);
  color: var(--color-white);
`;

const CTAButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 1rem 2rem;
  background-color: var(--color-white);
  color: var(--color-primary);
  text-decoration: none;
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-primary);
  transition: all var(--transition-fast);
  
  &:hover {
    background-color: var(--color-bg-secondary);
    color: var(--color-primary);
    text-decoration: none;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
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