import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaAccessibleIcon, FaSearch, FaPaintBrush, FaRocket, FaArrowRight } from 'react-icons/fa';

const ServicesContainer = styled.div`
  min-height: 100vh;
  background-color: var(--color-bg-primary);
`;

const HeroSection = styled.section`
  padding: var(--spacing-2xl) 0 var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
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

const TierSection = styled.section`
  padding: var(--spacing-2xl) 0;
`;

const TierContainer = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
`;

const TierHeader = styled.div`
  text-align: center;
  margin-bottom: var(--spacing-xl);
`;

const TierTitle = styled.h2`
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
`;

const TierDescription = styled.p`
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  max-width: 700px;
  margin: 0 auto;
  line-height: var(--line-height-relaxed);
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
`;

const ServiceCard = styled.div`
  background-color: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
  border: 1px solid var(--color-gray-border);
  
  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-4px);
  }
`;

const ServiceIcon = styled.div`
  width: 4rem;
  height: 4rem;
  background-color: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: var(--spacing-md);
`;

const ServiceTitle = styled.h3`
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
`;

const ServiceDescription = styled.p`
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-md);
`;

const ServiceFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin-bottom: var(--spacing-md);
`;

const ServiceFeature = styled.li`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) 0;
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  
  &::before {
    content: '✓';
    color: var(--color-success);
    font-weight: var(--font-weight-bold);
  }
`;

const ServiceLink = styled(Link)`
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
  
  &:hover {
    background-color: var(--color-primary-hover);
    color: var(--color-white);
    text-decoration: none;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
`;

const CTASection = styled.section`
  padding: var(--spacing-2xl) 0;
  background-color: var(--color-bg-secondary);
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
  color: var(--color-text-primary);
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

const ServicesPage = () => {
  return (
    <ServicesContainer>
      <HeroSection>
        <HeroContent>
          <HeroTitle>Comprehensive Online Solutions for Every Small Business Need</HeroTitle>
          <HeroSubtitle>
            From initial assessments to full-scale implementation, our tiered services provide flexible and powerful ways to enhance your digital presence.
          </HeroSubtitle>
        </HeroContent>
      </HeroSection>

      <TierSection>
        <TierContainer>
          <TierHeader>
            <TierTitle>Tier 1: Immediate Insights & Content Generation</TierTitle>
            <TierDescription>
              Quick value, low commitment, ideal for initial assessment and content support. These services provide actionable insights without needing access to your website backend.
            </TierDescription>
          </TierHeader>
          
          <ServicesGrid>
            <ServiceCard>
              <ServiceIcon>
                <FaAccessibleIcon />
              </ServiceIcon>
              <ServiceTitle>AI-Powered Accessibility & Compliance Assessment</ServiceTitle>
              <ServiceDescription>
                Identify critical accessibility issues and get actionable recommendations to mitigate legal risks and ensure ADA/WCAG compliance.
              </ServiceDescription>
              <ServiceFeatures>
                <ServiceFeature>Automated WCAG compliance scanning</ServiceFeature>
                <ServiceFeature>AI-generated fix suggestions</ServiceFeature>
                <ServiceFeature>Legal risk assessment</ServiceFeature>
                <ServiceFeature>Detailed compliance reports</ServiceFeature>
              </ServiceFeatures>
              <ServiceLink to="/services/accessibility">
                Learn More <FaArrowRight />
              </ServiceLink>
            </ServiceCard>

            <ServiceCard>
              <ServiceIcon>
                <FaSearch />
              </ServiceIcon>
              <ServiceTitle>AI-Driven SEO & Content Idea Generation</ServiceTitle>
              <ServiceDescription>
                Boost your online visibility with tailored content ideas that attract local customers and improve search rankings.
              </ServiceDescription>
              <ServiceFeatures>
                <ServiceFeature>Keyword research & trend analysis</ServiceFeature>
                <ServiceFeature>Competitor content gap analysis</ServiceFeature>
                <ServiceFeature>AI-powered content briefs</ServiceFeature>
                <ServiceFeature>Local SEO optimization</ServiceFeature>
              </ServiceFeatures>
              <ServiceLink to="/services/seo-content">
                Learn More <FaArrowRight />
              </ServiceLink>
            </ServiceCard>

            <ServiceCard>
              <ServiceIcon>
                <FaPaintBrush />
              </ServiceIcon>
              <ServiceTitle>Automated Website Mockups & Design Suggestions</ServiceTitle>
              <ServiceDescription>
                Visualize your website's potential with stunning, AI-generated redesign mockups that showcase modern design principles.
              </ServiceDescription>
              <ServiceFeatures>
                <ServiceFeature>AI-powered design analysis</ServiceFeature>
                <ServiceFeature>Modern template application</ServiceFeature>
                <ServiceFeature>Content optimization for mockups</ServiceFeature>
                <ServiceFeature>Before/after comparisons</ServiceFeature>
              </ServiceFeatures>
              <ServiceLink to="/services/website-overhaul">
                Learn More <FaArrowRight />
              </ServiceLink>
            </ServiceCard>
          </ServicesGrid>
        </TierContainer>
      </TierSection>

      <TierSection style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <TierContainer>
          <TierHeader>
            <TierTitle>Tier 2: Full Implementation & Ongoing Management</TierTitle>
            <TierDescription>
              Comprehensive solutions, hands-off management, and deep optimization. These services provide direct implementation and continuous improvement for maximum impact.
            </TierDescription>
          </TierHeader>
          
          <ServicesGrid>
            <ServiceCard>
              <ServiceIcon>
                <FaRocket />
              </ServiceIcon>
              <ServiceTitle>Full Website Overhaul & Technical SEO Implementation</ServiceTitle>
              <ServiceDescription>
                Transform your website into a high-performing, secure, and search-engine-friendly asset with ongoing maintenance and optimization.
              </ServiceDescription>
              <ServiceFeatures>
                <ServiceFeature>Complete website redesign</ServiceFeature>
                <ServiceFeature>Technical SEO implementation</ServiceFeature>
                <ServiceFeature>Performance optimization</ServiceFeature>
                <ServiceFeature>Security & hosting management</ServiceFeature>
              </ServiceFeatures>
              <ServiceLink to="/services/website-overhaul">
                Learn More <FaArrowRight />
              </ServiceLink>
            </ServiceCard>

            <ServiceCard>
              <ServiceIcon>
                <FaSearch />
              </ServiceIcon>
              <ServiceTitle>Advanced On-Page SEO & Content Optimization</ServiceTitle>
              <ServiceDescription>
                Achieve top search rankings and engage your audience with expertly optimized content directly implemented on your site.
              </ServiceDescription>
              <ServiceFeatures>
                <ServiceFeature>Direct content optimization</ServiceFeature>
                <ServiceFeature>Strategic keyword integration</ServiceFeature>
                <ServiceFeature>Schema markup implementation</ServiceFeature>
                <ServiceFeature>E-E-A-T signal enhancement</ServiceFeature>
              </ServiceFeatures>
              <ServiceLink to="/services/seo-content">
                Learn More <FaArrowRight />
              </ServiceLink>
            </ServiceCard>
          </ServicesGrid>
        </TierContainer>
      </TierSection>

      <CTASection>
        <CTAContainer>
          <CTATitle>Ready to Elevate Your Online Presence?</CTATitle>
          <CTAButtons>
            <CTAButton to="/pricing" className="primary">
              View Our Pricing Plans <FaArrowRight />
            </CTAButton>
            <CTAButton to="/contact" className="secondary">
              Contact Us for a Custom Solution <FaArrowRight />
            </CTAButton>
          </CTAButtons>
        </CTAContainer>
      </CTASection>
    </ServicesContainer>
  );
};

export default ServicesPage;