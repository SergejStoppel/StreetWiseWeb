import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaArrowRight, FaCheckCircle, FaChartLine, FaShieldAlt } from 'react-icons/fa';

const CaseStudiesContainer = styled.div`
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

const CaseStudiesSection = styled.section`
  padding: var(--spacing-2xl) 0;
`;

const CaseStudiesContent = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
`;

const ComingSoonNotice = styled.div`
  background-color: var(--color-warning-light);
  border: 1px solid var(--color-warning);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-xl);
  text-align: center;
  margin-bottom: var(--spacing-2xl);
`;

const ComingSoonTitle = styled.h2`
  color: var(--color-warning-dark);
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-md);
`;

const ComingSoonText = styled.p`
  color: var(--color-warning-dark);
  font-size: var(--font-size-body);
  line-height: var(--line-height-relaxed);
  max-width: 600px;
  margin: 0 auto;
`;

const CaseStudyGrid = styled.div`
  display: grid;
  gap: var(--spacing-2xl);
  margin-bottom: var(--spacing-2xl);
`;

const CaseStudyCard = styled.article`
  background-color: var(--color-white);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
`;

const CaseStudyContent = styled.div`
  padding: var(--spacing-xl);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  align-items: center;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
`;

const CaseStudyInfo = styled.div``;

const CaseStudyImage = styled.div`
  height: 300px;
  background: linear-gradient(135deg, ${props => props.color1 || 'var(--color-primary-light)'} 0%, ${props => props.color2 || 'var(--color-secondary-light)'} 100%);
  border-radius: var(--border-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: var(--color-primary);
  
  @media (max-width: 768px) {
    height: 200px;
    order: -1;
  }
`;

const CaseStudyHeader = styled.div`
  margin-bottom: var(--spacing-lg);
`;

const ClientName = styled.h3`
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-primary);
`;

const Industry = styled.span`
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  padding: 0.25rem 0.75rem;
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
`;

const Challenge = styled.div`
  margin-bottom: var(--spacing-lg);
`;

const SectionTitle = styled.h4`
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
`;

const SectionText = styled.p`
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
`;

const Results = styled.div`
  margin-bottom: var(--spacing-lg);
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
`;

const ResultCard = styled.div`
  text-align: center;
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
`;

const ResultNumber = styled.div`
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-bold);
  color: var(--color-success);
  margin-bottom: var(--spacing-xs);
`;

const ResultLabel = styled.div`
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
`;

const CaseStudyLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-primary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  transition: color var(--transition-fast);
  
  &:hover {
    color: var(--color-primary-hover);
  }
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

const CaseStudiesPage = () => {
  const caseStudies = [
    {
      client: "Green Valley Dental",
      industry: "Healthcare",
      challenge: "Their website was inaccessible to patients with disabilities and ranked poorly in local search results, missing potential patients.",
      results: [
        { number: "100%", label: "WCAG Compliance" },
        { number: "180%", label: "Traffic Increase" },
        { number: "45%", label: "More Appointments" },
        { number: "0", label: "Legal Risks" }
      ],
      icon: FaShieldAlt,
      colors: ["var(--color-success-light)", "var(--color-success)"]
    },
    {
      client: "Metro Plumbing Services",
      industry: "Home Services", 
      challenge: "Website looked outdated, loaded slowly on mobile, and wasn't converting visitors into leads despite decent traffic.",
      results: [
        { number: "85%", label: "Faster Load Time" },
        { number: "320%", label: "Mobile Conversions" },
        { number: "95%", label: "Speed Score" },
        { number: "60%", label: "More Leads" }
      ],
      icon: FaChartLine,
      colors: ["var(--color-primary-light)", "var(--color-primary)"]
    },
    {
      client: "Bella's Boutique",
      industry: "Retail",
      challenge: "Small fashion retailer struggling to compete online with poor SEO visibility and no content marketing strategy.",
      results: [
        { number: "400%", label: "Organic Traffic" },
        { number: "250%", label: "Online Sales" },
        { number: "Page 1", label: "Google Rankings" },
        { number: "80%", label: "Return Customers" }
      ],
      icon: FaChartLine,
      colors: ["var(--color-secondary-light)", "var(--color-secondary)"]
    }
  ];

  return (
    <CaseStudiesContainer>
      <HeroSection>
        <HeroContent>
          <HeroTitle>Success Stories</HeroTitle>
          <HeroSubtitle>
            See how we've helped small businesses transform their online presence and achieve real results
          </HeroSubtitle>
        </HeroContent>
      </HeroSection>

      <CaseStudiesSection>
        <CaseStudiesContent>
          <ComingSoonNotice>
            <ComingSoonTitle>Real Case Studies Coming Soon!</ComingSoonTitle>
            <ComingSoonText>
              We're currently working with our first clients and will be sharing detailed case studies 
              showcasing the real impact of our accessibility, SEO, and website overhaul services. 
              Check back soon to see the amazing transformations we're helping businesses achieve!
            </ComingSoonText>
          </ComingSoonNotice>

          <CaseStudyGrid>
            {caseStudies.map((study, index) => {
              const IconComponent = study.icon;
              return (
                <CaseStudyCard key={index}>
                  <CaseStudyContent>
                    <CaseStudyInfo>
                      <CaseStudyHeader>
                        <ClientName>{study.client}</ClientName>
                        <Industry>{study.industry}</Industry>
                      </CaseStudyHeader>

                      <Challenge>
                        <SectionTitle>The Challenge</SectionTitle>
                        <SectionText>{study.challenge}</SectionText>
                      </Challenge>

                      <Results>
                        <SectionTitle>The Results</SectionTitle>
                        <ResultsGrid>
                          {study.results.map((result, resultIndex) => (
                            <ResultCard key={resultIndex}>
                              <ResultNumber>{result.number}</ResultNumber>
                              <ResultLabel>{result.label}</ResultLabel>
                            </ResultCard>
                          ))}
                        </ResultsGrid>
                      </Results>

                      <CaseStudyLink to="#" onClick={(e) => e.preventDefault()}>
                        Read Full Case Study <FaArrowRight />
                      </CaseStudyLink>
                    </CaseStudyInfo>

                    <CaseStudyImage color1={study.colors[0]} color2={study.colors[1]}>
                      <IconComponent />
                    </CaseStudyImage>
                  </CaseStudyContent>
                </CaseStudyCard>
              );
            })}
          </CaseStudyGrid>
        </CaseStudiesContent>
      </CaseStudiesSection>

      <CTASection>
        <CTAContainer>
          <CTATitle>Ready to Be Our Next Success Story?</CTATitle>
          <CTAText>
            Join the growing number of small businesses that have transformed their online presence 
            with StreetWiseWeb's accessibility, SEO, and design services.
          </CTAText>
          <CTAButton to="/free-audit">
            Start Your Transformation <FaArrowRight />
          </CTAButton>
        </CTAContainer>
      </CTASection>
    </CaseStudiesContainer>
  );
};

export default CaseStudiesPage;