import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaSearch, FaUsers, FaChartLine, FaBullhorn, FaArrowRight, FaCheckCircle, FaLightbulb, FaRocket } from 'react-icons/fa';

const SeoContainer = styled.div`
  min-height: 100vh;
  background-color: var(--color-surface-primary);
`;

const HeroSection = styled.section`
  padding: var(--spacing-4xl) 0 var(--spacing-3xl);
  background: linear-gradient(135deg, var(--color-success) 0%, var(--color-info) 100%);
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
  color: var(--color-success);
  text-decoration: none;
  border-radius: var(--border-radius-lg);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-lg);
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-lg);
  
  &:hover {
    background-color: var(--color-surface-secondary);
    color: var(--color-success);
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
  border-left: 4px solid var(--color-info);
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
    background: linear-gradient(135deg, transparent 0%, rgba(23, 162, 184, 0.03) 100%);
    pointer-events: none;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-left-color: var(--color-info-hover);
  }
`;

const ProblemIcon = styled.div`
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, var(--color-info) 0%, var(--color-info-hover) 100%);
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
  background-color: var(--color-success);
  color: var(--color-text-inverse);
  text-decoration: none;
  border-radius: var(--border-radius-lg);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-normal);
  width: 100%;
  justify-content: center;
  margin-top: auto;
  
  &:hover {
    background-color: var(--color-success-hover);
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
  background: linear-gradient(135deg, var(--color-success) 0%, var(--color-success-hover) 100%);
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
    color: var(--color-success);
    
    &:hover {
      background-color: var(--color-surface-secondary);
      color: var(--color-success);
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
      color: var(--color-success);
      text-decoration: none;
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
  }
`;

const SeoContentServicePage = () => {
  return (
    <SeoContainer>
      <HeroSection>
        <HeroContent>
          <HeroTitle>Get Found by Tomorrow's Customers Today</HeroTitle>
          <HeroSubtitle>
            How easy is it for customers to find you on Google and AI assistants like ChatGPT? With AI traffic growing 1,300%+ in 2024, we optimize for both traditional search and the next generation of discovery.
          </HeroSubtitle>
          <HeroCTA to="/free-audit">
            Get Your Free SEO & AI Analysis <FaArrowRight />
          </HeroCTA>
        </HeroContent>
      </HeroSection>

      <ProblemSection>
        <ProblemContainer>
          <SectionTitle>Are You Reaching the Right Customers?</SectionTitle>
          <ProblemGrid>
            <ProblemCard>
              <ProblemIcon>
                <FaSearch />
              </ProblemIcon>
              <ProblemTitle>Invisible to Google & AI Search</ProblemTitle>
              <ProblemDescription>
                If your website isn't optimized for search engines like Google AND AI assistants like ChatGPT, you're invisible to potential customers looking for your products or services.
              </ProblemDescription>
            </ProblemCard>
            
            <ProblemCard>
              <ProblemIcon>
                <FaBullhorn />
              </ProblemIcon>
              <ProblemTitle>Inconsistent Content Strategy</ProblemTitle>
              <ProblemDescription>
                Sporadic blog posts and outdated content that doesn't engage your audience or establish your expertise in your field.
              </ProblemDescription>
            </ProblemCard>
            
            <ProblemCard>
              <ProblemIcon>
                <FaUsers />
              </ProblemIcon>
              <ProblemTitle>Wrong Audience Targeting</ProblemTitle>
              <ProblemDescription>
                Attracting visitors who aren't interested in your services, leading to high bounce rates and low conversion rates.
              </ProblemDescription>
            </ProblemCard>
          </ProblemGrid>
        </ProblemContainer>
      </ProblemSection>

      <SolutionSection>
        <SolutionContainer>
          <SectionTitle>Your Path to Online Dominance</SectionTitle>
          <TierCards>
            <TierCard>
              <TierHeader>
                <TierTitle>Tier 1: AI-Powered SEO Audit</TierTitle>
                <TierSubtitle>No Website Access Required</TierSubtitle>
              </TierHeader>
              <TierFeatures>
                <TierFeature>
                  <FeatureIcon />
                  <span>Comprehensive keyword analysis</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Competitor research and gap analysis</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Technical SEO health check</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Content optimization recommendations</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Local SEO assessment</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Monthly progress tracking</span>
                </TierFeature>
              </TierFeatures>
              <TierCTA to="/pricing">
                Get Your SEO Report <FaArrowRight />
              </TierCTA>
            </TierCard>
            
            <TierCard className="featured">
              <TierHeader>
                <TierTitle>Tier 2: Full SEO & Content Implementation</TierTitle>
                <TierSubtitle>Website Access Required</TierSubtitle>
              </TierHeader>
              <TierFeatures>
                <TierFeature>
                  <FeatureIcon />
                  <span>On-page SEO optimization</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Technical SEO implementation</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Content strategy development</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Blog content creation (4-8 posts/month)</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Local business optimization</span>
                </TierFeature>
                <TierFeature>
                  <FeatureIcon />
                  <span>Monthly performance reporting</span>
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
          <SectionTitle>The Business Impact of Strong SEO</SectionTitle>
          <BenefitsGrid>
            <BenefitCard>
              <BenefitIcon>
                <FaChartLine />
              </BenefitIcon>
              <BenefitTitle>Increased Website Traffic</BenefitTitle>
              <BenefitDescription>
                Drive 300-500% more organic traffic to your website within 6-12 months with targeted SEO strategies.
              </BenefitDescription>
            </BenefitCard>
            
            <BenefitCard>
              <BenefitIcon>
                <FaUsers />
              </BenefitIcon>
              <BenefitTitle>Better Lead Quality</BenefitTitle>
              <BenefitDescription>
                Attract customers who are actively searching for your services, leading to higher conversion rates.
              </BenefitDescription>
            </BenefitCard>
            
            <BenefitCard>
              <BenefitIcon>
                <FaLightbulb />
              </BenefitIcon>
              <BenefitTitle>Thought Leadership</BenefitTitle>
              <BenefitDescription>
                Establish your business as an industry expert through consistent, valuable content that builds trust.
              </BenefitDescription>
            </BenefitCard>
            
            <BenefitCard>
              <BenefitIcon>
                <FaRocket />
              </BenefitIcon>
              <BenefitTitle>Long-term Growth</BenefitTitle>
              <BenefitDescription>
                Build sustainable online presence that continues generating leads and revenue for years to come.
              </BenefitDescription>
            </BenefitCard>
          </BenefitsGrid>
        </BenefitsContainer>
      </BenefitsSection>

      <CTASection>
        <CTAContainer>
          <CTATitle>Ready to Get Found by More Customers?</CTATitle>
          <CTAButtons>
            <CTAButton to="/free-audit" className="primary">
              Get Your Free SEO & AI Analysis <FaArrowRight />
            </CTAButton>
            <CTAButton to="/contact" className="secondary">
              Talk to Our SEO Team <FaArrowRight />
            </CTAButton>
          </CTAButtons>
        </CTAContainer>
      </CTASection>
    </SeoContainer>
  );
};

export default SeoContentServicePage;