import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaPalette, FaMobile, FaTachometerAlt, FaArrowRight, FaCheckCircle, FaRocket, FaShieldAlt } from 'react-icons/fa';

const OverhaulContainer = styled.div`
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
  background-color: var(--color-primary);
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