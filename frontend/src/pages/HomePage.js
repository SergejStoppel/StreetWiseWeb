import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { 
  FaAccessibleIcon, 
  FaChartLine, 
  FaFileAlt, 
  FaRocket, 
  FaStar, 
  FaExclamationTriangle,
  FaDollarSign,
  FaUsers,
  FaShieldAlt,
  FaSearch,
  FaMobile,
  FaRobot,
  FaCheckCircle,
  FaArrowRight
} from 'react-icons/fa';
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

const ProblemSection = styled(ContentSection)`
  background: linear-gradient(135deg, var(--color-surface-secondary) 0%, var(--color-surface-primary) 100%);
`;

const QuestionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-xl);
  margin-top: var(--spacing-3xl);
`;

const QuestionCard = styled.div`
  background: var(--color-surface-elevated);
  padding: var(--spacing-2xl);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-primary);
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
    transition: all var(--transition-fast);
  }
`;

const QuestionTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  font-family: var(--font-family-primary);
`;

const QuestionDescription = styled.p`
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  font-family: var(--font-family-secondary);
`;

const AgitateSection = styled(ContentSection)`
  background: var(--color-surface-primary);
`;

const PointsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-xl);
  margin-top: var(--spacing-3xl);
`;

const PointCard = styled.div`
  text-align: center;
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  background: var(--color-surface-secondary);
  border: 1px solid var(--color-border-primary);
`;

const PointIcon = styled.div`
  font-size: var(--font-size-4xl);
  color: var(--color-error);
  margin-bottom: var(--spacing-lg);
  display: flex;
  justify-content: center;
`;

const PointTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  font-family: var(--font-family-primary);
`;

const PointDescription = styled.p`
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  font-family: var(--font-family-secondary);
`;

const SolutionSection = styled(ContentSection)`
  background: linear-gradient(135deg, var(--color-success-100) 0%, var(--color-surface-primary) 100%);
`;

const PromiseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-xl);
  margin-top: var(--spacing-3xl);
`;

const PromiseCard = styled.div`
  background: var(--color-surface-elevated);
  padding: var(--spacing-2xl);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-success-300);
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
    transition: all var(--transition-fast);
  }
`;

const HowItWorksSection = styled(ContentSection)`
  background: var(--color-surface-secondary);
`;

const StepsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-2xl);
  margin-top: var(--spacing-3xl);
`;

const StepCard = styled.div`
  text-align: center;
  position: relative;
`;

const StepNumber = styled.div`
  width: 60px;
  height: 60px;
  background: var(--color-interactive-primary);
  color: var(--color-text-on-brand);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin: 0 auto var(--spacing-lg);
  font-family: var(--font-family-primary);
`;

const StepTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  font-family: var(--font-family-primary);
`;

const StepDescription = styled.p`
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  font-family: var(--font-family-secondary);
`;

const ServicesSection = styled(ContentSection)`
  background: var(--color-surface-primary);
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-xl);
  margin-top: var(--spacing-3xl);
`;

const ServiceCard = styled.div`
  background: var(--color-surface-elevated);
  padding: var(--spacing-2xl);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-primary);
  text-align: center;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
    transition: all var(--transition-fast);
  }
`;

const ServiceIcon = styled.div`
  font-size: var(--font-size-4xl);
  color: var(--color-interactive-primary);
  margin-bottom: var(--spacing-lg);
  display: flex;
  justify-content: center;
`;

const ServiceTitle = styled.h3`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  font-family: var(--font-family-primary);
`;

const ServiceDescription = styled.p`
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  font-family: var(--font-family-secondary);
  margin-bottom: var(--spacing-md);
`;

const ServiceDetails = styled.p`
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  font-style: italic;
  font-family: var(--font-family-secondary);
`;

const AIStatsSection = styled(ContentSection)`
  background: linear-gradient(135deg, var(--color-interactive-primary-50) 0%, var(--color-surface-primary) 100%);
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
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-interactive-primary-200);
  box-shadow: var(--shadow-md);
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

const TestimonialSection = styled(ContentSection)`
  background: linear-gradient(135deg, var(--color-surface-secondary) 0%, var(--color-surface-primary) 100%);
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

const FinalCTASection = styled(ContentSection)`
  background: linear-gradient(135deg, var(--color-interactive-primary) 0%, var(--color-interactive-primary-hover) 100%);
  color: var(--color-text-inverse);
  text-align: center;
`;

const CTATitle = styled.h2`
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-inverse);
  font-family: var(--font-family-primary);
`;

const CTASubtitle = styled.p`
  font-size: var(--font-size-xl);
  margin-bottom: var(--spacing-3xl);
  opacity: 0.95;
  color: var(--color-text-inverse);
  font-family: var(--font-family-secondary);
`;

const CTAForm = styled.form`
  max-width: 500px;
  margin: 0 auto;
`;

const CTAButton = styled(AnalyzeButton)`
  background: var(--color-warning);
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  padding: var(--spacing-lg) var(--spacing-2xl);
  
  &:hover:not(:disabled) {
    background: var(--color-warning-hover);
    transform: translateY(-2px);
  }
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
      {/* 1. Hero Section */}
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
                placeholder={t('homepage:hero.microcopy')}
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
                    {t('homepage:hero.formTitle')}
                  </>
                )}
              </AnalyzeButton>
            </InputGroup>
            <ExampleText>
              {t('homepage:hero.exampleText')}
            </ExampleText>
          </AnalysisForm>
        </HeroSection>
      </HomeContainer>

      {/* 2. Problem Section */}
      <ProblemSection>
        <ContentContainer>
          <SectionTitle>{t('homepage:problem.title')}</SectionTitle>
          <SectionSubtitle>
            {t('homepage:problem.intro')}
          </SectionSubtitle>
          
          <QuestionsGrid>
            {t('homepage:problem.questions', { returnObjects: true }).map((question, index) => (
              <QuestionCard key={index}>
                <QuestionTitle>"{question.title}"</QuestionTitle>
                <QuestionDescription>{question.description}</QuestionDescription>
              </QuestionCard>
            ))}
          </QuestionsGrid>
        </ContentContainer>
      </ProblemSection>

      {/* 3. Agitate Section */}
      <AgitateSection>
        <ContentContainer>
          <SectionTitle>{t('homepage:agitate.title')}</SectionTitle>
          <SectionSubtitle>
            {t('homepage:agitate.content')}
          </SectionSubtitle>
          
          <PointsGrid>
            {t('homepage:agitate.points', { returnObjects: true }).map((point, index) => (
              <PointCard key={index}>
                <PointIcon>
                  {index === 0 && <FaDollarSign />}
                  {index === 1 && <FaUsers />}
                  {index === 2 && <FaExclamationTriangle />}
                </PointIcon>
                <PointTitle>{point.title}</PointTitle>
                <PointDescription>{point.description}</PointDescription>
              </PointCard>
            ))}
          </PointsGrid>
        </ContentContainer>
      </AgitateSection>

      {/* 4. Solution Section */}
      <SolutionSection>
        <ContentContainer>
          <SectionTitle>{t('homepage:solution.title')}</SectionTitle>
          <SectionSubtitle>
            {t('homepage:solution.subtitle')}
          </SectionSubtitle>
          
          <SectionTitle style={{ fontSize: 'var(--font-size-2xl)', marginTop: 'var(--spacing-3xl)' }}>
            {t('homepage:solution.promise.title')}
          </SectionTitle>
          
          <PromiseGrid>
            {t('homepage:solution.promise.points', { returnObjects: true }).map((point, index) => (
              <PromiseCard key={index}>
                <ServiceIcon>
                  {index === 0 && <FaCheckCircle />}
                  {index === 1 && <FaRobot />}
                  {index === 2 && <FaShieldAlt />}
                </ServiceIcon>
                <ServiceTitle>{point.title}</ServiceTitle>
                <ServiceDescription>{point.description}</ServiceDescription>
              </PromiseCard>
            ))}
          </PromiseGrid>
        </ContentContainer>
      </SolutionSection>

      {/* 5. How It Works Section */}
      <HowItWorksSection>
        <ContentContainer>
          <SectionTitle>{t('homepage:howItWorks.title')}</SectionTitle>
          
          <StepsGrid>
            {t('homepage:howItWorks.steps', { returnObjects: true }).map((step, index) => (
              <StepCard key={index}>
                <StepNumber>{step.number}</StepNumber>
                <StepTitle>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
              </StepCard>
            ))}
          </StepsGrid>
        </ContentContainer>
      </HowItWorksSection>

      {/* 6. Services Overview Section */}
      <ServicesSection>
        <ContentContainer>
          <SectionTitle>{t('homepage:services.title')}</SectionTitle>
          
          <ServicesGrid>
            {t('homepage:services.items', { returnObjects: true }).map((service, index) => (
              <ServiceCard key={index}>
                <ServiceIcon>
                  {index === 0 && <FaAccessibleIcon />}
                  {index === 1 && <FaSearch />}
                  {index === 2 && <FaMobile />}
                </ServiceIcon>
                <ServiceTitle>{service.title}</ServiceTitle>
                <ServiceDescription>{service.description}</ServiceDescription>
                <ServiceDetails>{service.details}</ServiceDetails>
              </ServiceCard>
            ))}
          </ServicesGrid>
        </ContentContainer>
      </ServicesSection>

      {/* AI Stats Section */}
      <AIStatsSection>
        <ContentContainer>
          <SectionTitle>{t('homepage:aiStats.title')}</SectionTitle>
          <SectionSubtitle>
            {t('homepage:aiStats.subtitle')}
          </SectionSubtitle>
          
          <StatsGrid>
            {t('homepage:aiStats.stats', { returnObjects: true }).map((stat, index) => (
              <StatCard key={index}>
                <StatNumber>{stat.number}</StatNumber>
                <StatLabel>{stat.label}</StatLabel>
              </StatCard>
            ))}
          </StatsGrid>
        </ContentContainer>
      </AIStatsSection>

      {/* 7. Social Proof/Testimonial Section */}
      <TestimonialSection>
        <ContentContainer>
          <SectionTitle>{t('homepage:testimonial.title')}</SectionTitle>
          <TestimonialCard>
            <StarRating>
              <FaStar />
              <FaStar />
              <FaStar />
              <FaStar />
              <FaStar />
            </StarRating>
            <TestimonialText>
              "{t('homepage:testimonial.quote')}"
            </TestimonialText>
            <TestimonialAuthor>{t('homepage:testimonial.author')}</TestimonialAuthor>
            <TestimonialRole>{t('homepage:testimonial.role')}</TestimonialRole>
          </TestimonialCard>
        </ContentContainer>
      </TestimonialSection>

      {/* 8. Final Call-to-Action Section */}
      <FinalCTASection>
        <ContentContainer>
          <CTATitle>{t('homepage:finalCta.title')}</CTATitle>
          <CTASubtitle>{t('homepage:finalCta.subtitle')}</CTASubtitle>
          
          <CTAForm onSubmit={handleSubmit}>
            <InputGroup>
              <URLInput
                type="text"
                placeholder={t('homepage:hero.microcopy')}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isAnalyzing}
                required
                style={{ border: '2px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white' }}
              />
              <CTAButton type="submit" disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <LoadingSpinner size="small" />
                    {t('forms:buttons.analyzing')}
                  </>
                ) : (
                  <>
                    <FaArrowRight aria-hidden="true" />
                    {t('homepage:finalCta.button')}
                  </>
                )}
              </CTAButton>
            </InputGroup>
          </CTAForm>
        </ContentContainer>
      </FinalCTASection>
    </>
  );
};

export default HomePage;