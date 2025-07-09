import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaSearch, FaUsers, FaChartLine, FaBullhorn, FaArrowRight, FaCheckCircle, FaLightbulb, FaRocket } from 'react-icons/fa';

const SeoContainer = styled.div`
  min-height: 100vh;
  background-color: var(--color-bg-primary);
`;

const HeroSection = styled.section`
  padding: var(--spacing-2xl) 0 var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-success) 0%, var(--color-primary) 100%);
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
  border-left: 4px solid var(--color-warning);
  text-align: center;
`;

const ProblemIcon = styled.div`
  width: 3rem;
  height: 3rem;
  background-color: var(--color-warning);
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
    border: 2px solid var(--color-success);
    transform: translateY(-8px);
    
    &::before {
      content: 'Most Popular';
      position: absolute;
      top: -0.5rem;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--color-success);
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
  background-color: var(--color-success);
  color: var(--color-white);
  text-decoration: none;
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
  width: 100%;
  justify-content: center;
  
  &:hover {
    background-color: var(--color-success-dark);
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
  background-color: var(--color-success-dark);
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
    color: var(--color-success);
    
    &:hover {
      background-color: var(--color-bg-secondary);
      color: var(--color-success);
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
      color: var(--color-success);
      text-decoration: none;
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }
  }
`;

const SeoContentServicePage = () => {
  return (
    <SeoContainer>
      <HeroSection>
        <HeroContent>
          <HeroTitle>Boost Your Online Visibility & Drive More Traffic</HeroTitle>
          <HeroSubtitle>
            Our AI-powered SEO and content strategies help small businesses rank higher in search results and attract more qualified customers.
          </HeroSubtitle>
          <HeroCTA to="/free-audit">
            Get Your Free SEO Analysis <FaArrowRight />
          </HeroCTA>
        </HeroContent>
      </HeroSection>

      <ProblemSection>
        <ProblemContainer>
          <SectionTitle>Why Your Business Isn't Being Found Online</SectionTitle>
          <ProblemGrid>
            <ProblemCard>
              <ProblemIcon>
                <FaSearch />
              </ProblemIcon>
              <ProblemTitle>Invisible in Search Results</ProblemTitle>
              <ProblemDescription>
                Your competitors are ranking on page 1 while your business is buried on page 5+, missing out on 95% of potential customers.
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
          <CTATitle>Ready to Dominate Your Local Market?</CTATitle>
          <CTAButtons>
            <CTAButton to="/free-audit" className="primary">
              Start Your Free SEO Analysis <FaArrowRight />
            </CTAButton>
            <CTAButton to="/contact" className="secondary">
              Discuss Your SEO Strategy <FaArrowRight />
            </CTAButton>
          </CTAButtons>
        </CTAContainer>
      </CTASection>
    </SeoContainer>
  );
};

export default SeoContentServicePage;