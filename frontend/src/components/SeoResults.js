import React from 'react';
import styled from 'styled-components';
import { 
  FaSearch, 
  FaCode, 
  FaFileAlt, 
  FaCogs, 
  FaBrain,
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaInfoCircle,
  FaTimes,
  FaCheck
} from 'react-icons/fa';

const SeoSection = styled.section`
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

const CategorySection = styled.div`
  margin-bottom: 2rem;
`;

const CategoryTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const IssuesList = styled.div`
  display: grid;
  gap: 1rem;
`;

const IssueItem = styled.div`
  padding: 1rem;
  background: ${props => {
    if (props.severity === 'critical') return '#fef2f2';
    if (props.severity === 'serious') return '#fff7ed';
    if (props.severity === 'moderate') return '#fffbeb';
    return '#f0f9ff';
  }};
  border: 1px solid ${props => {
    if (props.severity === 'critical') return '#fecaca';
    if (props.severity === 'serious') return '#fed7aa';
    if (props.severity === 'moderate') return '#fde68a';
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
    if (props.severity === 'critical') return '#dc2626';
    if (props.severity === 'serious') return '#d97706';
    if (props.severity === 'moderate') return '#f59e0b';
    return '#2563eb';
  }};
`;

const IssueDescription = styled.div`
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const IssueFix = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  font-style: italic;
`;

const IssueLocation = styled.div`
  color: #9ca3af;
  font-size: 0.75rem;
  font-family: 'Monaco', 'Menlo', monospace;
  margin-top: 0.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
`;

const SeoResults = ({ seoData, score }) => {
  if (!seoData || seoData.length === 0) {
    return (
      <SeoSection>
        <SectionTitle>
          <FaSearch />
          SEO Analysis
        </SectionTitle>
        
        <ScoreGrid>
          <ScoreCard>
            <ScoreIcon color="#10b981">
              <FaCheckCircle />
            </ScoreIcon>
            <ScoreValue>{score || 100}</ScoreValue>
            <ScoreLabel>SEO Score</ScoreLabel>
          </ScoreCard>
        </ScoreGrid>

        <EmptyState>
          <FaCheckCircle size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
          <h3>Great SEO Implementation!</h3>
          <p>No significant SEO issues were found. Your website is well-optimized for search engines.</p>
        </EmptyState>
      </SeoSection>
    );
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <FaExclamationTriangle />;
      case 'serious':
        return <FaExclamationTriangle />;
      case 'moderate':
        return <FaInfoCircle />;
      default:
        return <FaCheckCircle />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  // Group issues by category based on rule keys
  const groupIssuesByCategory = (issues) => {
    const categories = {
      technical: [],
      content: [],
      structure: [],
      schema: [],
      ai: []
    };

    issues.forEach(issue => {
      const ruleKey = issue.rule?.rule_key || '';
      
      if (ruleKey.startsWith('SEO_TEC_')) {
        categories.technical.push(issue);
      } else if (ruleKey.startsWith('SEO_CON_')) {
        categories.content.push(issue);
      } else if (ruleKey.startsWith('SEO_STR_')) {
        categories.structure.push(issue);
      } else if (ruleKey.startsWith('SEO_SCHEMA_')) {
        categories.schema.push(issue);
      } else if (ruleKey.startsWith('SEO_AI_')) {
        categories.ai.push(issue);
      } else {
        // Default to technical for unknown categories
        categories.technical.push(issue);
      }
    });

    return categories;
  };

  const groupedIssues = groupIssuesByCategory(seoData);
  
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'technical': return <FaCode />;
      case 'content': return <FaFileAlt />;
      case 'structure': return <FaSearch />;
      case 'schema': return <FaCogs />;
      case 'ai': return <FaBrain />;
      default: return <FaSearch />;
    }
  };

  const getCategoryTitle = (category) => {
    switch (category) {
      case 'technical': return 'Technical SEO';
      case 'content': return 'Content Optimization';
      case 'structure': return 'Content Structure';
      case 'schema': return 'Structured Data';
      case 'ai': return 'AI Content Analysis';
      default: return 'SEO Issues';
    }
  };

  const totalIssues = seoData.length;
  const criticalIssues = seoData.filter(issue => issue.severity === 'critical').length;

  return (
    <SeoSection>
      <SectionTitle>
        <FaSearch />
        SEO Analysis
      </SectionTitle>
      
      <ScoreGrid>
        <ScoreCard>
          <ScoreIcon color={getScoreColor(score || 0)}>
            <FaSearch />
          </ScoreIcon>
          <ScoreValue>{score || 0}</ScoreValue>
          <ScoreLabel>SEO Score</ScoreLabel>
        </ScoreCard>
        
        <ScoreCard>
          <ScoreIcon color={totalIssues > 0 ? '#ef4444' : '#10b981'}>
            {totalIssues > 0 ? <FaExclamationTriangle /> : <FaCheckCircle />}
          </ScoreIcon>
          <ScoreValue>{totalIssues}</ScoreValue>
          <ScoreLabel>Total Issues</ScoreLabel>
        </ScoreCard>
        
        <ScoreCard>
          <ScoreIcon color={criticalIssues > 0 ? '#ef4444' : '#10b981'}>
            {criticalIssues > 0 ? <FaTimes /> : <FaCheck />}
          </ScoreIcon>
          <ScoreValue>{criticalIssues}</ScoreValue>
          <ScoreLabel>Critical Issues</ScoreLabel>
        </ScoreCard>
      </ScoreGrid>

      {/* Overall SEO Status */}
      <div style={{ 
        background: score >= 80 ? '#f0f9ff' : '#fef2f2', 
        padding: '1rem', 
        borderRadius: '0.5rem', 
        marginBottom: '1.5rem',
        border: `1px solid ${score >= 80 ? '#bfdbfe' : '#fecaca'}`
      }}>
        <div style={{ 
          fontWeight: '600', 
          color: score >= 80 ? '#1e40af' : '#dc2626',
          marginBottom: '0.5rem'
        }}>
          {score >= 80 ? 
            '✅ Good SEO foundation with room for optimization' :
            '⚠️ SEO needs improvement to boost search rankings'
          }
        </div>
        <div style={{ color: '#374151', fontSize: '0.875rem' }}>
          {totalIssues === 0 ? 
            'Your website follows SEO best practices well.' :
            `Found ${totalIssues} SEO optimization opportunities${criticalIssues > 0 ? ` including ${criticalIssues} critical issues` : ''}.`
          }
        </div>
      </div>

      {Object.entries(groupedIssues).map(([category, issues]) => {
        if (issues.length === 0) return null;
        
        return (
          <CategorySection key={category}>
            <CategoryTitle>
              {getCategoryIcon(category)}
              {getCategoryTitle(category)} ({issues.length} issues)
            </CategoryTitle>
            
            <IssuesList>
              {issues.map((issue, index) => (
                <IssueItem key={index} severity={issue.severity}>
                  <IssueHeader severity={issue.severity}>
                    {getSeverityIcon(issue.severity)}
                    {issue.rule?.name || 'SEO Issue'}
                  </IssueHeader>
                  
                  <IssueDescription>
                    {issue.message || issue.rule?.description}
                  </IssueDescription>
                  
                  {issue.occurrences && issue.occurrences.length > 0 && (
                    <>
                      {issue.occurrences.map((occurrence, occIndex) => (
                        <div key={occIndex}>
                          {occurrence.fix && (
                            <IssueFix>
                              💡 {occurrence.fix}
                            </IssueFix>
                          )}
                          {occurrence.location && (
                            <IssueLocation>
                              📍 {occurrence.location}
                            </IssueLocation>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                  
                  {/* For non-grouped issues (backward compatibility) */}
                  {!issue.occurrences && issue.fix_suggestion && (
                    <IssueFix>
                      💡 {issue.fix_suggestion}
                    </IssueFix>
                  )}
                  {!issue.occurrences && issue.location_path && (
                    <IssueLocation>
                      📍 {issue.location_path}
                    </IssueLocation>
                  )}
                </IssueItem>
              ))}
            </IssuesList>
          </CategorySection>
        );
      })}
    </SeoSection>
  );
};

export default SeoResults;