import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { FaAccessibleIcon, FaChartLine, FaFileAlt, FaRocket, FaStar } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { accessibilityAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const HomeContainer = styled.div`
  min-height: calc(100vh - 160px);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
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
  color: var(--color-white);
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
  background: linear-gradient(135deg, var(--color-white) 0%, var(--color-primary-light) 100%);
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
  background: var(--color-white);
  padding: 2.5rem;
  border-radius: var(--border-radius-2xl);
  box-shadow: var(--shadow-xl);
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
  color: var(--color-text-primary);
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
  border: 2px solid var(--color-gray-border);
  border-radius: var(--border-radius-lg);
  font-size: 1rem;
  transition: all var(--transition-fast);
  background: var(--color-bg-secondary);
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    background: var(--color-white);
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  }
  
  &:invalid {
    border-color: var(--color-error);
  }
  
  &::placeholder {
    color: var(--color-text-muted);
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const AnalyzeButton = styled.button`
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-white);
  padding: 1rem 2rem;
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  white-space: nowrap;
  box-shadow: var(--shadow-md);
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--color-primary-hover) 0%, var(--color-primary-dark) 100%);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
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
  border-radius: var(--border-radius-xl);
  text-align: center;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all var(--transition-fast);
  
  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.2);
    box-shadow: var(--shadow-lg);
  }
`;

const FeatureIcon = styled.div`
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  color: var(--color-warning);
  display: flex;
  justify-content: center;
`;

const FeatureTitle = styled.h3`
  font-size: 1.375rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--color-white);
`;

const FeatureDescription = styled.p`
  opacity: 0.95;
  line-height: 1.6;
  color: var(--color-white);
`;

const ExampleText = styled.p`
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin-top: 1rem;
  text-align: center;
`;

const ContentSection = styled.section`
  background: var(--color-white);
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
  color: var(--color-text-primary);
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const SectionSubtitle = styled.p`
  font-size: 1.25rem;
  text-align: center;
  color: var(--color-text-secondary);
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
  border-radius: var(--border-radius-lg);
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary);
`;

const StatNumber = styled.div`
  font-size: 3rem;
  font-weight: 800;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 1rem;
  color: var(--color-text-secondary);
  font-weight: 500;
`;

const TestimonialSection = styled.section`
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-white) 100%);
  padding: 5rem 2rem;
  
  @media (max-width: 768px) {
    padding: 3rem 1rem;
  }
`;

const TestimonialCard = styled.div`
  background: var(--color-white);
  padding: 2.5rem;
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
`;

const TestimonialText = styled.p`
  font-size: 1.125rem;
  font-style: italic;
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.7;
`;

const TestimonialAuthor = styled.div`
  font-weight: 600;
  color: var(--color-text-primary);
`;

const TestimonialRole = styled.div`
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
`;

const StarRating = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  color: var(--color-warning);
`;

const HomePage = () => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['homepage', 'forms']);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error(t('forms:messages.enterUrl'));
      return;
    }

    // Basic URL validation - allow domains without protocol
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
    if (!urlPattern.test(url.trim())) {
      toast.error(t('forms:validation.invalidUrl'));
      return;
    }

    // Ensure URL has protocol
    let fullUrl = url.trim();
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = 'https://' + fullUrl;
    }

    setIsAnalyzing(true);
    
    try {
      toast.info(t('forms:messages.analysisStarted'), {
        autoClose: 2000,
      });
      
      const result = await accessibilityAPI.analyzeWebsite(fullUrl, 'overview', i18n.language);
      
      if (result.success) {
        toast.success(t('forms:messages.analysisComplete'));
        
        // Store results in sessionStorage for the results page
        sessionStorage.setItem('analysisResult', JSON.stringify(result.data));
        
        // Navigate to results page
        navigate('/results');
      } else {
        toast.error(t('forms:messages.analysisFailed'));
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error.message || t('forms:messages.error'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <HomeContainer>
        <HeroSection>
          <HeroTitle>
            {t('homepage:hero.title')}
          </HeroTitle>
          <HeroSubtitle>
            {t('homepage:hero.subtitle')}
          </HeroSubtitle>
          
          <AnalysisForm onSubmit={handleSubmit}>
            <FormTitle>{t('homepage:hero.formTitle')}</FormTitle>
            <InputGroup>
              <URLInput
                type="text"
                placeholder={t('forms:placeholder.websiteUrl')}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isAnalyzing}
                required
              />
              <AnalyzeButton type="submit" disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <LoadingSpinner size="small" />
                    {t('forms:buttons.analyzing')}
                  </>
                ) : (
                  <>
                    <FaRocket aria-hidden="true" />
                    {t('forms:buttons.analyze')}
                  </>
                )}
              </AnalyzeButton>
            </InputGroup>
            <ExampleText>
              {t('homepage:hero.exampleText')}
            </ExampleText>
          </AnalysisForm>

          <FeaturesSection>
            <FeatureCard>
              <FeatureIcon>
                <FaAccessibleIcon aria-hidden="true" />
              </FeatureIcon>
              <FeatureTitle>{t('homepage:features.wcagCompliance.title')}</FeatureTitle>
              <FeatureDescription>
                {t('homepage:features.wcagCompliance.description')}
              </FeatureDescription>
            </FeatureCard>
            
            <FeatureCard>
              <FeatureIcon>
                <FaChartLine aria-hidden="true" />
              </FeatureIcon>
              <FeatureTitle>{t('homepage:features.smartScoring.title')}</FeatureTitle>
              <FeatureDescription>
                {t('homepage:features.smartScoring.description')}
              </FeatureDescription>
            </FeatureCard>
            
            <FeatureCard>
              <FeatureIcon>
                <FaFileAlt aria-hidden="true" />
              </FeatureIcon>
              <FeatureTitle>{t('homepage:features.professionalReports.title')}</FeatureTitle>
              <FeatureDescription>
                {t('homepage:features.professionalReports.description')}
              </FeatureDescription>
            </FeatureCard>
          </FeaturesSection>
        </HeroSection>
      </HomeContainer>

      <ContentSection>
        <ContentContainer>
          <SectionTitle>{t('homepage:whyAccessibility.title')}</SectionTitle>
          <SectionSubtitle>
            {t('homepage:whyAccessibility.subtitle')}
          </SectionSubtitle>
          
          <StatsGrid>
            <StatCard>
              <StatNumber>1.3B</StatNumber>
              <StatLabel>{t('homepage:whyAccessibility.stats.peopleWithDisabilities')}</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>$75B</StatNumber>
              <StatLabel>{t('homepage:whyAccessibility.stats.spendingPower')}</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>400%</StatNumber>
              <StatLabel>{t('homepage:whyAccessibility.stats.lawsuitIncrease')}</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>15%</StatNumber>
              <StatLabel>{t('homepage:whyAccessibility.stats.globalDisability')}</StatLabel>
            </StatCard>
          </StatsGrid>
        </ContentContainer>
      </ContentSection>

      <TestimonialSection>
        <ContentContainer>
          <SectionTitle>{t('homepage:testimonials.title')}</SectionTitle>
          <TestimonialCard>
            <StarRating>
              <FaStar />
              <FaStar />
              <FaStar />
              <FaStar />
              <FaStar />
            </StarRating>
            <TestimonialText>
              "{t('homepage:testimonials.quote')}"
            </TestimonialText>
            <TestimonialAuthor>{t('homepage:testimonials.author')}</TestimonialAuthor>
            <TestimonialRole>{t('homepage:testimonials.role')}</TestimonialRole>
          </TestimonialCard>
        </ContentContainer>
      </TestimonialSection>
    </>
  );
};

export default HomePage;