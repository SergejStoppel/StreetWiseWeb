import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaShieldAlt, FaUsers, FaGavel, FaChartLine, FaArrowRight, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const AccessibilityContainer = styled.div`
  min-height: 100vh;
  background-color: var(--color-bg-primary);
`;

const HeroSection = styled.section`
  padding: var(--spacing-2xl) 0 var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-error) 0%, var(--color-warning) 100%);
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
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const HeroCTA = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 1rem 2rem;
  background-color: var(--color-white);
  color: var(--color-primary);
  text-decoration: none;
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-body);
  transition: all var(--transition-fast);
  
  &:hover {
    background-color: var(--color-bg-secondary);
    color: var(--color-primary);
    text-decoration: none;
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
`;

const ProblemSection = styled.section`
  padding: var(--spacing-2xl) 0;
`;

const ProblemContainer = styled.div`
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

const ProblemGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
`;

const ProblemCard = styled.div`
  background-color: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border-left: 4px solid var(--color-error);
  text-align: center;
`;

const ProblemIcon = styled.div`
  width: 3rem;
  height: 3rem;
  background-color: var(--color-error);
  color: var(--color-white);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin: 0 auto var(--spacing-md) auto;
`;

const ProblemTitle = styled.h3`
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
`;

const ProblemDescription = styled.p`
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
`;

const SolutionSection = styled.section`
  padding: var(--spacing-2xl) 0;
  background-color: var(--color-bg-secondary);
`;

const SolutionContainer = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
`;

const TierCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--spacing-xl);
  margin-top: var(--spacing-lg);
`;

const TierCard = styled.div`
  background-color: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  position: relative;
  
  &.featured {
    border: 2px solid var(--color-primary);
    transform: translateY(-8px);
    
    &::before {
      content: 'Most Popular';
      position: absolute;
      top: -0.5rem;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--color-primary);
      color: var(--color-white);
      padding: 0.25rem 1rem;
      border-radius: var(--border-radius-full);
      font-size: var(--font-size-small);
      font-weight: var(--font-weight-medium);
    }
  }
`;

const TierHeader = styled.div`
  text-align: center;
  margin-bottom: var(--spacing-lg);
`;

const TierTitle = styled.h3`
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
`;

const TierSubtitle = styled.p`
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
`;

const TierFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin-bottom: var(--spacing-lg);
`;

const TierFeature = styled.li`
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
`;

const FeatureIcon = styled(FaCheckCircle)`
  color: var(--color-success);
  margin-top: 0.125rem;
  flex-shrink: 0;
`;

const TierCTA = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  color: var(--color-white);
  text-decoration: none;
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
  width: 100%;
  justify-content: center;
  
  &:hover {
    background-color: var(--color-primary-hover);
    color: var(--color-white);
    text-decoration: none;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
`;

const BenefitsSection = styled.section`
  padding: var(--spacing-2xl) 0;
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
`;

const BenefitCard = styled.div`
  text-align: center;
  padding: var(--spacing-md);
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

const CTASection = styled.section`
  padding: var(--spacing-2xl) 0;
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

const CTAButtons = styled.div`
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
`;

const CTAButton = styled(Link)`
  padding: 1rem 2rem;
  border-radius: var(--border-radius-md);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  font-family: var(--font-primary);
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  
  &.primary {
    background-color: var(--color-white);
    color: var(--color-primary);
    
    &:hover {
      background-color: var(--color-bg-secondary);
      color: var(--color-primary);
      text-decoration: none;
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }
  }
  
  &.secondary {
    background-color: transparent;
    color: var(--color-white);
    border: 2px solid var(--color-white);
    
    &:hover {
      background-color: var(--color-white);
      color: var(--color-primary);
      text-decoration: none;
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
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