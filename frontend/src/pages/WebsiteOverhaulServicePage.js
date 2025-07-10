import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaPalette, FaMobile, FaTachometerAlt, FaArrowRight, FaCheckCircle, FaRocket, FaShieldAlt } from 'react-icons/fa';

const OverhaulContainer = styled.div`
  min-height: 100vh;
  background-color: var(--color-surface-primary);
`;

const HeroSection = styled.section`
  padding: var(--spacing-4xl) 0 var(--spacing-3xl);
  background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%);
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
  color: #6f42c1;
  text-decoration: none;
  border-radius: var(--border-radius-lg);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-lg);
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-lg);
  
  &:hover {
    background-color: var(--color-surface-secondary);
    color: #6f42c1;
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
  border-left: 4px solid #e83e8c;
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
    background: linear-gradient(135deg, transparent 0%, rgba(232, 62, 140, 0.03) 100%);
    pointer-events: none;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-left-color: #d91a72;
  }
`;

const ProblemIcon = styled.div`
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, #e83e8c 0%, #d91a72 100%);
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
  background-color: #6f42c1;
  color: var(--color-text-inverse);
  text-decoration: none;
  border-radius: var(--border-radius-lg);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-normal);
  width: 100%;
  justify-content: center;
  margin-top: auto;
  
  &:hover {
    background-color: #5a359a;
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
  background-color: #6f42c1;
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
  background: linear-gradient(135deg, #6f42c1 0%, #5a359a 100%);
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
    color: #6f42c1;
    
    &:hover {
      background-color: var(--color-surface-secondary);
      color: #6f42c1;
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
      color: #6f42c1;
      text-decoration: none;
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
  }
`;

const WebsiteOverhaulServicePage = () => {
  return (
    <OverhaulContainer>
      <HeroSection>
        <HeroContent>
          <HeroTitle>Transform Your Website Into a Lead Generation Machine</HeroTitle>
          <HeroSubtitle>
            Modern design, lightning-fast performance, and mobile optimization that converts visitors into customers and drives business growth.
          </HeroSubtitle>
          <HeroCTA to="/free-audit">
            Get Your Free Website Analysis <FaArrowRight />
          </HeroCTA>
        </HeroContent>
      </HeroSection>

      <ProblemSection>
        <ProblemContainer>
          <SectionTitle>Is Your Website Hurting Your Business?</SectionTitle>
          <ProblemGrid>
            <ProblemCard>
              <ProblemIcon>
                <FaPalette />
              </ProblemIcon>
              <ProblemTitle>Outdated Design</ProblemTitle>
              <ProblemDescription>
                Your website looks like it's from 2010, making your business appear unprofessional and driving potential customers away.
              </ProblemDescription>
            </ProblemCard>
            
            <ProblemCard>
              <ProblemIcon>
                <FaTachometerAlt />
              </ProblemIcon>
              <ProblemTitle>Slow Loading Times</ProblemTitle>
              <ProblemDescription>
                Pages take forever to load, causing visitors to leave before they even see what you offer, hurting both user experience and SEO.
              </ProblemDescription>
            </ProblemCard>
            
            <ProblemCard>
              <ProblemIcon>
                <FaMobile />
              </ProblemIcon>
              <ProblemTitle>Poor Mobile Experience</ProblemTitle>
              <ProblemDescription>
                Your site looks broken on phones and tablets, losing 60%+ of potential customers who browse on mobile devices.
              </ProblemDescription>
            </ProblemCard>
          </ProblemGrid>
        </ProblemContainer>
      </ProblemSection>

      <SolutionSection>
        <SolutionContainer>
          <SectionTitle>Your Complete Website Transformation</SectionTitle>
          <TierCards>
            <TierCard>
              <TierHeader>
                <TierTitle>Tier 1: Design & Performance Audit</TierTitle>
                <TierSubtitle>No Website Access Required</TierSubtitle>
              </TierHeader>
              <TierFeatures>
                <TierFeature>
                  <FeatureIcon />
                  <span>Complete design assessment</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Performance and speed analysis</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Mobile responsiveness evaluation</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>User experience review</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Conversion optimization recommendations</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Detailed improvement roadmap</span>
                </TierFeature>
              </TierFeatures>
              <TierCTA to="/pricing">
                Get Your Website Analysis <FaArrowRight />
              </TierCTA>
            </TierCard>
            
            <TierCard className="featured">
              <TierHeader>
                <TierTitle>Tier 2: Complete Website Overhaul</TierTitle>
                <TierSubtitle>Full Development & Implementation</TierSubtitle>
              </TierHeader>
              <TierFeatures>
                <TierFeature>
                  <FeatureIcon />
                  <span>Modern, responsive design</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Performance optimization (90+ speed score)</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Mobile-first development</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>SEO-optimized structure</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Conversion-focused layout</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Content management system</span>
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
          <SectionTitle>The Impact of a Professional Website</SectionTitle>
          <BenefitsGrid>
            <BenefitCard>
              <BenefitIcon>
                <FaRocket />
              </BenefitIcon>
              <BenefitTitle>Increased Conversions</BenefitTitle>
              <BenefitDescription>
                Professional design and optimized user experience can increase conversion rates by 200-400%.
              </BenefitDescription>
            </BenefitCard>
            
            <BenefitCard>
              <BenefitIcon>
                <FaMobile />
              </BenefitIcon>
              <BenefitTitle>Mobile-First Experience</BenefitTitle>
              <BenefitDescription>
                Reach the 60% of users browsing on mobile with a flawless, fast-loading mobile experience.
              </BenefitDescription>
            </BenefitCard>
            
            <BenefitCard>
              <BenefitIcon>
                <FaTachometerAlt />
              </BenefitIcon>
              <BenefitTitle>Lightning Fast Performance</BenefitTitle>
              <BenefitDescription>
                Improve page load times by 50-70%, reducing bounce rates and improving search engine rankings.
              </BenefitDescription>
            </BenefitCard>
            
            <BenefitCard>
              <BenefitIcon>
                <FaShieldAlt />
              </BenefitIcon>
              <BenefitTitle>Professional Credibility</BenefitTitle>
              <BenefitDescription>
                Build trust with a modern, professional design that makes your business stand out from competitors.
              </BenefitDescription>
            </BenefitCard>
          </BenefitsGrid>
        </BenefitsContainer>
      </BenefitsSection>

      <CTASection>
        <CTAContainer>
          <CTATitle>Ready to Transform Your Online Presence?</CTATitle>
          <CTAButtons>
            <CTAButton to="/free-audit" className="primary">
              Start Your Free Website Analysis <FaArrowRight />
            </CTAButton>
            <CTAButton to="/contact" className="secondary">
              Discuss Your Project Requirements <FaArrowRight />
            </CTAButton>
          </CTAButtons>
        </CTAContainer>
      </CTASection>
    </OverhaulContainer>
  );
};

export default WebsiteOverhaulServicePage;