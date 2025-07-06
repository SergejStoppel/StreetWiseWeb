import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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
  FaHeading,
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

const LimitedContentOverlay = styled.div`
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100px;
    background: linear-gradient(transparent, var(--color-neutral-0));
    pointer-events: none;
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

const ResultsPage = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgradingToDetailed, setUpgradingToDetailed] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedResults = sessionStorage.getItem('analysisResult');
    
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults);
        setResults(parsedResults);
      } catch (error) {
        console.error('Error parsing stored results:', error);
        toast.error('Error loading analysis results');
      }
    } else {
      toast.info('No analysis results found. Please run an analysis first.');
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
      toast.info('Loading detailed report...', { autoClose: 2000 });
      
      const detailedResult = await accessibilityAPI.getDetailedReport(results.analysisId);
      
      if (detailedResult.success) {
        setResults(detailedResult.data);
        sessionStorage.setItem('analysisResult', JSON.stringify(detailedResult.data));
        toast.success('Detailed report loaded successfully!');
      } else {
        toast.error('Failed to load detailed report');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error(error.message || 'Failed to load detailed report');
    } finally {
      setUpgradingToDetailed(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!results) return;
    
    setDownloadingPDF(true);
    
    try {
      toast.info('Downloading PDF report...', { autoClose: 2000 });
      
      await accessibilityAPI.downloadPDF(results.analysisId);
      toast.success('PDF report downloaded successfully!');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error(error.message || 'Failed to download PDF report');
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
    toast.info('Download is available in the detailed report. Click "Get Detailed Report & PDF" to upgrade.');
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
          <NoResultsTitle>No Analysis Results Found</NoResultsTitle>
          <NoResultsText>
            It looks like you haven't run an accessibility analysis yet, or the results have expired.
          </NoResultsText>
          <BackButton onClick={handleBack}>
            <FaArrowLeft />
            Back to Home
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
            Accessibility Analysis Results
            <ReportTypeBadge type={results.reportType}>
              {results.reportType === 'detailed' ? (
                <>
                  <FaCrown /> Premium Report
                </>
              ) : (
                'Overview Report'
              )}
            </ReportTypeBadge>
          </Title>
          <Subtitle>{results.url}</Subtitle>
          <AnalysisInfo>
            <span>Analysis ID: {results.analysisId}</span>
            <span>•</span>
            <span>Generated: {new Date(results.timestamp).toLocaleString()}</span>
          </AnalysisInfo>
        </HeaderLeft>
        <HeaderRight>
          <BackButton onClick={handleBack}>
            <FaArrowLeft />
            Back to Home
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
                  Generating PDF...
                </>
              ) : (
                <>
                  <FaDownload />
                  Download PDF Report
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
                  Upgrading...
                </>
              ) : (
                <>
                  <FaCrown />
                  Get Detailed Report & PDF
                </>
              )}
            </UpgradeButton>
          )}
        </HeaderRight>
      </Header>

      <ScoresSection>
        <ScoresGrid>
          <ScoreCard
            title="Overall Score"
            score={results.scores.overall}
            description="Combined accessibility and usability score"
            color={results.scores.overall >= 80 ? '#10b981' : results.scores.overall >= 60 ? '#f59e0b' : '#ef4444'}
          />
          <ScoreCard
            title="Accessibility Score"
            score={results.scores.accessibility}
            description="WCAG compliance and accessibility issues"
            color={results.scores.accessibility >= 80 ? '#10b981' : results.scores.accessibility >= 60 ? '#f59e0b' : '#ef4444'}
          />
          <ScoreCard
            title="Custom Score"
            score={results.scores.custom}
            description="Additional usability and best practices"
            color={results.scores.custom >= 80 ? '#10b981' : results.scores.custom >= 60 ? '#f59e0b' : '#ef4444'}
          />
        </ScoresGrid>
      </ScoresSection>

      <SummarySection>
        <SummaryTitle>Issues Summary</SummaryTitle>
        <SummaryGrid>
          <SummaryCard>
            <SummaryIcon color="#ef4444">
              <FaTimesCircle />
            </SummaryIcon>
            <SummaryValue>{results.summary.totalViolations}</SummaryValue>
            <SummaryLabel>Total Violations</SummaryLabel>
          </SummaryCard>
          
          <SummaryCard>
            <SummaryIcon color="#dc2626">
              <FaExclamationTriangle />
            </SummaryIcon>
            <SummaryValue>{results.summary.criticalViolations}</SummaryValue>
            <SummaryLabel>Critical Issues</SummaryLabel>
          </SummaryCard>
          
          <SummaryCard>
            <SummaryIcon color="#f59e0b">
              <FaInfoCircle />
            </SummaryIcon>
            <SummaryValue>{results.summary.seriousViolations}</SummaryValue>
            <SummaryLabel>Serious Issues</SummaryLabel>
          </SummaryCard>
          
          <SummaryCard>
            <SummaryIcon color="#6b7280">
              <FaImage />
            </SummaryIcon>
            <SummaryValue>{results.summary.imagesWithoutAlt}</SummaryValue>
            <SummaryLabel>Images without Alt Text</SummaryLabel>
          </SummaryCard>
          
          <SummaryCard>
            <SummaryIcon color="#6b7280">
              <FaWpforms />
            </SummaryIcon>
            <SummaryValue>{results.summary.formsWithoutLabels}</SummaryValue>
            <SummaryLabel>Unlabeled Form Fields</SummaryLabel>
          </SummaryCard>
          
          <SummaryCard>
            <SummaryIcon color="#6b7280">
              <FaLink />
            </SummaryIcon>
            <SummaryValue>{results.summary.emptyLinks}</SummaryValue>
            <SummaryLabel>Empty Links</SummaryLabel>
          </SummaryCard>
        </SummaryGrid>
      </SummarySection>

      <Section>
        <SectionTitle>Recommendations</SectionTitle>
        <RecommendationsList recommendations={results.recommendations} />
      </Section>

      {results.reportType === 'detailed' ? (
        // Detailed report shows full violations list
        results.axeResults && (
          <Section>
            <SectionTitle>Accessibility Violations</SectionTitle>
            <ViolationsList violations={results.axeResults.violations} />
          </Section>
        )
      ) : (
        // Overview report shows very limited information
        <>
          {results.issuePreview && results.issuePreview.hasViolations && (
            <Section>
              <SectionTitle>Issues Found</SectionTitle>
              <LockedSection>
                <LockIcon>
                  <FaLock />
                </LockIcon>
                <LockedTitle>
                  {results.issuePreview.criticalIssues} Critical Issues, {results.issuePreview.seriousIssues} Serious Issues Found
                </LockedTitle>
                <LockedDescription>
                  Issues detected in categories: {results.issuePreview.categories.join(', ')}. 
                  Get the detailed report to see specific violations and how to fix them.
                </LockedDescription>
                <UpgradeButton 
                  onClick={handleUpgradeToDetailed}
                  disabled={upgradingToDetailed}
                >
                  {upgradingToDetailed ? (
                    <>
                      <LoadingSpinner size="small" />
                      Loading Details...
                    </>
                  ) : (
                    <>
                      <FaLock />
                      Unlock Full Analysis
                    </>
                  )}
                </UpgradeButton>
              </LockedSection>
            </Section>
          )}
          
          {results.upgradeInfo && (
            <UpgradePrompt>
              <UpgradeTitle>
                <FaCrown />
                Unlock Complete Analysis
              </UpgradeTitle>
              <UpgradeDescription>
                Get the full detailed report with all violations, code examples, 
                implementation guidance, and a professional PDF export.
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
                    Generating Detailed Report...
                  </>
                ) : (
                  <>
                    <FaStar />
                    Upgrade to Detailed Report
                  </>
                )}
              </UpgradeButton>
            </UpgradePrompt>
          )}
          
          <LockedSection>
            <LockIcon>
              <FaLock />
            </LockIcon>
            <LockedTitle>Additional Features Locked</LockedTitle>
            <LockedDescription>
              Detailed analysis, custom checks, performance metrics, and complete 
              violation breakdown are available in the detailed report.
            </LockedDescription>
            <UpgradeButton 
              onClick={handleUpgradeToDetailed}
              disabled={upgradingToDetailed}
            >
              {upgradingToDetailed ? (
                <>
                  <LoadingSpinner size="small" />
                  Upgrading...
                </>
              ) : (
                <>
                  <FaCrown />
                  Get Detailed Report
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