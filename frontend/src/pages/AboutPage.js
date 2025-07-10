import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaRocket, FaUsers, FaLightbulb, FaHeart, FaArrowRight } from 'react-icons/fa';

const AboutContainer = styled.div`
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

const StorySection = styled.section`
  padding: var(--spacing-4xl) 0;
`;

const StoryContainer = styled.div`
  max-width: 75%;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: var(--spacing-4xl);
  align-items: center;
  
  @media (min-width: 768px) {
    padding: 0 var(--spacing-lg);
  }
  
  @media (min-width: 1200px) {
    padding: 0 var(--spacing-xl);
    gap: var(--spacing-5xl);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: var(--spacing-2xl);
    max-width: 90%;
  }
`;

const StoryContent = styled.div`
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -2rem;
    width: 4px;
    height: 60px;
    background: var(--color-interactive-primary);
    border-radius: var(--border-radius-full);
    
    @media (max-width: 768px) {
      left: -1rem;
      height: 40px;
    }
  }
`;

const SectionTitle = styled.h2`
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-xl);
  color: var(--color-text-primary);
`;

const StoryText = styled.p`
  font-size: var(--font-size-lg);
  font-family: var(--font-family-secondary);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-lg);
  padding-left: var(--spacing-md);
  position: relative;
  
  &:first-of-type {
    margin-top: var(--spacing-md);
  }
  
  &:last-of-type {
    margin-bottom: 0;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -1rem;
      left: var(--spacing-md);
      width: 60px;
      height: 2px;
      background: linear-gradient(to right, var(--color-interactive-primary), transparent);
    }
  }
`;

const StoryImage = styled.div`
  background: linear-gradient(135deg, var(--color-interactive-primary) 0%, var(--color-interactive-primary-hover) 100%);
  border-radius: var(--border-radius-2xl);
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-on-brand);
  padding: var(--spacing-xl);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    pointer-events: none;
  }
  
  @media (max-width: 768px) {
    height: 300px;
    padding: var(--spacing-lg);
  }
`;

const StoryIconContainer = styled.div`
  font-size: var(--font-size-6xl);
  margin-bottom: var(--spacing-lg);
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-5xl);
    margin-bottom: var(--spacing-md);
  }
`;

const StoryImageTitle = styled.h3`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  text-align: center;
  margin-bottom: var(--spacing-md);
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-xl);
  }
`;

const StoryImageText = styled.p`
  font-size: var(--font-size-base);
  font-family: var(--font-family-secondary);
  text-align: center;
  opacity: 0.9;
  line-height: var(--line-height-relaxed);
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-sm);
  }
`;

const ValuesSection = styled.section`
  padding: var(--spacing-4xl) 0;
  background-color: var(--color-surface-secondary);
`;

const ValuesContainer = styled.div`
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

const ValuesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-xl);
  margin-top: var(--spacing-2xl);
`;

const ValueCard = styled.div`
  text-align: center;
  padding: var(--spacing-xl);
  background-color: var(--color-surface-elevated);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-primary);
  transition: all var(--transition-fast);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: var(--color-interactive-primary);
  }
`;

const ValueIcon = styled.div`
  width: 4rem;
  height: 4rem;
  background-color: var(--color-interactive-primary);
  color: var(--color-text-on-brand);
  border-radius: var(--border-radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xl);
  margin: 0 auto var(--spacing-lg) auto;
`;

const ValueTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
`;

const ValueDescription = styled.p`
  font-size: var(--font-size-base);
  font-family: var(--font-family-secondary);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
`;

const MissionSection = styled.section`
  padding: var(--spacing-4xl) 0;
`;

const MissionContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  text-align: center;
  
  @media (min-width: 768px) {
    padding: 0 var(--spacing-lg);
  }
  
  @media (min-width: 1200px) {
    padding: 0 var(--spacing-xl);
  }
`;

const MissionQuote = styled.blockquote`
  font-size: var(--font-size-2xl);
  font-style: italic;
  font-family: var(--font-family-secondary);
  color: var(--color-text-primary);
  line-height: var(--line-height-relaxed);
  margin: var(--spacing-xl) 0;
  position: relative;
  
  &::before {
    content: '"';
    position: absolute;
    top: -1rem;
    left: -1rem;
    font-size: var(--font-size-6xl);
    color: var(--color-interactive-primary);
    font-family: serif;
  }
`;

const StatsSection = styled.section`
  padding: var(--spacing-4xl) 0;
  background-color: var(--color-interactive-primary);
  color: var(--color-text-on-brand);
`;

const StatsContainer = styled.div`
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-xl);
  text-align: center;
`;

const StatCard = styled.div`
  padding: var(--spacing-lg);
`;

const StatNumber = styled.div`
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-extrabold);
  font-family: var(--font-family-primary);
  color: var(--color-text-on-brand);
  margin-bottom: var(--spacing-sm);
`;

const StatLabel = styled.div`
  font-size: var(--font-size-lg);
  font-family: var(--font-family-secondary);
  color: var(--color-text-on-brand);
  opacity: 0.9;
`;

const TeamSection = styled.section`
  padding: var(--spacing-4xl) 0;
`;

const TeamContainer = styled.div`
  max-width: 75%;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  text-align: center;
  
  @media (min-width: 768px) {
    padding: 0 var(--spacing-lg);
  }
  
  @media (min-width: 1200px) {
    padding: 0 var(--spacing-xl);
  }
`;

const TeamText = styled.p`
  font-size: var(--font-size-lg);
  font-family: var(--font-family-secondary);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  max-width: var(--content-max-width);
  margin: 0 auto var(--spacing-xl) auto;
`;

const CTASection = styled.section`
  padding: var(--spacing-4xl) 0;
  background-color: var(--color-surface-secondary);
  text-align: center;
`;

const CTAContainer = styled.div`
  max-width: 600px;
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
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
`;

const CTAText = styled.p`
  font-size: var(--font-size-lg);
  font-family: var(--font-family-secondary);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-2xl);
  line-height: var(--line-height-relaxed);
`;

const CTAButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  background-color: var(--color-interactive-primary);
  color: var(--color-text-on-brand);
  text-decoration: none;
  border-radius: var(--border-radius-lg);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
  
  &:hover {
    background-color: var(--color-interactive-primary-hover);
    color: var(--color-text-on-brand);
    text-decoration: none;
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
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
            <StoryIconContainer>
              <FaRocket />
            </StoryIconContainer>
            <StoryImageTitle>Innovation & Growth</StoryImageTitle>
            <StoryImageText>
              Empowering small businesses to reach new heights through accessible web solutions and cutting-edge technology.
            </StoryImageText>
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
          <SectionTitle style={{ color: 'var(--color-text-on-brand)', textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
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