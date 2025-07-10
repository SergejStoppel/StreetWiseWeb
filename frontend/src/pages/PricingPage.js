import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaCheck, FaTimes, FaStar, FaArrowRight, FaPhoneAlt } from 'react-icons/fa';

const PricingContainer = styled.div`
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

const PricingSection = styled.section`
  padding: var(--spacing-4xl) 0;
`;

const PricingContent = styled.div`
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
  font-weight: var(--font-weight-extrabold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-3xl);
  color: var(--color-text-primary);
  text-align: center;
`;

const ServiceCards = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-4xl);
  align-items: start;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: var(--spacing-xl);
  }
  
  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-2xl);
  }
`;

const ServiceCard = styled.div`
  background-color: var(--color-surface-elevated);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border-primary);
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  height: 100%;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl);
    border-color: var(--color-interactive-primary);
  }
  
  &.featured {
    border-color: var(--color-interactive-primary);
    position: relative;
    background-color: var(--color-surface-elevated);
    
    &::before {
      content: 'Most Popular';
      position: absolute;
      top: -0.75rem;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--color-interactive-primary);
      color: var(--color-text-on-brand);
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: var(--border-radius-full);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      font-family: var(--font-family-primary);
    }
  }
`;

const ServiceHeader = styled.div`
  text-align: center;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-secondary);
`;

const ServiceIcon = styled.div`
  width: 4rem;
  height: 4rem;
  background-color: ${props => props.color || 'var(--color-interactive-primary)'};
  color: var(--color-text-on-brand);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xl);
  margin: 0 auto var(--spacing-lg) auto;
`;

const ServiceTitle = styled.h3`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
`;

const ServiceDescription = styled.p`
  font-size: var(--font-size-base);
  font-family: var(--font-family-secondary);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
  line-height: var(--line-height-relaxed);
  flex-grow: 0;
`;

const TierContainer = styled.div`
  margin-bottom: var(--spacing-xl);
  flex-grow: 1;
`;

const TierHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border-secondary);
`;

const TierTitle = styled.h4`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  color: var(--color-text-primary);
`;

const TierPrice = styled.div`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  color: var(--color-interactive-primary);
`;

const TierFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin-bottom: var(--spacing-lg);
  min-height: 140px;
`;

const TierFeature = styled.li`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  font-size: var(--font-size-base);
  font-family: var(--font-family-secondary);
  color: var(--color-text-secondary);
`;

const FeatureIcon = styled.div`
  color: ${props => props.included ? 'var(--color-success)' : 'var(--color-text-tertiary)'};
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ServiceCTA = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: ${props => props.color || 'var(--color-interactive-primary)'};
  color: var(--color-text-on-brand);
  text-decoration: none;
  border-radius: var(--border-radius-lg);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
  width: 100%;
  justify-content: center;
  margin-top: auto;
  
  &:hover {
    background-color: ${props => props.hoverColor || 'var(--color-interactive-primary-hover)'};
    color: var(--color-text-on-brand);
    text-decoration: none;
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
`;

const ContactSection = styled.section`
  padding: var(--spacing-4xl) 0;
  background-color: var(--color-surface-secondary);
  text-align: center;
`;

const ContactContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  
  @media (min-width: 768px) {
    padding: 0 var(--spacing-lg);
  }
  
  @media (min-width: 1200px) {
    padding: 0 var(--spacing-xl);
  }
`;

const ContactTitle = styled.h2`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
`;

const ContactText = styled.p`
  font-size: var(--font-size-lg);
  font-family: var(--font-family-secondary);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-2xl);
  line-height: var(--line-height-relaxed);
`;

const ContactButtons = styled.div`
  display: flex;
  gap: var(--spacing-lg);
  justify-content: center;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const ContactButton = styled(Link)`
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  
  &.primary {
    background-color: var(--color-interactive-primary);
    color: var(--color-text-on-brand);
    
    &:hover {
      background-color: var(--color-interactive-primary-hover);
      color: var(--color-text-on-brand);
      text-decoration: none;
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
  }
  
  &.secondary {
    background-color: var(--color-surface-elevated);
    color: var(--color-interactive-primary);
    border: 2px solid var(--color-interactive-primary);
    
    &:hover {
      background-color: var(--color-interactive-primary);
      color: var(--color-text-on-brand);
      text-decoration: none;
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
  }
`;

const PricingPage = () => {
  return (
    <PricingContainer>
      <HeroSection>
        <HeroContent>
          <HeroTitle>Simple, Transparent Pricing</HeroTitle>
          <HeroSubtitle>
            Choose the perfect plan for your business needs. No hidden fees, no long-term contracts.
          </HeroSubtitle>
        </HeroContent>
      </HeroSection>

      <PricingSection>
        <PricingContent>
          <SectionTitle>Our Services & Pricing</SectionTitle>
          
          <ServiceCards>
            {/* Accessibility Service */}
            <ServiceCard>
              <ServiceHeader>
                <ServiceIcon color="var(--color-error)">
                  <FaStar />
                </ServiceIcon>
                <ServiceTitle>Website Accessibility</ServiceTitle>
                <ServiceDescription>
                  Ensure your website complies with ADA and WCAG guidelines to avoid lawsuits and reach more customers.
                </ServiceDescription>
              </ServiceHeader>
              
              <TierContainer>
                <TierHeader>
                  <TierTitle>Tier 1: AI Assessment</TierTitle>
                  <TierPrice>$299</TierPrice>
                </TierHeader>
                <TierFeatures>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Automated WCAG compliance scan</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Detailed PDF report with violations</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>AI-suggested fixes</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Legal risk assessment</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon><FaTimes /></FeatureIcon>
                    <span>Code implementation</span>
                  </TierFeature>
                </TierFeatures>
              </TierContainer>
              
              <TierContainer>
                <TierHeader>
                  <TierTitle>Tier 2: Full Remediation</TierTitle>
                  <TierPrice>Custom Quote</TierPrice>
                </TierHeader>
                <TierFeatures>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Everything in Tier 1</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Direct code implementation</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Compliance certification</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Ongoing maintenance</span>
                  </TierFeature>
                </TierFeatures>
              </TierContainer>
              
              <ServiceCTA to="/services/accessibility" color="var(--color-error)">
                Learn More <FaArrowRight />
              </ServiceCTA>
            </ServiceCard>

            {/* SEO & Content Service */}
            <ServiceCard>
              <ServiceHeader>
                <ServiceIcon color="var(--color-success)">
                  <FaStar />
                </ServiceIcon>
                <ServiceTitle>SEO & Content</ServiceTitle>
                <ServiceDescription>
                  Boost your search rankings and drive more qualified traffic with our AI-powered SEO strategies.
                </ServiceDescription>
              </ServiceHeader>
              
              <TierContainer>
                <TierHeader>
                  <TierTitle>Tier 1: SEO Audit</TierTitle>
                  <TierPrice>$399</TierPrice>
                </TierHeader>
                <TierFeatures>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Comprehensive keyword analysis</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Competitor research</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Technical SEO assessment</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Content strategy roadmap</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon><FaTimes /></FeatureIcon>
                    <span>Content creation</span>
                  </TierFeature>
                </TierFeatures>
              </TierContainer>
              
              <TierContainer>
                <TierHeader>
                  <TierTitle>Tier 2: Full Implementation</TierTitle>
                  <TierPrice>$999/month</TierPrice>
                </TierHeader>
                <TierFeatures>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Everything in Tier 1</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>On-page SEO optimization</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>4-8 blog posts per month</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Monthly performance reports</span>
                  </TierFeature>
                </TierFeatures>
              </TierContainer>
              
              <ServiceCTA to="/services/seo-content" color="var(--color-success)">
                Learn More <FaArrowRight />
              </ServiceCTA>
            </ServiceCard>

            {/* Website Overhaul Service */}
            <ServiceCard>
              <ServiceHeader>
                <ServiceIcon color="var(--color-interactive-primary)">
                  <FaStar />
                </ServiceIcon>
                <ServiceTitle>Website Overhaul</ServiceTitle>
                <ServiceDescription>
                  Transform your website with modern design, fast performance, and mobile optimization.
                </ServiceDescription>
              </ServiceHeader>
              
              <TierContainer>
                <TierHeader>
                  <TierTitle>Tier 1: Design Audit</TierTitle>
                  <TierPrice>$199</TierPrice>
                </TierHeader>
                <TierFeatures>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Complete design assessment</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Performance analysis</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Mobile responsiveness review</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Improvement roadmap</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon><FaTimes /></FeatureIcon>
                    <span>Development work</span>
                  </TierFeature>
                </TierFeatures>
              </TierContainer>
              
              <TierContainer>
                <TierHeader>
                  <TierTitle>Tier 2: Complete Rebuild</TierTitle>
                  <TierPrice>Custom Quote</TierPrice>
                </TierHeader>
                <TierFeatures>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Everything in Tier 1</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Modern, responsive design</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Performance optimization</span>
                  </TierFeature>
                  <TierFeature>
                    <FeatureIcon included><FaCheck /></FeatureIcon>
                    <span>Content management system</span>
                  </TierFeature>
                </TierFeatures>
              </TierContainer>
              
              <ServiceCTA to="/services/website-overhaul" color="var(--color-interactive-primary)">
                Learn More <FaArrowRight />
              </ServiceCTA>
            </ServiceCard>
          </ServiceCards>
        </PricingContent>
      </PricingSection>

      <ContactSection>
        <ContactContainer>
          <ContactTitle>Need a Custom Solution?</ContactTitle>
          <ContactText>
            Every business is unique. If our standard packages don't fit your specific needs, 
            let's discuss a custom solution tailored to your requirements and budget.
          </ContactText>
          <ContactButtons>
            <ContactButton to="/contact" className="primary">
              Request Custom Quote <FaArrowRight />
            </ContactButton>
            <ContactButton to="/free-audit" className="secondary">
              Start with Free Audit <FaPhoneAlt />
            </ContactButton>
          </ContactButtons>
        </ContactContainer>
      </ContactSection>
    </PricingContainer>
  );
};

export default PricingPage;