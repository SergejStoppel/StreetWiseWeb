import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { 
  FaAccessibleIcon, 
  FaSearch, 
  FaRocket, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaTimes,
  FaSpinner,
  FaEye
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { analysisAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ScreenshotDisplay from '../components/ScreenshotDisplay';

const ResultsContainer = styled.div`
  min-height: calc(100vh - 160px);
  background: linear-gradient(135deg, var(--color-surface-secondary) 0%, var(--color-surface-primary) 100%);
  padding: var(--spacing-2xl) var(--spacing-xl);
  
  @media (max-width: 768px) {
    padding: var(--spacing-xl) var(--spacing-md);
  }
`;

const ContentContainer = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
`;

const HeaderSection = styled.div`
  text-align: center;
  margin-bottom: var(--spacing-2xl);
`;

const Title = styled.h1`
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  font-family: var(--font-family-primary);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-3xl);
  }
`;

const Subtitle = styled.p`
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  font-family: var(--font-family-secondary);
`;

const ResultCard = styled.div`
  background: var(--color-surface-elevated);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border-primary);
  overflow: hidden;
  margin-bottom: var(--spacing-xl);
`;

const CardHeader = styled.div`
  padding: var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-interactive-primary) 0%, var(--color-interactive-primary-hover) 100%);
  color: var(--color-text-inverse);
`;

const WebsiteUrl = styled.h2`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-sm);
  word-break: break-all;
`;

const AnalysisInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  background: ${props => {
    switch (props.$status) {
      case 'completed': return 'var(--color-success)';
      case 'processing': return 'var(--color-warning)';
      case 'failed': return 'var(--color-error)';
      default: return 'var(--color-text-tertiary)';
    }
  }};
  color: white;
`;

const ScoresGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
`;

const ScoreCard = styled.div`
  text-align: center;
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
  background: var(--color-surface-primary);
  border: 1px solid var(--color-border-secondary);
`;

const ScoreValue = styled.div`
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  color: ${props => {
    if (props.$score >= 80) return 'var(--color-success)';
    if (props.$score >= 60) return 'var(--color-warning)';
    return 'var(--color-error)';
  }};
  margin-bottom: var(--spacing-sm);
`;

const ScoreLabel = styled.div`
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
`;

const ActionsSection = styled.div`
  padding: var(--spacing-xl);
  background: var(--color-surface-secondary);
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  
  &.primary {
    background: var(--color-interactive-primary);
    color: var(--color-text-on-brand);
    
    &:hover {
      background: var(--color-interactive-primary-hover);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
  }
  
  &.secondary {
    background: var(--color-surface-elevated);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-primary);
    
    &:hover {
      background: var(--color-surface-secondary);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: var(--spacing-4xl);
`;

const ErrorState = styled.div`
  text-align: center;
  padding: var(--spacing-4xl);
  color: var(--color-error);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--spacing-4xl);
  color: var(--color-text-secondary);
`;



const ResultsPage = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { t } = useTranslation(['results', 'common']);

  useEffect(() => {
    // Get analysis data from sessionStorage
    const storedResult = sessionStorage.getItem('analysisResult');
    
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult);
        setAnalysisData(parsedResult);
        
        // If we have an analysis ID, start polling for updates
        if (parsedResult?.id) {
          pollForResults(parsedResult.id);
        } else {
          setLoading(false);
        }
      } catch (parseError) {
        console.error('Failed to parse stored analysis result:', parseError);
        setError('Failed to load analysis results');
        setLoading(false);
      }
    } else {
      setError('No analysis results found. Please run a new analysis.');
      setLoading(false);
    }
  }, []);

  const pollForResults = async (analysisId) => {
    let attempts = 0;
    const maxAttempts = 60; // Poll for up to 5 minutes (5 second intervals)
    
    const poll = async () => {
      try {
        attempts++;
        console.log(`Polling attempt ${attempts}/${maxAttempts} for analysis ${analysisId}`);
        
        const response = await analysisAPI.getById(analysisId);
        if (response.success && response.data) {
          const updatedData = response.data;
          setAnalysisData(updatedData);
          
          // Check if analysis is complete
          if (updatedData.status === 'completed' || updatedData.status === 'failed' || updatedData.status === 'completed_with_errors') {
            console.log('Analysis completed with status:', updatedData.status);
            setLoading(false);
            return;
          }
          
          // Continue polling if still processing and haven't exceeded max attempts
          if (attempts < maxAttempts && (updatedData.status === 'pending' || updatedData.status === 'processing')) {
            setTimeout(poll, 5000); // Poll every 5 seconds
          } else {
            console.log('Max polling attempts reached or unexpected status');
            setLoading(false);
          }
        } else {
          if (attempts < maxAttempts) {
            setTimeout(poll, 5000);
          } else {
            setError('Analysis results not available. Please try again.');
            setLoading(false);
          }
        }
      } catch (fetchError) {
        console.warn(`Polling attempt ${attempts} failed:`, fetchError);
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          setError('Failed to fetch analysis results. Please try again.');
          setLoading(false);
        }
      }
    };
    
    // Start polling immediately
    poll();
  };

  const fetchAnalysisData = async (analysisId) => {
    try {
      const response = await analysisAPI.getById(analysisId);
      if (response.success) {
        setAnalysisData(response.data);
      }
    } catch (fetchError) {
      console.warn('Failed to fetch fresh analysis data:', fetchError);
      // Don't set error here since we have cached data
    }
  };

  const handleViewDetailedReport = () => {
    if (analysisData?.id) {
      navigate(`/results/${analysisData.id}`);
    }
  };

  const handleRunNewAnalysis = () => {
    sessionStorage.removeItem('analysisResult');
    navigate('/');
  };

  if (loading) {
    return (
      <ResultsContainer>
        <ContentContainer>
          <LoadingState>
            <LoadingSpinner size="large" />
            <Title>Loading Results...</Title>
            <Subtitle>Please wait while we prepare your analysis results.</Subtitle>
          </LoadingState>
        </ContentContainer>
      </ResultsContainer>
    );
  }

  if (error) {
    return (
      <ResultsContainer>
        <ContentContainer>
          <ErrorState>
            <FaTimes size={64} style={{ marginBottom: 'var(--spacing-lg)' }} />
            <Title>No Results Found</Title>
            <Subtitle>{error}</Subtitle>
            <ActionButton className="primary" onClick={handleRunNewAnalysis}>
              <FaRocket />
              Run New Analysis
            </ActionButton>
          </ErrorState>
        </ContentContainer>
      </ResultsContainer>
    );
  }

  if (!analysisData) {
    return (
      <ResultsContainer>
        <ContentContainer>
          <EmptyState>
            <FaSearch size={64} style={{ marginBottom: 'var(--spacing-lg)' }} />
            <Title>No Analysis Data</Title>
            <Subtitle>No analysis results were found.</Subtitle>
            <ActionButton className="primary" onClick={handleRunNewAnalysis}>
              <FaRocket />
              Run New Analysis
            </ActionButton>
          </EmptyState>
        </ContentContainer>
      </ResultsContainer>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FaCheckCircle />;
      case 'processing': return <FaSpinner className="fa-spin" />;
      case 'failed': return <FaTimes />;
      default: return <FaExclamationTriangle />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'processing': return 'Processing';
      case 'failed': return 'Failed';
      case 'completed_with_errors': return 'Completed with Issues';
      default: return 'Unknown';
    }
  };



  // Extract URL from website data or use a placeholder
  const websiteUrl = analysisData.websites?.url || analysisData.url || 'Unknown Website';
  
  // Prioritize calculated scores over stored database scores to ensure consistency
  const scores = {
    overall: analysisData.scores?.overall ?? analysisData.overall_score ?? 0,
    accessibility: analysisData.scores?.accessibility ?? analysisData.accessibility_score ?? 0,
    seo: analysisData.scores?.seo ?? analysisData.seo_score ?? 0,
    performance: analysisData.scores?.performance ?? analysisData.performance_score ?? 0
  };

  return (
    <ResultsContainer>
      <ContentContainer>
        <HeaderSection>
          <Title>Analysis Results</Title>
          <Subtitle>Your website accessibility and performance analysis is complete</Subtitle>
        </HeaderSection>

        <ResultCard>
          <CardHeader>
            <WebsiteUrl>{websiteUrl}</WebsiteUrl>
            <AnalysisInfo>
              <StatusBadge $status={analysisData.status}>
                {getStatusIcon(analysisData.status)}
                {getStatusText(analysisData.status)}
              </StatusBadge>
              <div>
                Analysis ID: {analysisData.id?.slice(0, 8)}...
              </div>
            </AnalysisInfo>
            
            {/* Screenshots in Header - only show after loading completes to ensure signed URLs are available */}
            {!loading && analysisData.screenshots && analysisData.screenshots.length > 0 && (
              <ScreenshotDisplay screenshots={analysisData.screenshots} />
            )}
          </CardHeader>

          <ScoresGrid>
            <ScoreCard>
              <ScoreValue $score={scores.overall}>{scores.overall}/100</ScoreValue>
              <ScoreLabel>
                <FaCheckCircle style={{ marginRight: 'var(--spacing-xs)' }} />
                Overall Score
              </ScoreLabel>
            </ScoreCard>
            
            <ScoreCard>
              <ScoreValue $score={scores.accessibility}>{scores.accessibility}/100</ScoreValue>
              <ScoreLabel>
                <FaAccessibleIcon style={{ marginRight: 'var(--spacing-xs)' }} />
                Accessibility
              </ScoreLabel>
            </ScoreCard>
            
            <ScoreCard>
              <ScoreValue $score={scores.seo}>{scores.seo}/100</ScoreValue>
              <ScoreLabel>
                <FaSearch style={{ marginRight: 'var(--spacing-xs)' }} />
                SEO
              </ScoreLabel>
            </ScoreCard>
            
            <ScoreCard>
              <ScoreValue $score={scores.performance}>{scores.performance}/100</ScoreValue>
              <ScoreLabel>
                <FaRocket style={{ marginRight: 'var(--spacing-xs)' }} />
                Performance
              </ScoreLabel>
            </ScoreCard>
          </ScoresGrid>



          <ActionsSection>
            <ActionButton className="primary" onClick={handleViewDetailedReport}>
              <FaEye />
              View Detailed Report
            </ActionButton>
            <ActionButton className="secondary" onClick={handleRunNewAnalysis}>
              <FaRocket />
              Run New Analysis
            </ActionButton>
          </ActionsSection>
        </ResultCard>
      </ContentContainer>


    </ResultsContainer>
  );
};

export default ResultsPage;