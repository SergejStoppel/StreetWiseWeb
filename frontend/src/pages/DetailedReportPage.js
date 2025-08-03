import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { 
  FaAccessibleIcon, 
  FaSearch, 
  FaRocket, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaTimes,
  FaArrowLeft,
  FaDownload,
  FaEye,
  FaCritical,
  FaExclamationCircle,
  FaInfoCircle,
  FaImage,
  FaCode,
  FaGlobe
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { analysisAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const ReportContainer = styled.div`
  min-height: calc(100vh - 160px);
  background: var(--color-surface-primary);
  padding: var(--spacing-xl);
  
  @media (max-width: 768px) {
    padding: var(--spacing-md);
  }
`;

const ContentContainer = styled.div`
  max-width: var(--container-max-width);
  margin: 0 auto;
`;

const Header = styled.div`
  background: var(--color-surface-elevated);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-2xl);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-primary);
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: var(--color-surface-secondary);
  color: var(--color-text-primary);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-lg);
  transition: all var(--transition-fast);
  
  &:hover {
    background: var(--color-surface-tertiary);
    transform: translateX(-2px);
  }
`;

const Title = styled.h1`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  font-family: var(--font-family-primary);
`;

const WebsiteInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
`;

const WebsiteUrl = styled.div`
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  word-break: break-all;
`;

const AnalysisDate = styled.div`
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
`;

const ScoresOverview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
`;

const ScoreCard = styled.div`
  background: var(--color-surface-elevated);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  text-align: center;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-primary);
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
`;

const Section = styled.div`
  background: var(--color-surface-elevated);
  border-radius: var(--border-radius-xl);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-primary);
  overflow: hidden;
`;

const SectionHeader = styled.div`
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--color-border-secondary);
  background: var(--color-surface-secondary);
`;

const SectionTitle = styled.h2`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
`;

const IssueCount = styled.span`
  background: ${props => {
    if (props.$count === 0) return 'var(--color-success)';
    if (props.$count <= 5) return 'var(--color-warning)';
    return 'var(--color-error)';
  }};
  color: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
`;

const SectionContent = styled.div`
  padding: var(--spacing-xl);
`;

const IssuesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
`;

const IssueCard = styled.div`
  background: var(--color-surface-primary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  border-left: 4px solid ${props => {
    switch (props.$severity) {
      case 'critical': return 'var(--color-error)';
      case 'high': return 'var(--color-warning)';
      case 'medium': return 'var(--color-info)';
      case 'low': return 'var(--color-success)';
      default: return 'var(--color-text-tertiary)';
    }
  }};
`;

const IssueHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
`;

const IssueTitle = styled.h3`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  flex: 1;
`;

const SeverityBadge = styled.span`
  background: ${props => {
    switch (props.$severity) {
      case 'critical': return 'var(--color-error)';
      case 'high': return 'var(--color-warning)';
      case 'medium': return 'var(--color-info)';
      case 'low': return 'var(--color-success)';
      default: return 'var(--color-text-tertiary)';
    }
  }};
  color: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
`;

const IssueDescription = styled.p`
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
  line-height: var(--line-height-relaxed);
`;

const IssueLocation = styled.div`
  background: var(--color-surface-secondary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-md);
  overflow-x: auto;
`;

const CodeSnippet = styled.pre`
  background: var(--color-surface-tertiary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  overflow-x: auto;
  white-space: pre-wrap;
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--color-border-tertiary);
`;

const FixSuggestion = styled.div`
  background: var(--color-success-100);
  border: 1px solid var(--color-success-300);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  
  h4 {
    color: var(--color-success-700);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-sm);
  }
  
  p {
    color: var(--color-success-600);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
    margin: 0;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-secondary);
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

const DetailedReportPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation(['results', 'common']);

  useEffect(() => {
    fetchAnalysis();
  }, [id]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await analysisAPI.getById(id);
      
      if (response.success) {
        setAnalysis(response.data);
      } else {
        setError('Failed to load analysis details');
      }
    } catch (fetchError) {
      console.error('Error fetching analysis:', fetchError);
      setError('Failed to load analysis details');
      toast.error('Failed to load analysis details');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <FaTimes />;
      case 'high': return <FaExclamationTriangle />;
      case 'medium': return <FaExclamationCircle />;
      case 'low': return <FaInfoCircle />;
      default: return <FaInfoCircle />;
    }
  };

  const renderIssues = (issues, type) => {
    if (!issues || issues.length === 0) {
      return (
        <EmptyState>
          <FaCheckCircle size={48} style={{ color: 'var(--color-success)', marginBottom: 'var(--spacing-md)' }} />
          <h3>No {type} issues found!</h3>
          <p>Great job! Your website meets all {type} requirements we tested.</p>
        </EmptyState>
      );
    }

    return (
      <IssuesList>
        {issues.map((issue, index) => (
          <IssueCard key={index} $severity={issue.severity}>
            <IssueHeader>
              <IssueTitle>{issue.rules?.name || 'Unknown Issue'}</IssueTitle>
              <SeverityBadge $severity={issue.severity}>
                {issue.severity}
              </SeverityBadge>
            </IssueHeader>
            
            <IssueDescription>
              {issue.message || issue.rules?.description || 'No description available'}
            </IssueDescription>
            
            {issue.location_path && (
              <IssueLocation>
                <strong>Location:</strong> {issue.location_path}
              </IssueLocation>
            )}
            
            {issue.code_snippet && (
              <CodeSnippet>{issue.code_snippet}</CodeSnippet>
            )}
            
            {issue.fix_suggestion && (
              <FixSuggestion>
                <h4>💡 How to fix:</h4>
                <p>{issue.fix_suggestion}</p>
              </FixSuggestion>
            )}
          </IssueCard>
        ))}
      </IssuesList>
    );
  };

  if (loading) {
    return (
      <ReportContainer>
        <ContentContainer>
          <LoadingState>
            <LoadingSpinner size="large" />
            <Title>Loading Detailed Report...</Title>
          </LoadingState>
        </ContentContainer>
      </ReportContainer>
    );
  }

  if (error || !analysis) {
    return (
      <ReportContainer>
        <ContentContainer>
          <ErrorState>
            <FaTimes size={64} style={{ marginBottom: 'var(--spacing-lg)' }} />
            <Title>Report Not Found</Title>
            <p>{error || 'The requested analysis report could not be found.'}</p>
          </ErrorState>
        </ContentContainer>
      </ReportContainer>
    );
  }

  const websiteUrl = analysis.websites?.url || 'Unknown Website';
  const scores = analysis.scores || {
    overall: analysis.overall_score || 0,
    accessibility: analysis.accessibility_score || 0,
    seo: analysis.seo_score || 0,
    performance: analysis.performance_score || 0
  };

  const issues = analysis.issues || {
    accessibility: [],
    seo: [],
    performance: []
  };

  return (
    <ReportContainer>
      <ContentContainer>
        <Header>
          <BackButton onClick={() => navigate('/results')}>
            <FaArrowLeft />
            Back to Results
          </BackButton>
          
          <Title>Detailed Accessibility Report</Title>
          
          <WebsiteInfo>
            <WebsiteUrl>
              <FaGlobe style={{ marginRight: 'var(--spacing-sm)' }} />
              {websiteUrl}
            </WebsiteUrl>
            <AnalysisDate>
              {analysis.created_at ? new Date(analysis.created_at).toLocaleDateString() : 'Unknown Date'}
            </AnalysisDate>
          </WebsiteInfo>
        </Header>

        <ScoresOverview>
          <ScoreCard>
            <ScoreValue $score={scores.overall}>{scores.overall}/100</ScoreValue>
            <ScoreLabel>
              <FaCheckCircle />
              Overall Score
            </ScoreLabel>
          </ScoreCard>
          
          <ScoreCard>
            <ScoreValue $score={scores.accessibility}>{scores.accessibility}/100</ScoreValue>
            <ScoreLabel>
              <FaAccessibleIcon />
              Accessibility
            </ScoreLabel>
          </ScoreCard>
          
          <ScoreCard>
            <ScoreValue $score={scores.seo}>{scores.seo}/100</ScoreValue>
            <ScoreLabel>
              <FaSearch />
              SEO
            </ScoreLabel>
          </ScoreCard>
          
          <ScoreCard>
            <ScoreValue $score={scores.performance}>{scores.performance}/100</ScoreValue>
            <ScoreLabel>
              <FaRocket />
              Performance
            </ScoreLabel>
          </ScoreCard>
        </ScoresOverview>

        <Section>
          <SectionHeader>
            <SectionTitle>
              <FaAccessibleIcon />
              Accessibility Issues
              <IssueCount $count={issues.accessibility.length}>
                {issues.accessibility.length}
              </IssueCount>
            </SectionTitle>
          </SectionHeader>
          <SectionContent>
            {renderIssues(issues.accessibility, 'accessibility')}
          </SectionContent>
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>
              <FaSearch />
              SEO Issues
              <IssueCount $count={issues.seo.length}>
                {issues.seo.length}
              </IssueCount>
            </SectionTitle>
          </SectionHeader>
          <SectionContent>
            {renderIssues(issues.seo, 'SEO')}
          </SectionContent>
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>
              <FaRocket />
              Performance Issues
              <IssueCount $count={issues.performance.length}>
                {issues.performance.length}
              </IssueCount>
            </SectionTitle>
          </SectionHeader>
          <SectionContent>
            {renderIssues(issues.performance, 'performance')}
          </SectionContent>
        </Section>
      </ContentContainer>
    </ReportContainer>
  );
};

export default DetailedReportPage;