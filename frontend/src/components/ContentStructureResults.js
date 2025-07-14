import React from 'react';
import styled from 'styled-components';
import { 
  FaAlignLeft, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaInfoCircle,
  FaTimes,
  FaCheck,
  FaRuler,
  FaParagraph
} from 'react-icons/fa';

const ContentStructureSection = styled.section`
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ScoreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ScoreCard = styled.div`
  text-align: center;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
`;

const ScoreIcon = styled.div`
  font-size: 2rem;
  color: ${props => props.color};
  margin-bottom: 0.5rem;
`;

const ScoreValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const ScoreLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const DetailSection = styled.div`
  margin-top: 2rem;
`;

const DetailTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const MetricsList = styled.div`
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const MetricItem = styled.div`
  padding: 1rem;
  background: ${props => {
    if (props.type === 'warning') return '#fff7ed';
    if (props.type === 'error') return '#fef2f2';
    return '#f0f9ff';
  }};
  border: 1px solid ${props => {
    if (props.type === 'warning') return '#fed7aa';
    if (props.type === 'error') return '#fecaca';
    return '#bfdbfe';
  }};
  border-radius: 0.5rem;
  font-size: 0.875rem;
`;

const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: ${props => {
    if (props.type === 'warning') return '#d97706';
    if (props.type === 'error') return '#dc2626';
    return '#2563eb';
  }};
`;

const MetricDetails = styled.div`
  color: #6b7280;
  line-height: 1.5;
`;

const IssueList = styled.div`
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const IssueItem = styled.div`
  padding: 1rem;
  background: ${props => {
    if (props.severity === 'high') return '#fef2f2';
    if (props.severity === 'medium') return '#fff7ed';
    return '#f0f9ff';
  }};
  border: 1px solid ${props => {
    if (props.severity === 'high') return '#fecaca';
    if (props.severity === 'medium') return '#fed7aa';
    return '#bfdbfe';
  }};
  border-radius: 0.5rem;
`;

const IssueHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: ${props => {
    if (props.severity === 'high') return '#dc2626';
    if (props.severity === 'medium') return '#d97706';
    return '#2563eb';
  }};
`;

const IssueDescription = styled.div`
  color: #374151;
  margin-bottom: 0.5rem;
`;

const WcagReference = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const ContentStructureResults = ({ contentStructureData }) => {
  if (!contentStructureData || contentStructureData.summary?.testFailed) {
    return null;
  }

  const { summary, content, whiteSpace, issues } = contentStructureData;

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <FaExclamationTriangle />;
      case 'medium':
        return <FaInfoCircle />;
      default:
        return <FaCheckCircle />;
    }
  };

  const getMetricType = (value, threshold, higherIsBetter = true) => {
    if (higherIsBetter) {
      if (value >= threshold) return 'good';
      if (value >= threshold * 0.7) return 'warning';
      return 'error';
    } else {
      if (value <= threshold) return 'good';
      if (value <= threshold * 1.5) return 'warning';
      return 'error';
    }
  };

  return (
    <ContentStructureSection>
      <SectionTitle>
        <FaAlignLeft />
        Content Structure Analysis
      </SectionTitle>
      
      <ScoreGrid>
        <ScoreCard>
          <ScoreIcon color={getScoreColor(summary.overallScore)}>
            <FaAlignLeft />
          </ScoreIcon>
          <ScoreValue>{summary.overallScore}%</ScoreValue>
          <ScoreLabel>Content Structure Score</ScoreLabel>
        </ScoreCard>
        
        <ScoreCard>
          <ScoreIcon color={getScoreColor(summary.whiteSpaceScore)}>
            <FaRuler />
          </ScoreIcon>
          <ScoreValue>{summary.whiteSpaceScore}%</ScoreValue>
          <ScoreLabel>White Space Score</ScoreLabel>
        </ScoreCard>
        
        <ScoreCard>
          <ScoreIcon color={getScoreColor(summary.contentChunkScore)}>
            <FaParagraph />
          </ScoreIcon>
          <ScoreValue>{summary.contentChunkScore}%</ScoreValue>
          <ScoreLabel>Content Chunk Score</ScoreLabel>
        </ScoreCard>
        
        <ScoreCard>
          <ScoreIcon color={getScoreColor(summary.lineHeightScore)}>
            <FaRuler />
          </ScoreIcon>
          <ScoreValue>{summary.lineHeightScore}%</ScoreValue>
          <ScoreLabel>Line Height Score</ScoreLabel>
        </ScoreCard>
      </ScoreGrid>

      {/* Content Structure Compliance */}
      <div style={{ 
        background: summary.overallScore >= 80 ? '#f0f9ff' : '#fef2f2', 
        padding: '1rem', 
        borderRadius: '0.5rem', 
        marginBottom: '1.5rem',
        border: `1px solid ${summary.overallScore >= 80 ? '#bfdbfe' : '#fecaca'}`
      }}>
        <div style={{ 
          fontWeight: '600', 
          color: summary.overallScore >= 80 ? '#1e40af' : '#dc2626',
          marginBottom: '0.5rem'
        }}>
          {summary.overallScore >= 80 ? 
            '✅ Good content structure implementation' :
            '⚠️ Content structure needs improvement'
          }
        </div>
        <div style={{ color: '#374151', fontSize: '0.875rem' }}>
          {summary.overallScore >= 80 ? 
            'Content has appropriate spacing, readable line lengths, and proper chunking.' :
            'Some content structure issues affect readability and accessibility.'
          }
        </div>
      </div>

      {/* Content Metrics */}
      <DetailSection>
        <DetailTitle>Content Metrics</DetailTitle>
        <MetricsList>
          <MetricItem type={getMetricType(summary.averageLineLength, 75, false)}>
            <MetricHeader type={getMetricType(summary.averageLineLength, 75, false)}>
              <FaRuler color={summary.averageLineLength <= 75 ? '#10b981' : '#d97706'} />
              Average Line Length: {Math.round(summary.averageLineLength)} characters
            </MetricHeader>
            <MetricDetails>
              Optimal: 45-75 characters | Current: {Math.round(summary.averageLineLength)}
              <br />
              {summary.averageLineLength > 100 ? 'Lines are too long for comfortable reading' :
               summary.averageLineLength > 75 ? 'Consider shortening line length' :
               'Good line length for readability'}
            </MetricDetails>
          </MetricItem>
          
          <MetricItem type={getMetricType(summary.averageParagraphLength, 8, false)}>
            <MetricHeader type={getMetricType(summary.averageParagraphLength, 8, false)}>
              <FaParagraph color={summary.averageParagraphLength <= 8 ? '#10b981' : '#d97706'} />
              Average Paragraph Length: {Math.round(summary.averageParagraphLength)} sentences
            </MetricHeader>
            <MetricDetails>
              Optimal: 3-8 sentences | Current: {Math.round(summary.averageParagraphLength)}
              <br />
              {summary.averageParagraphLength > 12 ? 'Paragraphs are too long' :
               summary.averageParagraphLength > 8 ? 'Consider breaking up longer paragraphs' :
               'Good paragraph length'}
            </MetricDetails>
          </MetricItem>
          
          <MetricItem>
            <MetricHeader>
              <FaAlignLeft color="#6b7280" />
              Content Overview
            </MetricHeader>
            <MetricDetails>
              Total Paragraphs: {summary.totalParagraphs}
              <br />
              Total Headings: {summary.totalHeadings}
              <br />
              Content Chunks: {content.contentChunks?.length || 0}
            </MetricDetails>
          </MetricItem>
        </MetricsList>
      </DetailSection>

      {/* Line Height Analysis */}
      {whiteSpace.lineHeights && whiteSpace.lineHeights.length > 0 && (
        <DetailSection>
          <DetailTitle>Line Height Analysis ({whiteSpace.lineHeights.length} elements)</DetailTitle>
          <div style={{ 
            fontSize: '0.875rem', 
            color: '#6b7280', 
            marginBottom: '1rem' 
          }}>
            WCAG requires line height of at least 1.5 times the font size for readability.
          </div>
          <MetricsList>
            {whiteSpace.lineHeights.slice(0, 10).map((lineHeight, index) => (
              <MetricItem key={index} type={lineHeight.isAdequate ? 'good' : 'error'}>
                <MetricHeader type={lineHeight.isAdequate ? 'good' : 'error'}>
                  {lineHeight.isAdequate ? <FaCheck color="#10b981" /> : <FaTimes color="#dc2626" />}
                  Line Height: {lineHeight.lineHeight.toFixed(2)} ({lineHeight.fontSize}px font)
                </MetricHeader>
                <MetricDetails>
                  {lineHeight.isAdequate ? 
                    'Meets WCAG line height requirements' :
                    'Below minimum 1.5 line height requirement'
                  }
                </MetricDetails>
              </MetricItem>
            ))}
            {whiteSpace.lineHeights.length > 10 && (
              <div style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
                ...and {whiteSpace.lineHeights.length - 10} more elements
              </div>
            )}
          </MetricsList>
        </DetailSection>
      )}

      {/* Content Chunks */}
      {content.contentChunks && content.contentChunks.length > 0 && (
        <DetailSection>
          <DetailTitle>Content Chunks ({content.contentChunks.length})</DetailTitle>
          <MetricsList>
            {content.contentChunks.slice(0, 8).map((chunk, index) => (
              <MetricItem key={index} type={chunk.isLargeChunk ? 'warning' : 'good'}>
                <MetricHeader type={chunk.isLargeChunk ? 'warning' : 'good'}>
                  {chunk.isLargeChunk ? <FaInfoCircle color="#d97706" /> : <FaCheck color="#10b981" />}
                  Content Section: {chunk.wordCount} words
                </MetricHeader>
                <MetricDetails>
                  {chunk.isLargeChunk ? 
                    'Large content section - consider breaking into smaller parts' :
                    'Appropriate content size for readability'
                  }
                  <br />
                  Adequate spacing: {chunk.hasAdequateSpacing ? 'Yes' : 'No'}
                </MetricDetails>
              </MetricItem>
            ))}
            {content.contentChunks.length > 8 && (
              <div style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
                ...and {content.contentChunks.length - 8} more content sections
              </div>
            )}
          </MetricsList>
        </DetailSection>
      )}

      {/* Issues and Recommendations */}
      {issues && issues.length > 0 && (
        <DetailSection>
          <DetailTitle>Issues & Recommendations</DetailTitle>
          <IssueList>
            {issues.map((issue, index) => (
              <IssueItem key={index} severity={issue.severity}>
                <IssueHeader severity={issue.severity}>
                  {getSeverityIcon(issue.severity)}
                  {issue.message}
                </IssueHeader>
                <IssueDescription>
                  {issue.recommendation && issue.recommendation}
                </IssueDescription>
                <WcagReference>
                  WCAG Criterion: {issue.wcagCriterion}
                </WcagReference>
              </IssueItem>
            ))}
          </IssueList>
        </DetailSection>
      )}
    </ContentStructureSection>
  );
};

export default ContentStructureResults;