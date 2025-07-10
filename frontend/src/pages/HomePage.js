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
  background: linear-gradient(135deg, var(--color-interactive-primary) 0%, var(--color-interactive-primary-hover) 100%);
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
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: var(--spacing-4xl) var(--spacing-xl);
  text-align: center;
  color: var(--color-text-inverse);
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    padding: var(--spacing-3xl) var(--spacing-md);
  }
`;

const HeroTitle = styled.h1`
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-extrabold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-lg);
  line-height: var(--line-height-tight);
  color: var(--color-text-inverse);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-4xl);
  }
  
  @media (max-width: 480px) {
    font-size: var(--font-size-3xl);
  }
`;

const HeroSubtitle = styled.p`
  font-size: var(--font-size-xl);
  font-family: var(--font-family-secondary);
  margin-bottom: var(--spacing-3xl);
  opacity: 0.95;
  line-height: var(--line-height-relaxed);
  max-width: var(--content-max-width);
  margin-left: auto;
  margin-right: auto;
  color: var(--color-text-inverse);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-2xl);
  }
`;

const AnalysisForm = styled.form`
  background: var(--color-surface-elevated);
  padding: var(--spacing-2xl);
  border-radius: var(--border-radius-2xl);
  box-shadow: var(--shadow-xl);
  margin-bottom: var(--spacing-4xl);
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border-primary);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    padding: var(--spacing-xl);
    margin-bottom: var(--spacing-3xl);
  }
`;

const FormTitle = styled.h2`
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-lg);
  text-align: center;
`;

const InputGroup = styled.div`
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: var(--spacing-md);
  }
`;

const URLInput = styled.input`
  flex: 1;
  padding: var(--spacing-md) var(--spacing-lg);
  border: 2px solid var(--color-border-primary);
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-base);
  font-family: var(--font-family-secondary);
  color: var(--color-text-primary);
  transition: all var(--transition-fast);
  background: var(--color-surface-primary);
  
  &:focus {
    outline: none;
    border-color: var(--color-interactive-primary);
    background: var(--color-surface-elevated);
    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
  }
  
  &:invalid {
    border-color: var(--color-error);
  }
  
  &::placeholder {
    color: var(--color-text-tertiary);
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const AnalyzeButton = styled.button`
  background: var(--color-interactive-primary);
  color: var(--color-text-on-brand);
  padding: var(--spacing-md) var(--spacing-xl);
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  white-space: nowrap;
  box-shadow: var(--shadow-md);
  
  &:hover:not(:disabled) {
    background: var(--color-interactive-primary-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
  
  &:disabled {
    background: var(--color-text-tertiary);
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    padding: var(--spacing-lg);
  }
`;

const FeaturesSection = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-xl);
  margin-top: var(--spacing-4xl);
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.15);
  padding: var(--spacing-2xl);
  border-radius: var(--border-radius-xl);
  text-align: center;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all var(--transition-fast);
  
  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.25);
    box-shadow: var(--shadow-lg);
  }
`;

const FeatureIcon = styled.div`
  font-size: var(--font-size-5xl);
  margin-bottom: var(--spacing-lg);
  color: var(--color-warning);
  display: flex;
  justify-content: center;
`;

const FeatureTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-primary);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-inverse);
`;

const FeatureDescription = styled.p`
  opacity: 0.95;
  line-height: var(--line-height-relaxed);
  color: var(--color-text-inverse);
  font-family: var(--font-family-secondary);
`;

const ExampleText = styled.p`
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-secondary);
  margin-top: var(--spacing-md);
  text-align: center;
`;

const ContentSection = styled.section`
  background: var(--color-surface-primary);
  padding: var(--spacing-5xl) var(--spacing-xl);
  
  @media (max-width: 768px) {
    padding: var(--spacing-3xl) var(--spacing-md);
  }
`;

const ContentContainer = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  font-family: var(--font-family-primary);
  text-align: center;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-3xl);
  }
`;

const SectionSubtitle = styled.p`
  font-size: var(--font-size-xl);
  font-family: var(--font-family-secondary);
  text-align: center;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-3xl);
  max-width: var(--content-max-width);
  margin-left: auto;
  margin-right: auto;
  line-height: var(--line-height-relaxed);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-xl);
  margin: var(--spacing-4xl) 0;
`;

const StatCard = styled.div`
  text-align: center;
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  background: var(--color-surface-secondary);
  border: 1px solid var(--color-border-primary);
`;

const StatNumber = styled.div`
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  font-family: var(--font-family-primary);
  color: var(--color-interactive-primary);
  margin-bottom: var(--spacing-sm);
`;

const StatLabel = styled.div`
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-secondary);
`;

const TestimonialSection = styled.section`
  background: linear-gradient(135deg, var(--color-surface-secondary) 0%, var(--color-surface-primary) 100%);
  padding: var(--spacing-5xl) var(--spacing-xl);
  
  @media (max-width: 768px) {
    padding: var(--spacing-3xl) var(--spacing-md);
  }
`;

const TestimonialCard = styled.div`
  background: var(--color-surface-elevated);
  padding: var(--spacing-2xl);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-primary);
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
`;

const TestimonialText = styled.p`
  font-size: var(--font-size-lg);
  font-style: italic;
  font-family: var(--font-family-secondary);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
  line-height: var(--line-height-relaxed);
`;

const TestimonialAuthor = styled.div`
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  color: var(--color-text-primary);
`;

const TestimonialRole = styled.div`
  font-size: var(--font-size-sm);
  font-family: var(--font-family-secondary);
  color: var(--color-text-tertiary);
  margin-top: var(--spacing-xs);
`;

const StarRating = styled.div`
  display: flex;
  justify-content: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-lg);
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