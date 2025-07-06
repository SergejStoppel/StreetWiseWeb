import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { FaSearch, FaAccessibleIcon, FaChartLine, FaFileAlt, FaRocket, FaShieldAlt, FaUsers, FaCheckCircle, FaStar } from 'react-icons/fa';
import { accessibilityAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const HomeContainer = styled.div`
  min-height: calc(100vh - 160px);
  background: linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-secondary-600) 100%);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><radialGradient id="a" cx="50%" cy="50%"><stop offset="0%" style="stop-color:white;stop-opacity:0.1"/><stop offset="100%" style="stop-color:white;stop-opacity:0"/></radialGradient></defs><circle cx="200" cy="200" r="100" fill="url(%23a)"/><circle cx="800" cy="300" r="80" fill="url(%23a)"/><circle cx="400" cy="700" r="120" fill="url(%23a)"/></svg>');
    pointer-events: none;
  }
`;

const HeroSection = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;
  text-align: center;
  color: var(--color-neutral-0);
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    padding: 3rem 1rem;
  }
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.1;
  background: linear-gradient(135deg, var(--color-neutral-0) 0%, var(--color-primary-100) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.375rem;
  margin-bottom: 3rem;
  opacity: 0.95;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    font-size: 1.125rem;
    margin-bottom: 2rem;
  }
`;

const AnalysisForm = styled.form`
  background: var(--color-neutral-0);
  padding: 2.5rem;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  margin-bottom: 4rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    padding: 2rem;
    margin-bottom: 3rem;
  }
`;

const FormTitle = styled.h2`
  color: var(--color-neutral-800);
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const URLInput = styled.input`
  flex: 1;
  padding: 1rem 1.25rem;
  border: 2px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  font-size: 1rem;
  transition: var(--transition-default);
  background: var(--color-neutral-50);
  
  &:focus {
    outline: none;
    border-color: var(--color-primary-500);
    background: var(--color-neutral-0);
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  }
  
  &:invalid {
    border-color: var(--color-error-500);
  }
  
  &::placeholder {
    color: var(--color-neutral-400);
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const AnalyzeButton = styled.button`
  background: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-600) 100%);
  color: var(--color-neutral-0);
  padding: 1rem 2rem;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-default);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  white-space: nowrap;
  box-shadow: var(--shadow-lg);
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-primary-700) 100%);
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
  }
  
  &:disabled {
    background: var(--color-neutral-400);
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    padding: 1.25rem;
  }
`;

const FeaturesSection = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 4rem;
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.15);
  padding: 2.5rem;
  border-radius: var(--radius-xl);
  text-align: center;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: var(--transition-default);
  
  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.2);
    box-shadow: var(--shadow-xl);
  }
`;

const FeatureIcon = styled.div`
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  color: var(--color-warning-400);
  display: flex;
  justify-content: center;
`;

const FeatureTitle = styled.h3`
  font-size: 1.375rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--color-neutral-0);
`;

const FeatureDescription = styled.p`
  opacity: 0.95;
  line-height: 1.6;
  color: var(--color-neutral-100);
`;

const ExampleText = styled.p`
  color: var(--color-neutral-300);
  font-size: 0.875rem;
  margin-top: 1rem;
  text-align: center;
`;

const ContentSection = styled.section`
  background: var(--color-neutral-0);
  padding: 5rem 2rem;
  
  @media (max-width: 768px) {
    padding: 3rem 1rem;
  }
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 1rem;
  color: var(--color-neutral-800);
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const SectionSubtitle = styled.p`
  font-size: 1.25rem;
  text-align: center;
  color: var(--color-neutral-600);
  margin-bottom: 3rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin: 4rem 0;
`;

const StatCard = styled.div`
  text-align: center;
  padding: 2rem;
  border-radius: var(--radius-lg);
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-100);
`;

const StatNumber = styled.div`
  font-size: 3rem;
  font-weight: 800;
  color: var(--color-primary-600);
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 1rem;
  color: var(--color-neutral-600);
  font-weight: 500;
`;

const TestimonialSection = styled.section`
  background: linear-gradient(135deg, var(--color-neutral-100) 0%, var(--color-neutral-50) 100%);
  padding: 5rem 2rem;
  
  @media (max-width: 768px) {
    padding: 3rem 1rem;
  }
`;

const TestimonialCard = styled.div`
  background: var(--color-neutral-0);
  padding: 2.5rem;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
`;

const TestimonialText = styled.p`
  font-size: 1.125rem;
  font-style: italic;
  color: var(--color-neutral-700);
  margin-bottom: 1.5rem;
  line-height: 1.7;
`;

const TestimonialAuthor = styled.div`
  font-weight: 600;
  color: var(--color-neutral-800);
`;

const TestimonialRole = styled.div`
  font-size: 0.875rem;
  color: var(--color-neutral-500);
  margin-top: 0.25rem;
`;

const StarRating = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  color: var(--color-warning-400);
`;

const HomePage = () => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error('Please enter a website URL');
      return;
    }

    // Basic URL validation - allow domains without protocol
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    if (!urlPattern.test(url.trim())) {
      toast.error('Please enter a valid website URL (e.g., example.com or https://example.com)');
      return;
    }

    // Ensure URL has protocol
    let fullUrl = url.trim();
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = 'https://' + fullUrl;
    }

    setIsAnalyzing(true);
    
    try {
      toast.info('Starting accessibility analysis...', {
        autoClose: 2000,
      });
      
      const result = await accessibilityAPI.analyzeWebsite(fullUrl);
      
      if (result.success) {
        toast.success('Analysis completed successfully!');
        
        // Store results in sessionStorage for the results page
        sessionStorage.setItem('analysisResult', JSON.stringify(result.data));
        
        // Navigate to results page
        navigate('/results');
      } else {
        toast.error('Analysis failed. Please try again.');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Failed to analyze website. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <HomeContainer>
        <HeroSection>
          <HeroTitle>
            Professional Website Accessibility Analysis
          </HeroTitle>
          <HeroSubtitle>
            Get instant insights into your website's accessibility compliance with our AI-powered analysis. 
            Identify issues, improve user experience, and ensure legal compliance.
          </HeroSubtitle>
          
          <AnalysisForm onSubmit={handleSubmit}>
            <FormTitle>Analyze Your Website</FormTitle>
            <InputGroup>
              <URLInput
                type="text"
                placeholder="yourwebsite.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isAnalyzing}
                required
              />
              <AnalyzeButton type="submit" disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <LoadingSpinner size="small" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FaRocket aria-hidden="true" />
                    Start Analysis
                  </>
                )}
              </AnalyzeButton>
            </InputGroup>
            <ExampleText>
              Enter any website (e.g., example.com) • Free overview report • Detailed reports available for purchase
            </ExampleText>
          </AnalysisForm>

          <FeaturesSection>
            <FeatureCard>
              <FeatureIcon>
                <FaAccessibleIcon aria-hidden="true" />
              </FeatureIcon>
              <FeatureTitle>WCAG Compliance</FeatureTitle>
              <FeatureDescription>
                Comprehensive analysis using industry-standard Axe-core engine to identify 
                accessibility violations and ensure WCAG 2.1 AA compliance.
              </FeatureDescription>
            </FeatureCard>
            
            <FeatureCard>
              <FeatureIcon>
                <FaChartLine aria-hidden="true" />
              </FeatureIcon>
              <FeatureTitle>Smart Scoring</FeatureTitle>
              <FeatureDescription>
                Get clear accessibility scores with impact assessment. Understand which 
                issues to prioritize for maximum improvement in user experience.
              </FeatureDescription>
            </FeatureCard>
            
            <FeatureCard>
              <FeatureIcon>
                <FaFileAlt aria-hidden="true" />
              </FeatureIcon>
              <FeatureTitle>Professional Reports</FeatureTitle>
              <FeatureDescription>
                Receive detailed PDF reports with specific recommendations, code examples, 
                and implementation guidance for your development team.
              </FeatureDescription>
            </FeatureCard>
          </FeaturesSection>
        </HeroSection>
      </HomeContainer>

      <ContentSection>
        <ContentContainer>
          <SectionTitle>Why Accessibility Matters</SectionTitle>
          <SectionSubtitle>
            Web accessibility isn't just about compliance—it's about creating inclusive experiences 
            for all users while protecting your business from legal risks.
          </SectionSubtitle>
          
          <StatsGrid>
            <StatCard>
              <StatNumber>1.3B</StatNumber>
              <StatLabel>People with disabilities worldwide</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>$75B</StatNumber>
              <StatLabel>Annual spending power</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>400%</StatNumber>
              <StatLabel>Increase in accessibility lawsuits</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>15%</StatNumber>
              <StatLabel>Of global population has a disability</StatLabel>
            </StatCard>
          </StatsGrid>
        </ContentContainer>
      </ContentSection>

      <TestimonialSection>
        <ContentContainer>
          <SectionTitle>Trusted by Businesses</SectionTitle>
          <TestimonialCard>
            <StarRating>
              <FaStar />
              <FaStar />
              <FaStar />
              <FaStar />
              <FaStar />
            </StarRating>
            <TestimonialText>
              "SiteCraft's accessibility analysis helped us identify and fix critical issues 
              we didn't even know existed. The detailed report saved our development team weeks 
              of work and helped us avoid potential legal complications."
            </TestimonialText>
            <TestimonialAuthor>Sarah Chen</TestimonialAuthor>
            <TestimonialRole>CTO, TechStart Inc.</TestimonialRole>
          </TestimonialCard>
        </ContentContainer>
      </TestimonialSection>
    </>
  );
};

export default HomePage;