import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaCheck, FaTimes, FaStar, FaArrowRight, FaPhoneAlt } from 'react-icons/fa';

const PricingContainer = styled.div`
  min-height: 100vh;
  background-color: var(--color-bg-primary);
`;

const HeroSection = styled.section`
  padding: var(--spacing-2xl) 0 var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
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

const PricingSection = styled.section`
  padding: var(--spacing-2xl) 0;
`;

const PricingContent = styled.div`
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

const ServiceCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
`;

const ServiceCard = styled.div`
  background-color: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border: 2px solid var(--color-gray-border);
  transition: all var(--transition-fast);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
  
  &.featured {
    border-color: var(--color-primary);
    position: relative;
    
    &::before {
      content: 'Most Popular';
      position: absolute;
      top: -0.75rem;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--color-primary);
      color: var(--color-white);
      padding: 0.5rem 1.5rem;
      border-radius: var(--border-radius-full);
      font-size: var(--font-size-small);
      font-weight: var(--font-weight-bold);
    }
  }
`;

const ServiceHeader = styled.div`
  text-align: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-gray-border);
`;

const ServiceIcon = styled.div`
  width: 4rem;
  height: 4rem;
  background-color: ${props => props.color || 'var(--color-primary)'};
  color: var(--color-white);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin: 0 auto var(--spacing-md) auto;
`;

const ServiceTitle = styled.h3`
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
`;

const ServiceDescription = styled.p`
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
  line-height: var(--line-height-relaxed);
`;

const TierContainer = styled.div`
  margin-bottom: var(--spacing-lg);
`;

const TierHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
`;

const TierTitle = styled.h4`
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
`;

const TierPrice = styled.div`
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
`;

const TierFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin-bottom: var(--spacing-md);
`;

const TierFeature = styled.li`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) 0;
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
`;

const FeatureIcon = styled.div`
  color: ${props => props.included ? 'var(--color-success)' : 'var(--color-text-muted)'};
  flex-shrink: 0;
`;

const ServiceCTA = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 0.75rem 1.5rem;
  background-color: ${props => props.color || 'var(--color-primary)'};
  color: var(--color-white);
  text-decoration: none;
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
  width: 100%;
  justify-content: center;
  
  &:hover {
    background-color: ${props => props.hoverColor || 'var(--color-primary-hover)'};
    color: var(--color-white);
    text-decoration: none;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
`;

const ContactSection = styled.section`
  padding: var(--spacing-xl) 0;
  background-color: var(--color-bg-secondary);
  text-align: center;
`;

const ContactContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 0 var(--container-padding);
`;

const ContactTitle = styled.h2`
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
`;

const ContactText = styled.p`
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
  line-height: var(--line-height-relaxed);
`;

const ContactButtons = styled.div`
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
`;

const ContactButton = styled(Link)`
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
    background-color: var(--color-primary);
    color: var(--color-white);
    
    &:hover {
      background-color: var(--color-primary-hover);
      color: var(--color-white);
      text-decoration: none;
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }
  }
  
  &.secondary {
    background-color: var(--color-white);
    color: var(--color-primary);
    border: 2px solid var(--color-primary);
    
    &:hover {
      background-color: var(--color-primary);
      color: var(--color-white);
      text-decoration: none;
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
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
            <ServiceCard className="featured">
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
                <ServiceIcon color="var(--color-primary)">
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
              
              <ServiceCTA to="/services/website-overhaul" color="var(--color-primary)">
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