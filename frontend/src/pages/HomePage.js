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
  FaArrowRight,
  FaPlay
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { accessibilityAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

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
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  
  @media (min-width: 640px) {
    flex-direction: row;
    align-items: stretch;
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
  min-height: 48px;
  
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
`;

const AnalyzeButton = styled.button`
  background: var(--color-interactive-primary);
  color: var(--color-text-on-brand);
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-md);
  min-height: 48px;
  text-align: center;
  line-height: 1.4;
  
  @media (min-width: 640px) {
    min-width: 140px;
    flex-shrink: 0;
  }
  
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
  padding: var(--spacing-4xl) var(--spacing-xl);
  
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
  margin-top: var(--spacing-2xl);
`;

const QuestionCard = styled.div`
  background: var(--color-surface-elevated);
  padding: var(--spacing-xl);
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

const SolutionSection = styled(ContentSection)`
  background: linear-gradient(135deg, var(--color-success-100) 0%, var(--color-surface-primary) 100%);
`;

const PromiseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-xl);
  margin-top: var(--spacing-2xl);
`;

const PromiseCard = styled.div`
  background: var(--color-surface-elevated);
  padding: var(--spacing-xl);
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
  gap: var(--spacing-xl);
  margin-top: var(--spacing-2xl);
`;

const StepCard = styled.div`
  text-align: center;
  position: relative;
  padding: var(--spacing-lg);
  background: var(--color-surface-elevated);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-primary);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    transition: all var(--transition-fast);
  }
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
  box-shadow: var(--shadow-md);
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
  margin-top: var(--spacing-2xl);
`;

const ServiceCard = styled.div`
  background: var(--color-surface-elevated);
  padding: var(--spacing-xl);
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
  padding: var(--spacing-5xl) var(--spacing-xl);
  
  @media (max-width: 768px) {
    padding: var(--spacing-4xl) var(--spacing-md);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-xl);
  margin: var(--spacing-2xl) 0;
  align-items: stretch;
  
  @media (min-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  text-align: center;
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-interactive-primary-200);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  min-height: 340px;
  height: 100%;
  
  @media (max-width: 768px) {
    min-height: 300px;
    padding: var(--spacing-lg);
  }
  
  @media (max-width: 480px) {
    min-height: 280px;
    padding: var(--spacing-md);
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    transition: all var(--transition-fast);
  }
`;

const StatContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  flex-grow: 1;
  width: 100%;
`;

const StatNumber = styled.div`
  font-size: ${props => props.$isBreaking ? 'var(--font-size-2xl)' : 'var(--font-size-4xl)'};
  font-weight: var(--font-weight-extrabold);
  font-family: var(--font-family-primary);
  color: var(--color-interactive-primary);
  margin-bottom: var(--spacing-md);
  text-transform: ${props => props.$isBreaking ? 'uppercase' : 'none'};
  letter-spacing: ${props => props.$isBreaking ? '0.05em' : 'normal'};
  line-height: 1.1;
  min-height: ${props => props.$isBreaking ? '60px' : '80px'};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatLabel = styled.div`
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-secondary);
  margin-bottom: var(--spacing-md);
  text-align: center;
  line-height: var(--line-height-normal);
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatDetail = styled.div`
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  font-style: italic;
  font-family: var(--font-family-secondary);
  line-height: var(--line-height-relaxed);
  padding: var(--spacing-md) var(--spacing-sm) 0;
  border-top: 1px solid var(--color-border-secondary);
  margin-top: auto;
  width: 100%;
  text-align: center;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const AIDescription = styled.div`
  background: var(--color-surface-elevated);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  margin: var(--spacing-xl) 0;
  border-left: 4px solid var(--color-interactive-primary);
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  
  p {
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
    line-height: var(--line-height-relaxed);
    margin: 0;
    text-align: center;
  }
`;

const AIInsight = styled.div`
  background: linear-gradient(135deg, var(--color-success-100) 0%, var(--color-surface-elevated) 100%);
  padding: var(--spacing-xl) var(--spacing-2xl);
  border-radius: var(--border-radius-lg);
  margin-top: var(--spacing-2xl);
  border: 1px solid var(--color-success-300);
  text-align: center;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  
  p {
    color: var(--color-text-primary);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-medium);
    margin: 0;
    line-height: var(--line-height-relaxed);
  }
  
  &::before {
    content: "💡";
    display: block;
    font-size: var(--font-size-2xl);
    margin-bottom: var(--spacing-sm);
  }
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
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    transition: all var(--transition-fast);
  }
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
  padding: var(--spacing-3xl) var(--spacing-xl);
`;

const CTATitle = styled.h2`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-extrabold);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-inverse);
  font-family: var(--font-family-primary);
  text-align: center;
`;

const CTASubtitle = styled.p`
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-2xl);
  opacity: 0.95;
  color: var(--color-text-inverse);
  font-family: var(--font-family-secondary);
  text-align: center;
`;

const CTAButton = styled.button`
  background: var(--color-warning);
  color: var(--color-text-primary);
  padding: var(--spacing-lg) var(--spacing-2xl);
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-lg);
  min-height: 56px;
  
  &:hover:not(:disabled) {
    background: var(--color-warning-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
  }
  
  &:disabled {
    background: var(--color-text-tertiary);
    cursor: not-allowed;
    transform: none;
  }
`;

const HomePage = () => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();
  const { t, i18n, ready } = useTranslation(['homepage', 'forms']);
  const { initializing } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Guard against double-submission in StrictMode
    if (isAnalyzing) {
      console.log('⚠️ Analysis already in progress, ignoring duplicate submission');
      return;
    }
    
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    // Ensure URL has protocol
    let fullUrl = url.trim();
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = 'https://' + fullUrl;
    }

    console.log('🚀 Starting analysis for:', fullUrl);
    console.log('🌐 API Base URL:', process.env.REACT_APP_API_URL);
    
    // Test backend connectivity first
    try {
      console.log('🔍 Testing backend connectivity...');
      const healthResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/health`);
      console.log('🏥 Health check response:', {
        status: healthResponse.status,
        statusText: healthResponse.statusText,
        ok: healthResponse.ok
      });
    } catch (healthError) {
      console.error('❌ Backend health check failed:', healthError);
    }
    
    setIsAnalyzing(true);
    
    try {
      toast.info('Starting analysis...', { autoClose: 2000 });
      
      const result = await accessibilityAPI.analyzeWebsite(fullUrl, 'overview', i18n.language);
      
      console.log('🔍 Analysis result structure:', {
        result: !!result,
        resultKeys: result ? Object.keys(result) : null,
        hasSuccess: result?.success,
        hasData: result?.data,
        resultType: typeof result
      });
      
      if (result && result.success) {
        console.log('✅ Analysis successful, storing result and navigating');
        toast.success('Analysis complete!');
        
        console.log('💾 Storing result in sessionStorage:', {
          dataKeys: Object.keys(result.data),
          dataSize: JSON.stringify(result.data).length
        });
        sessionStorage.setItem('analysisResult', JSON.stringify(result.data));
        
        console.log('🧭 Attempting navigation to /results');
        navigate('/results');
        
        // Verify navigation after a short delay
        setTimeout(() => {
          console.log('🔍 Current location after navigation:', window.location.pathname);
        }, 100);
      } else {
        console.log('❌ Analysis failed - no success flag or no result');
        console.log('Result object:', result);
        toast.error('Analysis failed');
      }
    } catch (error) {
      console.error('💥 Analysis error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        response: error.response,
        code: error.code
      });
      toast.error(error.message || 'Analysis failed with error');
    } finally {
      console.log('🔄 Analysis completed, setting isAnalyzing to false');
      setIsAnalyzing(false);
    }
  };

  // Show loading only if translations are not ready (should be very fast)
  if (!ready) {
    return (
      <HomeContainer>
        <HeroSection>
          <LoadingSpinner size="large" />
        </HeroSection>
      </HomeContainer>
    );
  }

  return (
    <>
      {/* Hero Section */}
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
                aria-label={t('forms:labels.websiteUrl')}
              />
              <AnalyzeButton 
                type="submit" 
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <LoadingSpinner size="small" />
                    {t('forms:buttons.analyzing')}
                  </>
                ) : (
                  <>
                    <FaPlay aria-hidden="true" />
                    {t('forms:buttons.analyze')}
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

      {/* Problem Section */}
      <ProblemSection>
        <ContentContainer>
          <SectionTitle>{t('homepage:problem.title')}</SectionTitle>
          <SectionSubtitle>
            {t('homepage:problem.intro')}
          </SectionSubtitle>
          
          <QuestionsGrid>
            {(Array.isArray(t('homepage:problem.questions', { returnObjects: true })) ? t('homepage:problem.questions', { returnObjects: true }) : []).map((question, index) => (
              <QuestionCard key={index}>
                <QuestionTitle>"{question.title}"</QuestionTitle>
                <QuestionDescription>{question.description}</QuestionDescription>
              </QuestionCard>
            ))}
          </QuestionsGrid>
        </ContentContainer>
      </ProblemSection>

      {/* Solution Section */}
      <SolutionSection>
        <ContentContainer>
          <SectionTitle>{t('homepage:solution.title')}</SectionTitle>
          <SectionSubtitle>
            {t('homepage:solution.subtitle')}
          </SectionSubtitle>
          
          <SectionTitle style={{ fontSize: 'var(--font-size-2xl)', marginTop: 'var(--spacing-2xl)' }}>
            {t('homepage:solution.promise.title')}
          </SectionTitle>
          
          <PromiseGrid>
            {(Array.isArray(t('homepage:solution.promise.points', { returnObjects: true })) ? t('homepage:solution.promise.points', { returnObjects: true }) : []).map((point, index) => (
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

      {/* How It Works Section */}
      <HowItWorksSection>
        <ContentContainer>
          <SectionTitle>{t('homepage:howItWorks.title')}</SectionTitle>
          
          <StepsGrid>
            {(Array.isArray(t('homepage:howItWorks.steps', { returnObjects: true })) ? t('homepage:howItWorks.steps', { returnObjects: true }) : []).map((step, index) => (
              <StepCard key={index}>
                <StepNumber>{step.number}</StepNumber>
                <StepTitle>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
              </StepCard>
            ))}
          </StepsGrid>
        </ContentContainer>
      </HowItWorksSection>

      {/* Services Overview Section */}
      <ServicesSection>
        <ContentContainer>
          <SectionTitle>{t('homepage:services.title')}</SectionTitle>
          
          <ServicesGrid>
            {(Array.isArray(t('homepage:services.items', { returnObjects: true })) ? t('homepage:services.items', { returnObjects: true }) : []).map((service, index) => (
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
          
          <AIDescription>
            <p>{t('homepage:aiStats.description')}</p>
          </AIDescription>
          
          <StatsGrid>
            {(Array.isArray(t('homepage:aiStats.stats', { returnObjects: true })) ? t('homepage:aiStats.stats', { returnObjects: true }) : []).map((stat, index) => (
              <StatCard key={index}>
                <StatContent>
                  <StatNumber $isBreaking={stat.number === "Breaking"}>{stat.number}</StatNumber>
                  <StatLabel>{stat.label}</StatLabel>
                </StatContent>
                {stat.detail && <StatDetail>{stat.detail}</StatDetail>}
              </StatCard>
            ))}
          </StatsGrid>
          
          {t('homepage:aiStats.insight') && (
            <AIInsight>
              <p>{t('homepage:aiStats.insight')}</p>
            </AIInsight>
          )}
        </ContentContainer>
      </AIStatsSection>

      {/* Social Proof/Testimonial Section */}
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

      {/* Final Call-to-Action Section */}
      <FinalCTASection>
        <ContentContainer>
          <CTATitle>{t('homepage:finalCta.title')}</CTATitle>
          <CTASubtitle>{t('homepage:finalCta.subtitle')}</CTASubtitle>
          
          <CTAButton onClick={() => document.querySelector('form').scrollIntoView({ behavior: 'smooth' })}>
            <FaArrowRight aria-hidden="true" />
            {t('homepage:finalCta.button')}
          </CTAButton>
        </ContentContainer>
      </FinalCTASection>
    </>
  );
};

export default HomePage;