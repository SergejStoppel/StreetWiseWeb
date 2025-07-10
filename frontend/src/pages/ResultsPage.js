import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { 
  FaArrowLeft, 
  FaDownload, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaTimesCircle,
  FaInfoCircle,
  FaImage,
  FaWpforms,
  FaLink,
  FaPalette,
  FaCrown,
  FaLock,
  FaStar
} from 'react-icons/fa';
import ScoreCard from '../components/ScoreCard';
import ViolationsList from '../components/ViolationsList';
import RecommendationsList from '../components/RecommendationsList';
import LoadingSpinner from '../components/LoadingSpinner';
import { accessibilityAPI } from '../services/api';

const ResultsContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  
  @media (min-width: 768px) {
    padding: 2rem 2rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
  
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
  gap: 1rem;
  
  @media (max-width: 768px) {
    justify-content: space-between;
  }
`;

const BackButton = styled.button`
  background: var(--color-neutral-500);
  color: var(--color-neutral-0);
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-default);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: var(--color-neutral-600);
    transform: translateY(-1px);
  }
`;

const DownloadButton = styled.button`
  background: ${props => props.premium ? 
    'linear-gradient(135deg, var(--color-warning-500) 0%, var(--color-warning-600) 100%)' :
    'var(--color-primary-500)'};
  color: var(--color-neutral-0);
  padding: 0.5rem 1rem;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-default);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  
  &:hover {
    background: ${props => props.premium ? 
      'linear-gradient(135deg, var(--color-warning-600) 0%, var(--color-warning-700) 100%)' :
      'var(--color-primary-600)'};
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
  }
  
  &:disabled {
    background: var(--color-neutral-300);
    cursor: not-allowed;
    transform: none;
  }
`;

const UpgradeButton = styled.button`
  background: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-secondary-500) 100%);
  color: var(--color-neutral-0);
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-default);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: var(--shadow-lg);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
  }
  
  &:disabled {
    background: var(--color-neutral-300);
    cursor: not-allowed;
    transform: none;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-neutral-800);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const ReportTypeBadge = styled.span`
  background: ${props => props.type === 'detailed' ? 
    'linear-gradient(135deg, var(--color-warning-500) 0%, var(--color-warning-600) 100%)' :
    'var(--color-primary-100)'};
  color: ${props => props.type === 'detailed' ? 
    'var(--color-neutral-0)' : 
    'var(--color-primary-700)'};
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Subtitle = styled.p`
  color: var(--color-neutral-500);
  font-size: 1rem;
  margin-bottom: 0.5rem;
`;

const AnalysisInfo = styled.div`
  display: flex;
  gap: 1rem;
  color: var(--color-neutral-500);
  font-size: 0.875rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.25rem;
  }
`;

const UpgradePrompt = styled.div`
  background: linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-secondary-50) 100%);
  border: 2px solid var(--color-primary-200);
  border-radius: var(--radius-xl);
  padding: 2rem;
  margin: 2rem 0;
  text-align: center;
`;

const UpgradeTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-neutral-800);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const UpgradeDescription = styled.p`
  color: var(--color-neutral-600);
  font-size: 1rem;
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0.75rem;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-neutral-700);
  font-size: 0.875rem;
  
  svg {
    color: var(--color-success-500);
    flex-shrink: 0;
  }
`;


const LockedSection = styled.div`
  background: var(--color-neutral-50);
  border: 2px dashed var(--color-neutral-300);
  border-radius: var(--radius-lg);
  padding: 3rem 2rem;
  text-align: center;
  margin: 2rem 0;
`;

const LockIcon = styled.div`
  font-size: 3rem;
  color: var(--color-neutral-400);
  margin-bottom: 1rem;
`;

const LockedTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-neutral-700);
  margin-bottom: 0.5rem;
`;

const LockedDescription = styled.p`
  color: var(--color-neutral-500);
  margin-bottom: 1.5rem;
`;

const ExcellentAccessibilitySection = styled.div`
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 2px solid #10b981;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  margin: 1rem 0;
`;

const ExcellentIcon = styled.div`
  font-size: 4rem;
  color: #10b981;
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
`;

const ExcellentTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #065f46;
  margin-bottom: 1rem;
`;

const ExcellentDescription = styled.p`
  color: #047857;
  font-size: 1.1rem;
  margin-bottom: 1rem;
  line-height: 1.6;
  
  &:last-child {
    margin-bottom: 0;
    font-weight: 600;
  }
`;

const ScoresSection = styled.section`
  margin-bottom: 3rem;
`;

const ScoresGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const SummarySection = styled.section`
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 3rem;
`;

const SummaryTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const SummaryCard = styled.div`
  text-align: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
`;

const SummaryIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: ${props => props.color || '#6b7280'};
`;

const SummaryValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
`;

const SummaryLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const Section = styled.section`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const NoResultsMessage = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
`;

const NoResultsTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const NoResultsText = styled.p`
  margin-bottom: 2rem;
`;

// Color Contrast Analysis Components
const ColorContrastOverview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ContrastCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const ContrastValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.color || '#374151'};
  margin-bottom: 0.5rem;
`;

const ContrastLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

const ContrastDescription = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
`;

const ViolationExample = styled.div`
  background: #fef7f7;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 1rem;
  margin: 0.5rem 0;
`;

const ViolationMessage = styled.div`
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const ViolationRatio = styled.div`
  font-size: 0.75rem;
  color: #dc2626;
  font-family: 'Courier New', monospace;
`;

const ColorContrastSection = ({ analysis }) => {
  const { t } = useTranslation('dashboard');
  
  if (!analysis || analysis.totalViolations === 0) {
    return null;
  }

  return (
    <>
      <ColorContrastOverview>
        <ContrastCard>
          <ContrastValue color="#dc2626">{analysis.totalViolations}</ContrastValue>
          <ContrastLabel>{t('colorContrast.totalViolations')}</ContrastLabel>
          <ContrastDescription>{t('colorContrast.totalDescription')}</ContrastDescription>
        </ContrastCard>
        
        <ContrastCard>
          <ContrastValue color="#dc2626">{analysis.aaViolations}</ContrastValue>
          <ContrastLabel>{t('colorContrast.aaViolations')}</ContrastLabel>
          <ContrastDescription>{t('colorContrast.aaDescription')}</ContrastDescription>
        </ContrastCard>
        
        <ContrastCard>
          <ContrastValue color="#f59e0b">{analysis.aaaViolations || 0}</ContrastValue>
          <ContrastLabel>{t('colorContrast.aaaViolations')}</ContrastLabel>
          <ContrastDescription>{t('colorContrast.aaaDescription')}</ContrastDescription>
        </ContrastCard>
        
        {analysis.summary && (
          <ContrastCard>
            <ContrastValue color={analysis.summary.aaComplianceLevel >= 90 ? '#10b981' : '#dc2626'}>
              {analysis.summary.aaComplianceLevel}%
            </ContrastValue>
            <ContrastLabel>{t('colorContrast.aaCompliance')}</ContrastLabel>
            <ContrastDescription>{t('colorContrast.complianceDescription')}</ContrastDescription>
          </ContrastCard>
        )}
      </ColorContrastOverview>

      {/* Simplified actionable guidance instead of repetitive examples */}
      {analysis.violations && analysis.violations.colorContrast && analysis.violations.colorContrast.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', color: '#374151' }}>
            {t('colorContrast.actionGuidance')}
          </h4>
          <div style={{ 
            background: '#fef7f7', 
            border: '1px solid #fecaca', 
            borderRadius: '8px', 
            padding: '1.5rem',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#dc2626', fontWeight: '600', marginBottom: '0.5rem' }}>
              {t('colorContrast.mainIssue')}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
              {t('colorContrast.elementsToFixWeb', { count: analysis.aaViolations })}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: '1.5' }}>
              {t('colorContrast.howToFixWeb')}
            </div>
          </div>
          
          <div style={{ 
            background: '#f0f9ff', 
            border: '1px solid #bfdbfe', 
            borderRadius: '6px', 
            padding: '1rem'
          }}>
            <div style={{ fontSize: '0.8125rem', color: '#1e40af', fontWeight: '600', marginBottom: '0.5rem' }}>
              💡 {t('colorContrast.quickTip')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#475569' }}>
              {t('colorContrast.quickTipDetails')}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ResultsPage = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgradingToDetailed, setUpgradingToDetailed] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const navigate = useNavigate();
  const { i18n, t } = useTranslation('dashboard');

  useEffect(() => {
    const storedResults = sessionStorage.getItem('analysisResult');
    
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults);
        setResults(parsedResults);
      } catch (error) {
        console.error('Error parsing stored results:', error);
        toast.error(t('results.messages.errorLoadingResults'));
      }
    } else {
      toast.info(t('results.messages.noResultsFound'));
    }
    
    setLoading(false);
  }, []);

  const handleBack = () => {
    navigate('/');
  };

  const handleUpgradeToDetailed = async () => {
    if (!results) return;
    
    setUpgradingToDetailed(true);
    
    try {
      toast.info(t('results.messages.loadingDetailedReport'), { autoClose: 2000 });
      
      const detailedResult = await accessibilityAPI.getDetailedReport(results.analysisId, i18n.language);
      
      if (detailedResult.success) {
        setResults(detailedResult.data);
        sessionStorage.setItem('analysisResult', JSON.stringify(detailedResult.data));
        toast.success(t('results.messages.detailedReportLoaded'));
      } else {
        toast.error(t('results.messages.failedLoadDetailedReport'));
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error(error.message || t('results.messages.failedLoadDetailedReport'));
    } finally {
      setUpgradingToDetailed(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!results) return;
    
    setDownloadingPDF(true);
    
    try {
      toast.info(t('results.messages.downloadingPdfReport'), { autoClose: 2000 });
      
      await accessibilityAPI.downloadPDF(results.analysisId, i18n.language);
      toast.success(t('results.messages.pdfReportDownloaded'));
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error(error.message || t('results.messages.failedDownloadPdf'));
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDownload = async () => {
    if (!results) return;
    
    // Only detailed reports can be downloaded as PDF
    if (results.reportType === 'detailed') {
      return handleDownloadPDF();
    }
    
    // Overview reports don't have download functionality
    toast.info(t('results.messages.downloadAvailableInDetailed'));
  };

  if (loading) {
    return (
      <ResultsContainer>
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <LoadingSpinner size="large" />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading results...</p>
        </div>
      </ResultsContainer>
    );
  }

  if (!results) {
    return (
      <ResultsContainer>
        <NoResultsMessage>
          <NoResultsTitle>{t('results.noResults.title')}</NoResultsTitle>
          <NoResultsText>
            {t('results.noResults.description')}
          </NoResultsText>
          <BackButton onClick={handleBack}>
            <FaArrowLeft />
            {t('results.buttons.backToHome')}
          </BackButton>
        </NoResultsMessage>
      </ResultsContainer>
    );
  }

  return (
    <ResultsContainer>
      <Header>
        <HeaderLeft>
          <Title>
            {t('results.title')}
            <ReportTypeBadge type={results.reportType}>
              {results.reportType === 'detailed' ? (
                <>
                  <FaCrown /> {t('results.reportTypes.premiumReport')}
                </>
              ) : (
                t('results.reportTypes.overviewReport')
              )}
            </ReportTypeBadge>
          </Title>
          <Subtitle>{results.url}</Subtitle>
          <AnalysisInfo>
            <span>{t('results.analysisId')}: {results.analysisId}</span>
            <span>•</span>
            <span>{t('results.generated')}: {new Date(results.timestamp).toLocaleString()}</span>
          </AnalysisInfo>
        </HeaderLeft>
        <HeaderRight>
          <BackButton onClick={handleBack}>
            <FaArrowLeft />
            {t('results.buttons.backToHome')}
          </BackButton>
          
          {results.reportType === 'detailed' ? (
            <DownloadButton 
              premium 
              onClick={handleDownload} 
              disabled={downloadingPDF}
            >
              {downloadingPDF ? (
                <>
                  <LoadingSpinner size="small" />
                  {t('results.messages.generatingPdf')}
                </>
              ) : (
                <>
                  <FaDownload />
                  {t('results.buttons.downloadPdfReport')}
                </>
              )}
            </DownloadButton>
          ) : (
            <UpgradeButton 
              onClick={handleUpgradeToDetailed}
              disabled={upgradingToDetailed}
            >
              {upgradingToDetailed ? (
                <>
                  <LoadingSpinner size="small" />
                  {t('results.messages.upgrading')}
                </>
              ) : (
                <>
                  <FaCrown />
                  {t('results.buttons.getDetailedReportPdf')}
                </>
              )}
            </UpgradeButton>
          )}
        </HeaderRight>
      </Header>

      <ScoresSection>
        <ScoresGrid>
          <ScoreCard
            title={t('results.scores.accessibilityTitle')}
            score={results.scores.overall}
            description={t('results.scores.accessibilityDescription')}
            color={results.scores.overall >= 80 ? '#10b981' : results.scores.overall >= 60 ? '#f59e0b' : '#ef4444'}
          />
        </ScoresGrid>
      </ScoresSection>

      <SummarySection>
        <SummaryTitle>{t('results.summary.title')}</SummaryTitle>
        <SummaryGrid>
          <SummaryCard>
            <SummaryIcon color="#ef4444">
              <FaTimesCircle />
            </SummaryIcon>
            <SummaryValue>{results.summary.totalViolations}</SummaryValue>
            <SummaryLabel>{t('results.summary.totalViolations')}</SummaryLabel>
          </SummaryCard>
          
          <SummaryCard>
            <SummaryIcon color="#dc2626">
              <FaExclamationTriangle />
            </SummaryIcon>
            <SummaryValue>{results.summary.criticalViolations}</SummaryValue>
            <SummaryLabel>{t('results.summary.criticalIssues')}</SummaryLabel>
          </SummaryCard>
          
          <SummaryCard>
            <SummaryIcon color="#f59e0b">
              <FaInfoCircle />
            </SummaryIcon>
            <SummaryValue>{results.summary.seriousViolations}</SummaryValue>
            <SummaryLabel>{t('results.summary.seriousIssues')}</SummaryLabel>
          </SummaryCard>
          
          <SummaryCard>
            <SummaryIcon color="#6b7280">
              <FaImage />
            </SummaryIcon>
            <SummaryValue>{results.summary.imagesWithoutAlt}</SummaryValue>
            <SummaryLabel>{t('results.summary.imagesWithoutAlt')}</SummaryLabel>
          </SummaryCard>
          
          <SummaryCard>
            <SummaryIcon color="#6b7280">
              <FaWpforms />
            </SummaryIcon>
            <SummaryValue>{results.summary.formsWithoutLabels}</SummaryValue>
            <SummaryLabel>{t('results.summary.unlabeledFormFields')}</SummaryLabel>
          </SummaryCard>
          
          <SummaryCard>
            <SummaryIcon color="#6b7280">
              <FaLink />
            </SummaryIcon>
            <SummaryValue>{results.summary.emptyLinks}</SummaryValue>
            <SummaryLabel>{t('results.summary.emptyLinks')}</SummaryLabel>
          </SummaryCard>
          
          <SummaryCard>
            <SummaryIcon color="#dc2626">
              <FaPalette />
            </SummaryIcon>
            <SummaryValue>{results.summary.colorContrastViolations || 0}</SummaryValue>
            <SummaryLabel>{t('results.summary.colorContrastIssues')}</SummaryLabel>
          </SummaryCard>
        </SummaryGrid>
      </SummarySection>

      <Section>
        <SectionTitle>{t('results.sections.recommendations')}</SectionTitle>
        <RecommendationsList recommendations={results.recommendations} />
      </Section>

      {results.reportType === 'detailed' ? (
        <>
          {/* Color Contrast Analysis for detailed reports */}
          {results.colorContrastAnalysis && results.colorContrastAnalysis.totalViolations > 0 && (
            <Section>
              <SectionTitle>{t('results.sections.colorContrastAnalysis')}</SectionTitle>
              <ColorContrastSection analysis={results.colorContrastAnalysis} />
            </Section>
          )}
          
          {/* Full violations list */}
          {results.axeResults && (
            <Section>
              <SectionTitle>{t('results.sections.accessibilityViolations')}</SectionTitle>
              <ViolationsList violations={results.axeResults.violations} />
            </Section>
          )}
        </>
      ) : (
        // Overview report shows very limited information
        <>
          {results.summary.hasExcellentAccessibility ? (
            // Show excellent accessibility message
            <Section>
              <SectionTitle>{t('results.sections.excellentAccessibility')}</SectionTitle>
              <ExcellentAccessibilitySection>
                <ExcellentIcon>
                  <FaCheckCircle />
                </ExcellentIcon>
                <ExcellentTitle>
                  {t('results.excellent.title')}
                </ExcellentTitle>
                <ExcellentDescription>
                  {t('results.excellent.description')}
                </ExcellentDescription>
                <ExcellentDescription>
                  {t('results.excellent.noUpgradeNeeded')}
                </ExcellentDescription>
              </ExcellentAccessibilitySection>
            </Section>
          ) : results.issuePreview && results.issuePreview.hasViolations ? (
            <Section>
              <SectionTitle>{t('results.sections.issuesFound')}</SectionTitle>
              <LockedSection>
                <LockIcon>
                  <FaLock />
                </LockIcon>
                <LockedTitle>
                  {t('results.issuePreview.criticalAndSeriousIssues', { critical: results.issuePreview.criticalIssues, serious: results.issuePreview.seriousIssues })}
                </LockedTitle>
                <LockedDescription>
                  {t('results.issuePreview.categoriesDetected', { categories: results.issuePreview.categories.join(', ') })}. 
                  {t('results.issuePreview.getDetailedReport')}
                </LockedDescription>
                <UpgradeButton 
                  onClick={handleUpgradeToDetailed}
                  disabled={upgradingToDetailed}
                >
                  {upgradingToDetailed ? (
                    <>
                      <LoadingSpinner size="small" />
                      {t('results.messages.loadingDetails')}
                    </>
                  ) : (
                    <>
                      <FaLock />
                      {t('results.buttons.unlockFullAnalysis')}
                    </>
                  )}
                </UpgradeButton>
              </LockedSection>
            </Section>
          ) : null}
          
          {results.upgradeInfo && !results.summary.hasExcellentAccessibility && (
            <UpgradePrompt>
              <UpgradeTitle>
                <FaCrown />
                {t('results.upgradePrompt.title')}
              </UpgradeTitle>
              <UpgradeDescription>
                {t('results.upgradePrompt.description')}
              </UpgradeDescription>
              
              <FeatureList>
                {results.upgradeInfo.features.map((feature, index) => (
                  <FeatureItem key={index}>
                    <FaCheckCircle />
                    {feature}
                  </FeatureItem>
                ))}
              </FeatureList>
              
              <UpgradeButton 
                onClick={handleUpgradeToDetailed}
                disabled={upgradingToDetailed}
              >
                {upgradingToDetailed ? (
                  <>
                    <LoadingSpinner size="small" />
                    {t('results.messages.generatingDetailedReport')}
                  </>
                ) : (
                  <>
                    <FaStar />
                    {t('results.buttons.upgradeToDetailedReport')}
                  </>
                )}
              </UpgradeButton>
            </UpgradePrompt>
          )}
          
          <LockedSection>
            <LockIcon>
              <FaLock />
            </LockIcon>
            <LockedTitle>{t('results.lockedSection.title')}</LockedTitle>
            <LockedDescription>
              {t('results.lockedSection.description')}
            </LockedDescription>
            <UpgradeButton 
              onClick={handleUpgradeToDetailed}
              disabled={upgradingToDetailed}
            >
              {upgradingToDetailed ? (
                <>
                  <LoadingSpinner size="small" />
                  {t('results.messages.upgrading')}
                </>
              ) : (
                <>
                  <FaCrown />
                  {t('results.buttons.getDetailedReport')}
                </>
              )}
            </UpgradeButton>
          </LockedSection>
        </>
      )}
    </ResultsContainer>
  );
};

export default ResultsPage;