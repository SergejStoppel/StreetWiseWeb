import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaRocket, FaUsers, FaLightbulb, FaHeart, FaArrowRight } from 'react-icons/fa';

const AboutContainer = styled.div`
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

const StorySection = styled.section`
  padding: var(--spacing-2xl) 0;
`;

const StoryContainer = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2xl);
  align-items: center;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
`;

const StoryContent = styled.div``;

const SectionTitle = styled.h2`
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
`;

const StoryText = styled.p`
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-md);
`;

const StoryImage = styled.div`
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-secondary-light) 100%);
  border-radius: var(--border-radius-lg);
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  color: var(--color-primary);
  
  @media (max-width: 768px) {
    height: 300px;
  }
`;

const ValuesSection = styled.section`
  padding: var(--spacing-2xl) 0;
  background-color: var(--color-bg-secondary);
`;

const ValuesContainer = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
`;

const ValuesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-xl);
  margin-top: var(--spacing-lg);
`;

const ValueCard = styled.div`
  text-align: center;
  padding: var(--spacing-lg);
  background-color: var(--color-white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
  }
`;

const ValueIcon = styled.div`
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

const ValueTitle = styled.h3`
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
`;

const ValueDescription = styled.p`
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
`;

const MissionSection = styled.section`
  padding: var(--spacing-2xl) 0;
`;

const MissionContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--container-padding);
  text-align: center;
`;

const MissionQuote = styled.blockquote`
  font-size: var(--font-size-h3);
  font-style: italic;
  color: var(--color-text-primary);
  line-height: var(--line-height-relaxed);
  margin: var(--spacing-lg) 0;
  position: relative;
  
  &::before {
    content: '"';
    position: absolute;
    top: -1rem;
    left: -1rem;
    font-size: 4rem;
    color: var(--color-primary);
    font-family: serif;
  }
`;

const StatsSection = styled.section`
  padding: var(--spacing-2xl) 0;
  background-color: var(--color-primary-dark);
  color: var(--color-white);
`;

const StatsContainer = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  text-align: center;
`;

const StatCard = styled.div`
  padding: var(--spacing-md);
`;

const StatNumber = styled.div`
  font-size: 3rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-white);
  margin-bottom: var(--spacing-xs);
`;

const StatLabel = styled.div`
  font-size: var(--font-size-body);
  color: var(--color-white);
  opacity: 0.9;
`;

const TeamSection = styled.section`
  padding: var(--spacing-2xl) 0;
`;

const TeamContainer = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
  text-align: center;
`;

const TeamText = styled.p`
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  max-width: 600px;
  margin: 0 auto var(--spacing-lg) auto;
`;

const CTASection = styled.section`
  padding: var(--spacing-2xl) 0;
  background-color: var(--color-bg-secondary);
  text-align: center;
`;

const CTAContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 0 var(--container-padding);
`;

const CTATitle = styled.h2`
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
`;

const CTAText = styled.p`
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
  line-height: var(--line-height-relaxed);
`;

const CTAButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 1rem 2rem;
  background-color: var(--color-primary);
  color: var(--color-white);
  text-decoration: none;
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-primary);
  transition: all var(--transition-fast);
  
  &:hover {
    background-color: var(--color-primary-hover);
    color: var(--color-white);
    text-decoration: none;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
`;

const AboutPage = () => {
  return (
    <AboutContainer>
      <HeroSection>
        <HeroContent>
          <HeroTitle>Making Professional Web Presence Accessible to All</HeroTitle>
          <HeroSubtitle>
            We believe every small business deserves a website that works for everyone, ranks well, and drives growth.
          </HeroSubtitle>
        </HeroContent>
      </HeroSection>

      <StorySection>
        <StoryContainer>
          <StoryContent>
            <SectionTitle>Our Story</SectionTitle>
            <StoryText>
              SiteCraft was born from a simple observation: small businesses were being left behind in the digital revolution. 
              While large corporations had teams of developers and specialists, small business owners were struggling with 
              outdated websites that didn't work on mobile, couldn't be found in search results, and excluded customers with disabilities.
            </StoryText>
            <StoryText>
              We set out to level the playing field by creating AI-powered tools and services that make professional 
              web development accessible and affordable for every small business owner.
            </StoryText>
          </StoryContent>
          <StoryImage>
            <FaRocket />
          </StoryImage>
        </StoryContainer>
      </StorySection>

      <ValuesSection>
        <ValuesContainer>
          <SectionTitle style={{ textAlign: 'center' }}>Our Values</SectionTitle>
          <ValuesGrid>
            <ValueCard>
              <ValueIcon>
                <FaUsers />
              </ValueIcon>
              <ValueTitle>Accessibility First</ValueTitle>
              <ValueDescription>
                We believe the web should be inclusive. Every website we touch becomes more accessible, 
                opening doors for users with disabilities and protecting businesses from legal risks.
              </ValueDescription>
            </ValueCard>
            
            <ValueCard>
              <ValueIcon>
                <FaLightbulb />
              </ValueIcon>
              <ValueTitle>Innovation & Simplicity</ValueTitle>
              <ValueDescription>
                We harness cutting-edge AI technology to solve complex problems, but we present solutions 
                in simple, actionable ways that any business owner can understand.
              </ValueDescription>
            </ValueCard>
            
            <ValueCard>
              <ValueIcon>
                <FaHeart />
              </ValueIcon>
              <ValueTitle>Small Business Focus</ValueTitle>
              <ValueDescription>
                We're dedicated exclusively to small businesses. We understand your challenges, 
                your budget constraints, and your need for results that directly impact your bottom line.
              </ValueDescription>
            </ValueCard>
            
            <ValueCard>
              <ValueIcon>
                <FaRocket />
              </ValueIcon>
              <ValueTitle>Results-Driven</ValueTitle>
              <ValueDescription>
                Every service we offer is designed to drive real business outcomes: more traffic, 
                better conversions, legal protection, and sustainable growth.
              </ValueDescription>
            </ValueCard>
          </ValuesGrid>
        </ValuesContainer>
      </ValuesSection>

      <MissionSection>
        <MissionContainer>
          <SectionTitle>Our Mission</SectionTitle>
          <MissionQuote>
            To democratize professional web presence by making world-class accessibility, SEO, and design 
            services available to every small business, regardless of technical expertise or budget.
          </MissionQuote>
        </MissionContainer>
      </MissionSection>

      <StatsSection>
        <StatsContainer>
          <SectionTitle style={{ color: 'var(--color-white)', textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
            Our Impact So Far
          </SectionTitle>
          <StatsGrid>
            <StatCard>
              <StatNumber>500+</StatNumber>
              <StatLabel>Websites Analyzed</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>150+</StatNumber>
              <StatLabel>Businesses Protected</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>2M+</StatNumber>
              <StatLabel>Accessibility Issues Fixed</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>98%</StatNumber>
              <StatLabel>Client Satisfaction Rate</StatLabel>
            </StatCard>
          </StatsGrid>
        </StatsContainer>
      </StatsSection>

      <TeamSection>
        <TeamContainer>
          <SectionTitle>Our Team</SectionTitle>
          <TeamText>
            Our team combines decades of experience in web development, digital marketing, and accessibility compliance. 
            We're developers, designers, SEO specialists, and accessibility experts who are passionate about helping 
            small businesses thrive online.
          </TeamText>
          <TeamText>
            What sets us apart is our commitment to staying on the cutting edge of technology while never losing sight 
            of the human element - understanding that behind every website is a business owner with dreams, goals, and customers to serve.
          </TeamText>
        </TeamContainer>
      </TeamSection>

      <CTASection>
        <CTAContainer>
          <CTATitle>Ready to Transform Your Online Presence?</CTATitle>
          <CTAText>
            Join hundreds of small businesses that have already discovered the power of accessible, 
            SEO-optimized, and professionally designed websites.
          </CTAText>
          <CTAButton to="/free-audit">
            Start Your Free Analysis <FaArrowRight />
          </CTAButton>
        </CTAContainer>
      </CTASection>
    </AboutContainer>
  );
};

export default AboutPage;