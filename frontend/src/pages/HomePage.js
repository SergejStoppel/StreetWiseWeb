import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { FaSearch, FaAccessibleIcon, FaChartLine, FaFileAlt } from 'react-icons/fa';
import { accessibilityAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const HomeContainer = styled.div`
  min-height: calc(100vh - 160px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
`;

const HeroSection = styled.section`
  max-width: 800px;
  text-align: center;
  color: white;
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.1;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
  
  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 1.125rem;
  }
`;

const AnalysisForm = styled.form`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const FormTitle = styled.h2`
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-align: center;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const URLInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
  }
  
  &:invalid {
    border-color: #ef4444;
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const AnalyzeButton = styled.button`
  background: #2563eb;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover:not(:disabled) {
    background: #1d4ed8;
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const FeaturesSection = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #fbbf24;
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const FeatureDescription = styled.p`
  opacity: 0.9;
  line-height: 1.6;
`;

const ExampleText = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  text-align: center;
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

    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(url)) {
      toast.error('Please enter a valid website URL');
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
    <HomeContainer>
      <HeroSection>
        <HeroTitle>
          Website Accessibility Analysis
        </HeroTitle>
        <HeroSubtitle>
          Get instant insights into your website's accessibility compliance 
          and receive actionable recommendations to improve user experience.
        </HeroSubtitle>
        
        <AnalysisForm onSubmit={handleSubmit}>
          <FormTitle>Enter Website URL</FormTitle>
          <InputGroup>
            <URLInput
              type="url"
              placeholder="https://example.com"
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
                  <FaSearch aria-hidden="true" />
                  Analyze Website
                </>
              )}
            </AnalyzeButton>
          </InputGroup>
          <ExampleText>
            Example: https://example.com or just example.com
          </ExampleText>
        </AnalysisForm>

        <FeaturesSection>
          <FeatureCard>
            <FeatureIcon>
              <FaAccessibleIcon aria-hidden="true" />
            </FeatureIcon>
            <FeatureTitle>Accessibility Audit</FeatureTitle>
            <FeatureDescription>
              Comprehensive analysis using industry-standard tools to identify 
              accessibility issues and WCAG compliance gaps.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>
              <FaChartLine aria-hidden="true" />
            </FeatureIcon>
            <FeatureTitle>Detailed Scoring</FeatureTitle>
            <FeatureDescription>
              Get clear accessibility scores and understand the impact of 
              each issue on user experience and legal compliance.
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>
              <FaFileAlt aria-hidden="true" />
            </FeatureIcon>
            <FeatureTitle>Actionable Reports</FeatureTitle>
            <FeatureDescription>
              Receive specific recommendations and implementation guidance 
              to fix accessibility issues and improve your website.
            </FeatureDescription>
          </FeatureCard>
        </FeaturesSection>
      </HeroSection>
    </HomeContainer>
  );
};

export default HomePage;