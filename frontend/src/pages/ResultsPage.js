import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { 
  FaArrowLeft, 
  FaDownload, 
  FaShare,
  FaGlobe,
  FaCalendarAlt,
  FaIdBadge
} from 'react-icons/fa';

// Import new modular components
import OverviewSection from '../components/results/OverviewSection';
import PriorityFixesSection from '../components/results/PriorityFixesSection';
import UpgradeSection from '../components/results/UpgradeSection';
import DetailedAnalysisSection from '../components/results/DetailedAnalysisSection';
import LoadingSpinner from '../components/LoadingSpinner';
import { accessibilityAPI } from '../services/api';

const ResultsContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-2xl) var(--spacing-lg);
  
  @media (min-width: 768px) {
    padding: var(--spacing-2xl);
  }
`;

const Header = styled.div`
  background: var(--color-surface-elevated);
  padding: var(--spacing-2xl);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--spacing-2xl);
  border: 1px solid var(--color-border-primary);
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-lg);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const HeaderLeft = styled.div`
  flex: 1;
`;

const HeaderRight = styled.div`
  display: flex;
  gap: var(--spacing-md);
  
  @media (max-width: 768px) {
    justify-content: space-between;
  }
`;

const PageTitle = styled.h1`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  font-family: var(--font-family-primary);
`;

const PageSubtitle = styled.p`
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
  font-family: var(--font-family-secondary);
`;

const WebsiteInfo = styled.div`
  background: var(--color-surface-primary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-primary);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
`;

const InfoIcon = styled.div`
  font-size: var(--font-size-lg);
  color: var(--color-text-tertiary);
`;

const InfoLabel = styled.span`
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-primary);
`;

const InfoValue = styled.span`
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-family: var(--font-family-secondary);
`;

const ActionButton = styled.button`
  background: ${props => props.primary ? 'var(--color-interactive-primary)' : 'var(--color-surface-secondary)'};
  color: ${props => props.primary ? 'var(--color-text-on-brand)' : 'var(--color-text-primary)'};
  padding: var(--spacing-md) var(--spacing-lg);
  border: ${props => props.primary ? 'none' : '2px solid var(--color-border-primary)'};
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
  box-shadow: ${props => props.primary ? 'var(--shadow-md)' : 'none'};
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.primary ? 'var(--shadow-lg)' : 'var(--shadow-md)'};
    background: ${props => props.primary ? 'var(--color-interactive-primary-hover)' : 'var(--color-surface-elevated)'};
  }
  
  @media (max-width: 768px) {
    flex: 1;
    justify-content: center;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
`;

const LoadingText = styled.p`
  margin-top: var(--spacing-lg);
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  font-family: var(--font-family-secondary);
`;

const ErrorContainer = styled.div`
  background: var(--color-error-100);
  border: 1px solid var(--color-error-300);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  text-align: center;
`;

const ErrorText = styled.p`
  color: var(--color-error-700);
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-lg);
  font-family: var(--font-family-secondary);
`;

const ResultsPage = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPremium, setIsPremium] = useState(false); // This would come from user subscription
  const navigate = useNavigate();
  const { t } = useTranslation(['results', 'common']);

  useEffect(() => {
    const loadAnalysisData = () => {
      try {
        // Get analysis data from sessionStorage (set by HomePage)
        const storedData = sessionStorage.getItem('analysisResult');
        if (!storedData) {
          setError('No analysis data found. Please run a new analysis.');
          setLoading(false);
          return;
        }

        const data = JSON.parse(storedData);
        setAnalysisData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading analysis data:', err);
        setError('Error loading analysis results. Please try again.');
        setLoading(false);
      }
    };

    loadAnalysisData();
  }, []);

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleDownloadReport = () => {
    if (!analysisData) return;
    
    // TODO: Implement PDF download
    toast.info('PDF download will be available soon');
  };

  const handleShareReport = () => {
    if (!analysisData) return;
    
    // TODO: Implement report sharing
    toast.info('Report sharing will be available soon');
  };

  const handleAnalyzeAnother = () => {
    // Clear stored data and go back to home
    sessionStorage.removeItem('analysisResult');
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <ResultsContainer>
        <LoadingContainer>
          <LoadingSpinner size="large" />
          <LoadingText>Loading your website analysis...</LoadingText>
        </LoadingContainer>
      </ResultsContainer>
    );
  }

  if (error) {
    return (
      <ResultsContainer>
        <ErrorContainer>
          <ErrorText>{error}</ErrorText>
          <ActionButton primary onClick={handleBackToHome}>
            <FaArrowLeft />
            Back to Home
          </ActionButton>
        </ErrorContainer>
      </ResultsContainer>
    );
  }

  return (
    <ResultsContainer>
      {/* Header Section */}
      <Header>
        <HeaderTop>
          <HeaderLeft>
            <PageTitle>{t('results:pageTitle')}</PageTitle>
            <PageSubtitle>{t('results:pageSubtitle')}</PageSubtitle>
          </HeaderLeft>
          
          <HeaderRight>
            <ActionButton onClick={handleBackToHome}>
              <FaArrowLeft />
              {t('results:actions.backToHome')}
            </ActionButton>
            
            <ActionButton onClick={handleDownloadReport}>
              <FaDownload />
              {t('results:actions.downloadReport')}
            </ActionButton>
            
            <ActionButton onClick={handleShareReport}>
              <FaShare />
              {t('results:actions.shareReport')}
            </ActionButton>
          </HeaderRight>
        </HeaderTop>

        {/* Website Metadata */}
        <WebsiteInfo>
          <InfoItem>
            <InfoIcon><FaGlobe /></InfoIcon>
            <InfoLabel>{t('results:metadata.websiteUrl')}:</InfoLabel>
            <InfoValue>{analysisData?.url || analysisData?.metadata?.url || 'N/A'}</InfoValue>
          </InfoItem>
          
          <InfoItem>
            <InfoIcon><FaCalendarAlt /></InfoIcon>
            <InfoLabel>{t('results:metadata.analyzedOn')}:</InfoLabel>
            <InfoValue>{formatDate(analysisData?.timestamp || analysisData?.metadata?.timestamp)}</InfoValue>
          </InfoItem>
          
          <InfoItem>
            <InfoIcon><FaIdBadge /></InfoIcon>
            <InfoLabel>{t('results:metadata.reportId')}:</InfoLabel>
            <InfoValue>{(analysisData?.analysisId || analysisData?.metadata?.analysisId)?.substring(0, 8) || 'N/A'}</InfoValue>
          </InfoItem>
        </WebsiteInfo>
      </Header>

      {/* Main Content Sections */}
      
      {/* 1. Free Overview Section */}
      <OverviewSection analysisData={analysisData} />
      
      {/* 2. Priority Fixes Section */}
      <PriorityFixesSection analysisData={analysisData} />
      
      {/* 3. Upgrade Section (for free users) */}
      {!isPremium && <UpgradeSection analysisData={analysisData} />}
      
      {/* 4. Detailed Analysis Section (for premium users) */}
      {isPremium && <DetailedAnalysisSection analysisData={analysisData} isPremium={isPremium} />}

      {/* Bottom Actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: 'var(--spacing-lg)', 
        marginTop: 'var(--spacing-2xl)',
        flexWrap: 'wrap'
      }}>
        <ActionButton primary onClick={handleAnalyzeAnother}>
          <FaGlobe />
          {t('results:actions.analyzeAnother')}
        </ActionButton>
      </div>
    </ResultsContainer>
  );
};

export default ResultsPage;