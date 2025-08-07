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
  FaGlobe,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { analysisAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ScreenshotCard from '../components/ScreenshotCard';

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

const ScoreAndScreenshotRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  flex-wrap: wrap;
  width: 100%;
`;

const CompactScoreItem = styled.div`
  text-align: center;
  flex: 1;
  min-width: 100px;
`;

const CompactScoreValue = styled.div`
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: ${props => {
    if (props.$score >= 80) return 'var(--color-success)';
    if (props.$score >= 60) return 'var(--color-warning)';
    return 'var(--color-error)';
  }};
  
  @media (min-width: 1200px) {
    font-size: var(--font-size-3xl);
  }
`;

const CompactScoreLabel = styled.div`
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
  
  @media (min-width: 1200px) {
    font-size: var(--font-size-base);
  }
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
      case 'serious':
      case 'high': return 'var(--color-warning)';
      case 'moderate':
      case 'medium': return 'var(--color-info)';
      case 'minor':
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

const TabContainer = styled.div`
  background: var(--color-surface-elevated);
  border-radius: var(--border-radius-xl);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-primary);
  overflow: hidden;
`;

const TabList = styled.div`
  display: flex;
  background: var(--color-surface-secondary);
  border-bottom: 1px solid var(--color-border-secondary);
`;

const TabButton = styled.button`
  flex: 1;
  padding: var(--spacing-lg) var(--spacing-xl);
  border: none;
  background: ${props => props.active ? 'var(--color-interactive-primary)' : 'transparent'};
  color: ${props => props.active ? 'var(--color-text-inverse)' : 'var(--color-text-primary)'};
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  
  &:hover {
    background: ${props => props.active ? 'var(--color-interactive-primary-hover)' : 'var(--color-surface-tertiary)'};
  }
`;

const TabContent = styled.div`
  padding: var(--spacing-xl);
`;

const IssueGroupCard = styled.div`
  background: var(--color-surface-primary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--border-radius-lg);
  margin-bottom: var(--spacing-md);
  overflow: hidden;
  border-left: 4px solid ${props => {
    switch (props.$severity) {
      case 'critical': return 'var(--color-error)';
      case 'serious': return 'var(--color-warning)';
      case 'moderate': return 'var(--color-info)';
      case 'minor': return 'var(--color-success)';
      default: return 'var(--color-text-tertiary)';
    }
  }};
`;

const IssueGroupHeader = styled.div`
  padding: var(--spacing-lg);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-md);
  background: ${props => props.expanded ? 'var(--color-surface-secondary)' : 'transparent'};
  transition: all var(--transition-fast);
  
  &:hover {
    background: var(--color-surface-secondary);
  }
`;

const IssueGroupTitle = styled.div`
  flex: 1;
`;

const IssueGroupName = styled.h3`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
`;

const IssueGroupSubtitle = styled.p`
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
`;

const IssueGroupMeta = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
`;

const IssueCountBadge = styled.span`
  background: var(--color-surface-tertiary);
  color: var(--color-text-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
`;

const ExpandIcon = styled.div`
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
`;

const IssueGroupContent = styled.div`
  padding: 0 var(--spacing-lg) var(--spacing-lg);
  border-top: 1px solid var(--color-border-secondary);
`;

const OccurrenceItem = styled.div`
  background: var(--color-surface-secondary);
  border: 1px solid var(--color-border-tertiary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const OccurrenceLocation = styled.div`
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-sm);
  background: var(--color-surface-tertiary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  display: inline-block;
`;

const OccurrenceCode = styled.pre`
  background: var(--color-surface-tertiary);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  overflow-x: auto;
  white-space: pre-wrap;
  margin: var(--spacing-sm) 0;
  border: 1px solid var(--color-border-tertiary);
`;

const OccurrenceFix = styled.div`
  background: var(--color-success-100);
  border: 1px solid var(--color-success-300);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  
  &:before {
    content: '💡 Fix: ';
    font-weight: var(--font-weight-semibold);
    color: var(--color-success-700);
  }
  
  color: var(--color-success-600);
  font-size: var(--font-size-sm);
`;



const DetailedReportPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('accessibility');
  const [expandedCards, setExpandedCards] = useState(new Set());

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
      case 'serious': return <FaExclamationTriangle />;
      case 'moderate': return <FaExclamationCircle />;
      case 'minor': return <FaInfoCircle />;
      default: return <FaInfoCircle />;
    }
  };

  const toggleCard = (cardId) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  const renderGroupedIssues = (groupedIssues, type) => {
    if (!groupedIssues || groupedIssues.length === 0) {
      return (
        <EmptyState>
          <FaCheckCircle size={48} style={{ color: 'var(--color-success)', marginBottom: 'var(--spacing-md)' }} />
          <h3>No {type} issues found!</h3>
          <p>Great job! Your website meets all {type} requirements we tested.</p>
        </EmptyState>
      );
    }

    return (
      <div>
        {groupedIssues.map((group) => {
          const isExpanded = expandedCards.has(group.id);
          
          return (
            <IssueGroupCard key={group.id} $severity={group.severity}>
              <IssueGroupHeader 
                expanded={isExpanded}
                onClick={() => toggleCard(group.id)}
              >
                <IssueGroupTitle>
                  <IssueGroupName>
                    {getSeverityIcon(group.severity)}
                    {group.rule?.name || group.message}
                  </IssueGroupName>
                  <IssueGroupSubtitle>
                    {group.description || group.message}
                  </IssueGroupSubtitle>
                </IssueGroupTitle>
                
                <IssueGroupMeta>
                  <SeverityBadge $severity={group.severity}>
                    {group.severity}
                  </SeverityBadge>
                  <IssueCountBadge>
                    {group.count} occurrence{group.count !== 1 ? 's' : ''}
                  </IssueCountBadge>
                  <ExpandIcon>
                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                  </ExpandIcon>
                </IssueGroupMeta>
              </IssueGroupHeader>
              
              {isExpanded && (
                <IssueGroupContent>
                  {group.occurrences.map((occurrence, index) => (
                    <OccurrenceItem key={index}>
                      {occurrence.location && (
                        <OccurrenceLocation>
                          Location: {occurrence.location}
                        </OccurrenceLocation>
                      )}
                      
                      {occurrence.code && (
                        <OccurrenceCode>{occurrence.code}</OccurrenceCode>
                      )}
                      
                      {occurrence.fix && (
                        <OccurrenceFix>{occurrence.fix}</OccurrenceFix>
                      )}
                    </OccurrenceItem>
                  ))}
                </IssueGroupContent>
              )}
            </IssueGroupCard>
          );
        })}
      </div>
    );
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

  const groupedIssues = analysis.groupedIssues || {
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
          
          <ScoreAndScreenshotRow>
            <CompactScoreItem>
              <CompactScoreValue $score={scores.overall}>
                {scores.overall}/100
              </CompactScoreValue>
              <CompactScoreLabel>Overall</CompactScoreLabel>
            </CompactScoreItem>
            
            <CompactScoreItem>
              <CompactScoreValue $score={scores.accessibility}>
                {scores.accessibility}/100
              </CompactScoreValue>
              <CompactScoreLabel>Accessibility</CompactScoreLabel>
            </CompactScoreItem>
            
            <CompactScoreItem>
              <CompactScoreValue $score={scores.seo}>
                {scores.seo}/100
              </CompactScoreValue>
              <CompactScoreLabel>SEO</CompactScoreLabel>
            </CompactScoreItem>
            
            <CompactScoreItem>
              <CompactScoreValue $score={scores.performance}>
                {scores.performance}/100
              </CompactScoreValue>
              <CompactScoreLabel>Performance</CompactScoreLabel>
            </CompactScoreItem>
            
            {/* Screenshots in the same row */}
            {analysis.screenshots && analysis.screenshots.length > 0 && (
              <ScreenshotCard screenshots={analysis.screenshots} />
            )}
          </ScoreAndScreenshotRow>
        </Header>

        <TabContainer>
          <TabList>
            <TabButton
              active={activeTab === 'accessibility'}
              onClick={() => setActiveTab('accessibility')}
            >
              <FaAccessibleIcon />
              Accessibility
              <IssueCount $count={groupedIssues.accessibility.length}>
                {groupedIssues.accessibility.length}
              </IssueCount>
            </TabButton>
            
            <TabButton
              active={activeTab === 'seo'}
              onClick={() => setActiveTab('seo')}
            >
              <FaSearch />
              SEO
              <IssueCount $count={groupedIssues.seo.length}>
                {groupedIssues.seo.length}
              </IssueCount>
            </TabButton>
            
            <TabButton
              active={activeTab === 'performance'}
              onClick={() => setActiveTab('performance')}
            >
              <FaRocket />
              Performance
              <IssueCount $count={groupedIssues.performance.length}>
                {groupedIssues.performance.length}
              </IssueCount>
            </TabButton>
          </TabList>
          
          <TabContent>
            {activeTab === 'accessibility' && renderGroupedIssues(groupedIssues.accessibility, 'accessibility')}
            {activeTab === 'seo' && renderGroupedIssues(groupedIssues.seo, 'SEO')}
            {activeTab === 'performance' && renderGroupedIssues(groupedIssues.performance, 'performance')}
          </TabContent>
        </TabContainer>
      </ContentContainer>


    </ReportContainer>
  );
};

export default DetailedReportPage;