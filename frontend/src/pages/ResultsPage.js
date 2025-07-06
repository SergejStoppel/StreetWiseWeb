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
  FaHeading
} from 'react-icons/fa';
import ScoreCard from '../components/ScoreCard';
import ViolationsList from '../components/ViolationsList';
import RecommendationsList from '../components/RecommendationsList';
import LoadingSpinner from '../components/LoadingSpinner';

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
  background: #6b7280;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: #4b5563;
  }
`;

const DownloadButton = styled.button`
  background: #2563eb;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: #1d4ed8;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 1rem;
  margin-bottom: 0.5rem;
`;

const AnalysisInfo = styled.div`
  display: flex;
  gap: 1rem;
  color: #6b7280;
  font-size: 0.875rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.25rem;
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

const ResultsPage = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const handleDownload = async () => {
    if (!results) return;
    
    try {
      // Create a simple text report
      const reportContent = `
SITECRAFT ACCESSIBILITY ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}

Website: ${results.url}
Analysis ID: ${results.analysisId}

SCORES:
- Overall Score: ${results.scores.overall}/100
- Accessibility Score: ${results.scores.accessibility}/100
- Custom Score: ${results.scores.custom}/100

SUMMARY:
- Total Violations: ${results.summary.totalViolations}
- Critical Issues: ${results.summary.criticalViolations}
- Serious Issues: ${results.summary.seriousViolations}
- Moderate Issues: ${results.summary.moderateViolations}
- Minor Issues: ${results.summary.minorViolations}
- Images without Alt Text: ${results.summary.imagesWithoutAlt}
- Form Fields without Labels: ${results.summary.formsWithoutLabels}
- Empty Links: ${results.summary.emptyLinks}

RECOMMENDATIONS:
${results.recommendations.map(rec => `
- ${rec.title} (${rec.priority.toUpperCase()})
  ${rec.description}
  Action: ${rec.action}
`).join('\n')}

VIOLATIONS:
${results.axeResults.violations.map(violation => `
- ${violation.help} (${violation.impact?.toUpperCase() || 'UNKNOWN'})
  ${violation.description}
  Affected Elements: ${violation.nodes.length}
`).join('\n')}

Report generated by SiteCraft - Website Accessibility Analysis Tool
      `;

      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sitecraft-accessibility-report-${results.analysisId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download report');
    }
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
          <Title>Accessibility Analysis Results</Title>
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
          <DownloadButton onClick={handleDownload}>
            <FaDownload />
            Download Report
          </DownloadButton>
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

      <Section>
        <SectionTitle>Accessibility Violations</SectionTitle>
        <ViolationsList violations={results.axeResults.violations} />
      </Section>
    </ResultsContainer>
  );
};

export default ResultsPage;