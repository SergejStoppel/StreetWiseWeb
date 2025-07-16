import React, { useState } from 'react';
import styled from 'styled-components';

const MatrixContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const MatrixHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
`;

const HeaderIcon = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const HeaderTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const HeaderSubtitle = styled.p`
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
`;

const MatrixGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const QuadrantCard = styled.div`
  background: ${props => props.background || '#f9fafb'};
  border: 2px solid ${props => props.borderColor || '#e5e7eb'};
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
  min-height: 200px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const QuadrantHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const QuadrantIcon = styled.div`
  width: 32px;
  height: 32px;
  background: ${props => props.background || '#8b5cf6'};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const QuadrantTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const QuadrantCount = styled.div`
  background: ${props => props.background || '#8b5cf6'};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-left: auto;
`;

const QuadrantDescription = styled.p`
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

const IssuesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
`;

const IssueItem = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const IssueHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
`;

const IssueTitle = styled.h4`
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.3;
`;

const IssueSeverity = styled.span`
  background: ${props => props.background || '#6b7280'};
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  white-space: nowrap;
`;

const IssueDescription = styled.p`
  color: #6b7280;
  font-size: 0.8rem;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
`;

const IssueMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #9ca3af;
`;

const EmptyQuadrant = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #9ca3af;
  text-align: center;
  min-height: 150px;
`;

const EmptyIcon = styled.div`
  width: 48px;
  height: 48px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: #d1d5db;
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: #f3f4f6;
  padding: 0.25rem;
  border-radius: 8px;
  width: fit-content;
`;

const ToggleButton = styled.button`
  background: ${props => props.active ? 'white' : 'transparent'};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  color: ${props => props.active ? '#1f2937' : '#6b7280'};
  transition: all 0.2s ease;
  
  &:hover {
    color: #1f2937;
  }
`;

const LegendContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const LegendColor = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: ${props => props.color || '#6b7280'};
`;

const MatrixIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12"></polyline>
  </svg>
);

const EmptyStateIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M8 12h8"></path>
  </svg>
);

const PriorityMatrix = ({ priorityMatrix, allIssues }) => {
  const [viewMode, setViewMode] = useState('matrix');
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Create matrix from issues if not provided
  const matrix = priorityMatrix || createMatrixFromIssues(allIssues || []);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'serious': return '#f59e0b';
      case 'high': return '#f59e0b';
      case 'moderate': return '#3b82f6';
      case 'medium': return '#3b82f6';
      case 'minor': return '#10b981';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const quadrants = [
    {
      id: 'quickWins',
      title: 'Quick Wins',
      description: 'High impact, low effort - Start here!',
      background: '#ecfdf5',
      borderColor: '#10b981',
      iconBackground: '#10b981',
      issues: matrix.quickWins || []
    },
    {
      id: 'majorProjects',
      title: 'Major Projects',
      description: 'High impact, high effort - Plan carefully',
      background: '#fef3c7',
      borderColor: '#f59e0b',
      iconBackground: '#f59e0b',
      issues: matrix.majorProjects || []
    },
    {
      id: 'fillIns',
      title: 'Fill-ins',
      description: 'Low impact, low effort - When you have time',
      background: '#eff6ff',
      borderColor: '#3b82f6',
      iconBackground: '#3b82f6',
      issues: matrix.fillIns || []
    },
    {
      id: 'questionable',
      title: 'Questionable',
      description: 'Low impact, high effort - Consider deprioritizing',
      background: '#fef2f2',
      borderColor: '#ef4444',
      iconBackground: '#ef4444',
      issues: matrix.questionable || []
    }
  ];

  return (
    <MatrixContainer>
      <MatrixHeader>
        <HeaderIcon>
          <MatrixIcon />
        </HeaderIcon>
        <div>
          <HeaderTitle>Priority Matrix</HeaderTitle>
          <HeaderSubtitle>Strategic prioritization based on impact and effort</HeaderSubtitle>
        </div>
      </MatrixHeader>

      <ViewToggle>
        <ToggleButton 
          active={viewMode === 'matrix'} 
          onClick={() => setViewMode('matrix')}
        >
          Matrix View
        </ToggleButton>
        <ToggleButton 
          active={viewMode === 'list'} 
          onClick={() => setViewMode('list')}
        >
          List View
        </ToggleButton>
      </ViewToggle>

      {viewMode === 'matrix' && (
        <>
          <LegendContainer>
            <LegendItem>
              <LegendColor color="#10b981" />
              <span>High Impact + Low Effort</span>
            </LegendItem>
            <LegendItem>
              <LegendColor color="#f59e0b" />
              <span>High Impact + High Effort</span>
            </LegendItem>
            <LegendItem>
              <LegendColor color="#3b82f6" />
              <span>Low Impact + Low Effort</span>
            </LegendItem>
            <LegendItem>
              <LegendColor color="#ef4444" />
              <span>Low Impact + High Effort</span>
            </LegendItem>
          </LegendContainer>

          <MatrixGrid>
            {quadrants.map(quadrant => (
              <QuadrantCard 
                key={quadrant.id}
                background={quadrant.background}
                borderColor={quadrant.borderColor}
              >
                <QuadrantHeader>
                  <QuadrantIcon background={quadrant.iconBackground}>
                    <CheckIcon />
                  </QuadrantIcon>
                  <QuadrantTitle>{quadrant.title}</QuadrantTitle>
                  <QuadrantCount background={quadrant.iconBackground}>
                    {quadrant.issues.length}
                  </QuadrantCount>
                </QuadrantHeader>
                
                <QuadrantDescription>
                  {quadrant.description}
                </QuadrantDescription>
                
                {quadrant.issues.length > 0 ? (
                  <IssuesList>
                    {quadrant.issues.slice(0, 5).map((issue, index) => (
                      <IssueItem 
                        key={index}
                        onClick={() => setSelectedIssue(issue)}
                      >
                        <IssueHeader>
                          <IssueTitle>{issue.title}</IssueTitle>
                          <IssueSeverity 
                            background={getSeverityColor(issue.severity || issue.impact)}
                          >
                            {issue.severity || issue.impact}
                          </IssueSeverity>
                        </IssueHeader>
                        
                        <IssueDescription>
                          {issue.description?.substring(0, 100)}...
                        </IssueDescription>
                        
                        <IssueMeta>
                          <span>Fix: {issue.estimatedFixTime || 30} min</span>
                          <span>{issue.type || 'General'}</span>
                        </IssueMeta>
                      </IssueItem>
                    ))}
                    
                    {quadrant.issues.length > 5 && (
                      <div style={{ textAlign: 'center', padding: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        +{quadrant.issues.length - 5} more issues
                      </div>
                    )}
                  </IssuesList>
                ) : (
                  <EmptyQuadrant>
                    <EmptyIcon>
                      <EmptyStateIcon />
                    </EmptyIcon>
                    <div>No issues in this category</div>
                  </EmptyQuadrant>
                )}
              </QuadrantCard>
            ))}
          </MatrixGrid>
        </>
      )}

      {viewMode === 'list' && (
        <div>
          {quadrants.map(quadrant => (
            <div key={quadrant.id} style={{ marginBottom: '2rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                marginBottom: '1rem',
                padding: '1rem',
                background: quadrant.background,
                borderRadius: '8px',
                border: `2px solid ${quadrant.borderColor}`
              }}>
                <QuadrantIcon background={quadrant.iconBackground}>
                  <CheckIcon />
                </QuadrantIcon>
                <QuadrantTitle>{quadrant.title}</QuadrantTitle>
                <QuadrantCount background={quadrant.iconBackground}>
                  {quadrant.issues.length} issues
                </QuadrantCount>
              </div>
              
              <IssuesList>
                {quadrant.issues.map((issue, index) => (
                  <IssueItem key={index}>
                    <IssueHeader>
                      <IssueTitle>{issue.title}</IssueTitle>
                      <IssueSeverity 
                        background={getSeverityColor(issue.severity || issue.impact)}
                      >
                        {issue.severity || issue.impact}
                      </IssueSeverity>
                    </IssueHeader>
                    
                    <IssueDescription>
                      {issue.description}
                    </IssueDescription>
                    
                    <IssueMeta>
                      <span>Estimated fix time: {issue.estimatedFixTime || 30} minutes</span>
                      <span>Type: {issue.type || 'General'}</span>
                    </IssueMeta>
                  </IssueItem>
                ))}
              </IssuesList>
            </div>
          ))}
        </div>
      )}
    </MatrixContainer>
  );
};

// Helper function to create matrix from issues if not provided
function createMatrixFromIssues(issues) {
  const matrix = {
    quickWins: [],
    majorProjects: [],
    fillIns: [],
    questionable: []
  };

  issues.forEach(issue => {
    const impact = calculateImpactScore(issue);
    const effort = calculateEffortScore(issue);
    
    if (impact >= 7 && effort <= 3) {
      matrix.quickWins.push(issue);
    } else if (impact >= 7 && effort > 3) {
      matrix.majorProjects.push(issue);
    } else if (impact < 7 && effort <= 3) {
      matrix.fillIns.push(issue);
    } else {
      matrix.questionable.push(issue);
    }
  });

  return matrix;
}

function calculateImpactScore(issue) {
  let score = 0;
  
  const severityScores = { 
    critical: 10, 
    serious: 8, 
    high: 8, 
    moderate: 5, 
    medium: 5, 
    minor: 2, 
    low: 2 
  };
  
  score += severityScores[issue.severity] || severityScores[issue.impact] || 0;
  
  if (issue.userBenefit && issue.userBenefit.length > 50) score += 2;
  if (issue.businessImpact === 'high') score += 3;
  else if (issue.businessImpact === 'medium') score += 2;
  else if (issue.businessImpact === 'low') score += 1;
  
  return Math.min(score, 10);
}

function calculateEffortScore(issue) {
  let score = 0;
  
  const fixTime = issue.estimatedFixTime || 30;
  if (fixTime <= 15) score += 1;
  else if (fixTime <= 60) score += 3;
  else if (fixTime <= 240) score += 6;
  else score += 10;
  
  if (issue.type === 'technical') score += 2;
  if (issue.locations && issue.locations.length > 10) score += 2;
  
  return Math.min(score, 10);
}

export default PriorityMatrix;