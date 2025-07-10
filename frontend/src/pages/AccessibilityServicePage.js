import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaShieldAlt, FaUsers, FaGavel, FaChartLine, FaArrowRight, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const AccessibilityContainer = styled.div`
  min-height: 100vh;
  background-color: var(--color-surface-primary);
`;

const HeroSection = styled.section`
  padding: var(--spacing-4xl) 0 var(--spacing-3xl);
  background: linear-gradient(135deg, var(--color-interactive-primary) 0%, var(--color-info) 100%);
  color: var(--color-text-inverse);
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
  }
`;

const HeroContent = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
  position: relative;
  z-index: 1;
`;

const HeroTitle = styled.h1`
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-inverse);
  line-height: var(--line-height-tight);
`;

const HeroSubtitle = styled.p`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-regular);
  margin-bottom: var(--spacing-2xl);
  color: var(--color-text-inverse);
  opacity: 0.95;
  max-width: 75%;
  margin-left: auto;
  margin-right: auto;
  line-height: var(--line-height-relaxed);
`;

const HeroCTA = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  background-color: var(--color-text-inverse);
  color: var(--color-interactive-primary);
  text-decoration: none;
  border-radius: var(--border-radius-lg);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-lg);
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-lg);
  
  &:hover {
    background-color: var(--color-surface-secondary);
    color: var(--color-interactive-primary);
    text-decoration: none;
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
  }
`;

const ProblemSection = styled.section`
  padding: var(--spacing-4xl) 0;
`;

const ProblemContainer = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
`;

const SectionTitle = styled.h2`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-2xl);
  color: var(--color-text-primary);
  text-align: center;
  line-height: var(--line-height-tight);
`;

const ProblemGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--spacing-xl);
`;

const ProblemCard = styled.div`
  background-color: var(--color-surface-elevated);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border-left: 4px solid var(--color-warning);
  text-align: center;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, transparent 0%, rgba(255, 193, 7, 0.03) 100%);
    pointer-events: none;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-left-color: var(--color-warning-hover);
  }
`;

const ProblemIcon = styled.div`
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, var(--color-warning) 0%, var(--color-warning-hover) 100%);
  color: var(--color-text-inverse);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xl);
  margin: 0 auto var(--spacing-lg) auto;
  box-shadow: var(--shadow-sm);
  position: relative;
  z-index: 1;
`;

const ProblemTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
`;

const ProblemDescription = styled.p`
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
`;

const SolutionSection = styled.section`
  padding: var(--spacing-4xl) 0;
  background-color: var(--color-surface-secondary);
`;

const SolutionContainer = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
`;

const TierCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: var(--spacing-2xl);
  margin-top: var(--spacing-2xl);
  align-items: stretch;
`;

const TierCard = styled.div`
  background-color: var(--color-surface-elevated);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  position: relative;
  transition: all var(--transition-normal);
  display: flex;
  flex-direction: column;
  height: 100%;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
  
  &.featured {
    /* No special styling for featured card */
  }
`;

const TierHeader = styled.div`
  text-align: center;
  margin-bottom: var(--spacing-xl);
`;

const TierTitle = styled.h3`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
`;

const TierSubtitle = styled.p`
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
`;

const TierFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin-bottom: var(--spacing-xl);
  flex-grow: 1;
`;

const TierFeature = styled.li`
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  min-height: 2.5rem;
`;

const FeatureIcon = styled(FaCheckCircle)`
  color: var(--color-success);
  margin-top: 0.125rem;
  flex-shrink: 0;
`;

const TierCTA = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-interactive-primary);
  color: var(--color-text-inverse);
  text-decoration: none;
  border-radius: var(--border-radius-lg);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-normal);
  width: 100%;
  justify-content: center;
  margin-top: auto;
  
  &:hover {
    background-color: var(--color-interactive-primary-hover);
    color: var(--color-text-inverse);
    text-decoration: none;
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
`;

const BenefitsSection = styled.section`
  padding: var(--spacing-4xl) 0;
`;

const BenefitsContainer = styled.div`
  max-width: 75%;
  margin: 0 auto;
  padding: 0 var(--container-padding);
`;

const BenefitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-xl);
`;

const BenefitCard = styled.div`
  text-align: center;
  padding: var(--spacing-lg);
  background-color: var(--color-surface-elevated);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
`;

const BenefitIcon = styled.div`
  width: 4rem;
  height: 4rem;
  background-color: var(--color-success);
  color: var(--color-text-inverse);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xl);
  margin: 0 auto var(--spacing-lg) auto;
`;

const BenefitTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
`;

const BenefitDescription = styled.p`
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
`;

const CTASection = styled.section`
  padding: var(--spacing-4xl) 0;
  background: linear-gradient(135deg, var(--color-interactive-primary) 0%, var(--color-interactive-primary-active) 100%);
  color: var(--color-text-inverse);
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
  }
`;

const CTAContainer = styled.div`
  max-width: 75%;
  margin: 0 auto;
  padding: 0 var(--container-padding);
  position: relative;
  z-index: 1;
`;

const CTATitle = styled.h2`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-xl);
  color: var(--color-text-inverse);
  line-height: var(--line-height-tight);
`;

const CTAButtons = styled.div`
  display: flex;
  gap: var(--spacing-lg);
  justify-content: center;
  flex-wrap: wrap;
`;

const CTAButton = styled(Link)`
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-lg);
  transition: all var(--transition-normal);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  
  &.primary {
    background-color: var(--color-text-inverse);
    color: var(--color-interactive-primary);
    
    &:hover {
      background-color: var(--color-surface-secondary);
      color: var(--color-interactive-primary);
      text-decoration: none;
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
  }
  
  &.secondary {
    background-color: transparent;
    color: var(--color-text-inverse);
    border: 2px solid var(--color-text-inverse);
    
    &:hover {
      background-color: var(--color-text-inverse);
      color: var(--color-interactive-primary);
      text-decoration: none;
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
  }
`;

const AccessibilityServicePage = () => {
  return (
    <AccessibilityContainer>
      <HeroSection>
        <HeroContent>
          <HeroTitle>Avoid Legal Risks & Reach More Customers</HeroTitle>
          <HeroSubtitle>
            Our AI-powered tools and expert services help small businesses achieve and maintain ADA and WCAG compliance, protecting you from lawsuits and expanding your audience.
          </HeroSubtitle>
          <HeroCTA to="/free-audit">
            Get Your Free Accessibility Scan <FaArrowRight />
          </HeroCTA>
        </HeroContent>
      </HeroSection>

      <ProblemSection>
        <ProblemContainer>
          <SectionTitle>The Hidden Dangers of Inaccessible Websites</SectionTitle>
          <ProblemGrid>
            <ProblemCard>
              <ProblemIcon>
                <FaGavel />
              </ProblemIcon>
              <ProblemTitle>Legal Exposure</ProblemTitle>
              <ProblemDescription>
                Rising number of ADA lawsuits against small businesses with inaccessible websites. Legal costs can exceed $25,000 per lawsuit.
              </ProblemDescription>
            </ProblemCard>
            
            <ProblemCard>
              <ProblemIcon>
                <FaUsers />
              </ProblemIcon>
              <ProblemTitle>Exclusion of Customers</ProblemTitle>
              <ProblemDescription>
                Losing out on 15% of the population (people with disabilities) - a significant market segment worth billions in spending power.
              </ProblemDescription>
            </ProblemCard>
            
            <ProblemCard>
              <ProblemIcon>
                <FaExclamationTriangle />
              </ProblemIcon>
              <ProblemTitle>Reputational Damage</ProblemTitle>
              <ProblemDescription>
                Negative perception and social media backlash from having an inaccessible website that excludes disabled users.
              </ProblemDescription>
            </ProblemCard>
          </ProblemGrid>
        </ProblemContainer>
      </ProblemSection>

      <SolutionSection>
        <SolutionContainer>
          <SectionTitle>Your Path to a Fully Accessible Website</SectionTitle>
          <TierCards>
            <TierCard>
              <TierHeader>
                <TierTitle>Tier 1: AI-Powered Assessment</TierTitle>
                <TierSubtitle>No Code Access Required</TierSubtitle>
              </TierHeader>
              <TierFeatures>
                <TierFeature>
                  <FeatureIcon />
                  <span>Automated WCAG compliance scans</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Immediate feedback on critical issues</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Detailed PDF reports with violations</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>AI-suggested fixes (alt-text, contrast)</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Legal risk assessment</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Compliance roadmap</span>
                </TierFeature>
              </TierFeatures>
              <TierCTA to="/pricing">
                Get Your Detailed Report <FaArrowRight />
              </TierCTA>
            </TierCard>
            
            <TierCard className="featured">
              <TierHeader>
                <TierTitle>Tier 2: Expert Remediation</TierTitle>
                <TierSubtitle>Code Access Required</TierSubtitle>
              </TierHeader>
              <TierFeatures>
                <TierFeature>
                  <FeatureIcon />
                  <span>Direct code implementation of fixes</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Semantic HTML and ARIA attributes</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Keyboard navigation optimization</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Form accessibility improvements</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Color contrast corrections</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Guaranteed compliance certification</span>
                </TierFeature>
              </TierFeatures>
              <TierCTA to="/contact">
                Request Custom Quote <FaArrowRight />
              </TierCTA>
            </TierCard>
          </TierCards>
        </SolutionContainer>
      </SolutionSection>

      <BenefitsSection>
        <BenefitsContainer>
          <SectionTitle>Beyond Compliance: The Business Benefits of Accessibility</SectionTitle>
          <BenefitsGrid>
            <BenefitCard>
              <BenefitIcon>
                <FaUsers />
              </BenefitIcon>
              <BenefitTitle>Expanded Market Reach</BenefitTitle>
              <BenefitDescription>
                Access to a larger customer base, including the 15% of people with disabilities and their families.
              </BenefitDescription>
            </BenefitCard>
            
            <BenefitCard>
              <BenefitIcon>
                <FaChartLine />
              </BenefitIcon>
              <BenefitTitle>Improved SEO</BenefitTitle>
              <BenefitDescription>
                Accessible websites often rank better in search engines due to better structure and user experience.
              </BenefitDescription>
            </BenefitCard>
            
            <BenefitCard>
              <BenefitIcon>
                <FaUsers />
              </BenefitIcon>
              <BenefitTitle>Enhanced User Experience</BenefitTitle>
              <BenefitDescription>
                Accessibility improvements benefit all users, not just those with disabilities, creating better usability.
              </BenefitDescription>
            </BenefitCard>
            
            <BenefitCard>
              <BenefitIcon>
                <FaShieldAlt />
              </BenefitIcon>
              <BenefitTitle>Positive Brand Image</BenefitTitle>
              <BenefitDescription>
                Demonstrates social responsibility and commitment to inclusivity, strengthening your brand reputation.
              </BenefitDescription>
            </BenefitCard>
          </BenefitsGrid>
        </BenefitsContainer>
      </BenefitsSection>

      <CTASection>
        <CTAContainer>
          <CTATitle>Ready to Make Your Website Accessible?</CTATitle>
          <CTAButtons>
            <CTAButton to="/free-audit" className="primary">
              Start Your Free Scan <FaArrowRight />
            </CTAButton>
            <CTAButton to="/contact" className="secondary">
              Contact Us to Discuss Your Needs <FaArrowRight />
            </CTAButton>
          </CTAButtons>
        </CTAContainer>
      </CTASection>
    </AccessibilityContainer>
  );
};

export default AccessibilityServicePage;