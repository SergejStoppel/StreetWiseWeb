import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaAccessibleIcon, FaSearch, FaPaintBrush, FaRocket, FaArrowRight, FaMobile } from 'react-icons/fa';

const ServicesContainer = styled.div`
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

const TierSection = styled.section`
  padding: var(--spacing-4xl) 0;
`;

const TierContainer = styled.div`
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

const TierHeader = styled.div`
  text-align: center;
  margin-bottom: var(--spacing-2xl);
`;

const TierTitle = styled.h2`
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
`;

const TierDescription = styled.p`
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  max-width: var(--content-max-width);
  margin: 0 auto;
  line-height: var(--line-height-relaxed);
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: var(--spacing-2xl);
  margin-top: var(--spacing-2xl);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: var(--spacing-xl);
  }
`;

const ServiceCard = styled.div`
  background-color: var(--color-surface-elevated);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
  border: 1px solid var(--color-border-primary);
  
  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-4px);
  }
`;

const ServiceIcon = styled.div`
  width: 4.5rem;
  height: 4.5rem;
  background-color: var(--color-interactive-primary);
  color: var(--color-text-inverse);
  border-radius: var(--border-radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
`;

const ServiceTitle = styled.h3`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
`;

const ServiceDescription = styled.p`
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-lg);
`;

const ServiceFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin-bottom: var(--spacing-xl);
`;

const ServiceFeature = styled.li`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  
  &::before {
    content: '✓';
    color: var(--color-success);
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-lg);
  }
`;

const ServiceLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-interactive-primary);
  color: var(--color-text-inverse);
  text-decoration: none;
  border-radius: var(--border-radius-lg);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
  
  &:hover {
    background-color: var(--color-interactive-primary-hover);
    color: var(--color-text-inverse);
    text-decoration: none;
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
`;

const CTASection = styled.section`
  padding: var(--spacing-4xl) 0;
  background-color: var(--color-surface-secondary);
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
  color: var(--color-text-primary);
`;

const CTAButtons = styled.div`
  display: flex;
  gap: var(--spacing-lg);
  justify-content: center;
  flex-wrap: wrap;
`;

const CTAButton = styled(Link)`
  padding: var(--spacing-lg) var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  
  &.primary {
    background-color: var(--color-interactive-primary);
    color: var(--color-text-inverse);
    
    &:hover {
      background-color: var(--color-interactive-primary-hover);
      color: var(--color-text-inverse);
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
      color: var(--color-text-inverse);
      text-decoration: none;
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
  }
`;

const ServicesPage = () => {
  return (
    <ServicesContainer>
      <HeroSection>
        <HeroContent>
          <HeroTitle>Professional Website Services That Actually Help Your Business</HeroTitle>
          <HeroSubtitle>
            We make your website work for you with simple, effective solutions that attract more customers, protect you from legal risks, and keep you competitive in today's AI-driven world.
          </HeroSubtitle>
        </HeroContent>
      </HeroSection>

      <TierSection>
        <TierContainer>
          <TierHeader>
            <TierTitle>Our Core Services</TierTitle>
            <TierDescription>
              Everything your small business needs to succeed online. We handle the technical complexity so you can focus on what you do best - running your business.
            </TierDescription>
          </TierHeader>
          
          <ServicesGrid>
            <ServiceCard>
              <ServiceIcon>
                <FaAccessibleIcon />
              </ServiceIcon>
              <ServiceTitle>Website Accessibility & Legal Protection</ServiceTitle>
              <ServiceDescription>
                Is your website open for business to everyone, including people with disabilities? We ensure your site meets legal requirements and serves all customers.
              </ServiceDescription>
              <ServiceFeatures>
                <ServiceFeature>WCAG 2.1 compliance analysis</ServiceFeature>
                <ServiceFeature>ADA lawsuit protection</ServiceFeature>
                <ServiceFeature>Simple, actionable fix recommendations</ServiceFeature>
                <ServiceFeature>Professional compliance reports</ServiceFeature>
              </ServiceFeatures>
              <ServiceLink to="/services/accessibility">
                Learn More <FaArrowRight />
              </ServiceLink>
            </ServiceCard>

            <ServiceCard>
              <ServiceIcon>
                <FaSearch />
              </ServiceIcon>
              <ServiceTitle>SEO & AI Discoverability</ServiceTitle>
              <ServiceDescription>
                How easy is it for customers to find you on Google and AI assistants? With AI traffic growing 1,300%+ in 2024, we optimize for both traditional search and AI discovery.
              </ServiceDescription>
              <ServiceFeatures>
                <ServiceFeature>Google search optimization</ServiceFeature>
                <ServiceFeature>ChatGPT & Perplexity optimization</ServiceFeature>
                <ServiceFeature>Local SEO enhancement</ServiceFeature>
                <ServiceFeature>AI-friendly content strategy</ServiceFeature>
              </ServiceFeatures>
              <ServiceLink to="/services/seo-content">
                Learn More <FaArrowRight />
              </ServiceLink>
            </ServiceCard>

            <ServiceCard>
              <ServiceIcon>
                <FaMobile />
              </ServiceIcon>
              <ServiceTitle>Website Health & Performance</ServiceTitle>
              <ServiceDescription>
                Is your site fast, secure, and easy to use on all devices? We check everything from loading speed to mobile-friendliness to ensure your website delivers a great user experience.
              </ServiceDescription>
              <ServiceFeatures>
                <ServiceFeature>Page speed optimization</ServiceFeature>
                <ServiceFeature>Mobile responsiveness check</ServiceFeature>
                <ServiceFeature>Security vulnerability scan</ServiceFeature>
                <ServiceFeature>User experience analysis</ServiceFeature>
              </ServiceFeatures>
              <ServiceLink to="/services/website-overhaul">
                Learn More <FaArrowRight />
              </ServiceLink>
            </ServiceCard>
          </ServicesGrid>
        </TierContainer>
      </TierSection>

      <CTASection>
        <CTAContainer>
          <CTATitle>Ready to See How Your Website Can Work Better?</CTATitle>
          <CTAButtons>
            <CTAButton to="/free-audit" className="primary">
              Get Your Free Website Analysis <FaArrowRight />
            </CTAButton>
            <CTAButton to="/contact" className="secondary">
              Talk to Our Team <FaArrowRight />
            </CTAButton>
          </CTAButtons>
        </CTAContainer>
      </CTASection>
    </ServicesContainer>
  );
};

export default ServicesPage;