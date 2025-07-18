import React, { useState } from 'react';
import styled from 'styled-components';

const SectionContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const SectionHeader = styled.div`
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
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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

const ScoreCard = styled.div`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ScoreInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ScoreIcon = styled.div`
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
`;

const ScoreDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ScoreValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
`;

const ScoreLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
`;

const Tab = styled.button`
  background: none;
  border: none;
  padding: 1rem 1.5rem;
  cursor: pointer;
  font-weight: 500;
  color: ${props => props.$active ? '#10b981' : '#6b7280'};
  border-bottom: 2px solid ${props => props.$active ? '#10b981' : 'transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    color: #10b981;
  }
`;

const TabContent = styled.div`
  display: ${props => props.$active ? 'block' : 'none'};
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const CategoryCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const CategoryIcon = styled.div`
  width: 32px;
  height: 32px;
  background: ${props => props.$background || '#10b981'};
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const CategoryTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CategoryScore = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => props.color || '#1f2937'};
  margin-left: auto;
`;

const IssuesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const IssueCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-left: 4px solid ${props => props.$impactColor || '#6b7280'};
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const IssueHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const IssueTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const ImpactBadge = styled.span`
  background: ${props => props.$background || '#6b7280'};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  white-space: nowrap;
`;

const IssueDescription = styled.p`
  color: #4b5563;
  margin: 0 0 1rem 0;
  line-height: 1.6;
`;

const IssueDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const IssueDetail = styled.div`
  background: #f9fafb;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
`;

const DetailLabel = styled.div`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`;

const DetailValue = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', monospace;
`;

const IssueMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #6b7280;
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

const EmptyStateIcon = styled.div`
  width: 60px;
  height: 60px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;
  color: #9ca3af;
`;

const SeoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

const MetaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14,2 14,8 20,8"></polyline>
  </svg>
);

const ContentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
  </svg>
);

const TechnicalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
);

const SeoAnalysisSection = ({ seoAnalysis }) => {
  const [activeTab, setActiveTab] = useState('meta');

  // Debug: Log the seoAnalysis data to see what we're receiving
  console.log('SeoAnalysisSection received seoAnalysis:', seoAnalysis);
  
  if (!seoAnalysis || (typeof seoAnalysis === 'object' && Object.keys(seoAnalysis).length === 0)) {
    return (
      <SectionContainer>
        <SectionHeader>
          <HeaderIcon>
            <SeoIcon />
          </HeaderIcon>
          <div>
            <HeaderTitle>SEO Analysis</HeaderTitle>
            <HeaderSubtitle>Search engine optimization insights</HeaderSubtitle>
          </div>
        </SectionHeader>
        
        <EmptyState>
          <EmptyStateIcon>
            <SeoIcon />
          </EmptyStateIcon>
          <h3>SEO Analysis Unavailable</h3>
          <p>SEO analysis data will appear here once the comprehensive scan is complete.</p>
        </EmptyState>
      </SectionContainer>
    );
  }

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#f59e0b';
    if (score >= 50) return '#f97316';
    return '#ef4444';
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'meta': return <MetaIcon />;
      case 'content': return <ContentIcon />;
      case 'technical': return <TechnicalIcon />;
      default: return <SeoIcon />;
    }
  };

  const tabs = [
    { id: 'meta', label: 'Meta Tags', data: seoAnalysis.metaAnalysis },
    { id: 'content', label: 'Content', data: seoAnalysis.contentAnalysis },
    { id: 'technical', label: 'Technical', data: seoAnalysis.technicalAnalysis },
    { id: 'structure', label: 'Structure', data: seoAnalysis.structureAnalysis }
  ];

  return (
    <SectionContainer>
      <SectionHeader>
        <HeaderIcon>
          <SeoIcon />
        </HeaderIcon>
        <div>
          <HeaderTitle>SEO Analysis</HeaderTitle>
          <HeaderSubtitle>Search engine optimization insights and recommendations</HeaderSubtitle>
        </div>
      </SectionHeader>

      <ScoreCard>
        <ScoreInfo>
          <ScoreIcon>{seoAnalysis.score || 0}</ScoreIcon>
          <ScoreDetails>
            <ScoreValue>SEO Score: {seoAnalysis.score || 0}%</ScoreValue>
            <ScoreLabel>
              {seoAnalysis.issues?.length || 0} issues found • {seoAnalysis.recommendations?.length || 0} recommendations
            </ScoreLabel>
          </ScoreDetails>
        </ScoreInfo>
      </ScoreCard>

      <TabsContainer>
        {tabs.map(tab => (
          <Tab 
            key={tab.id}
            $active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Tab>
        ))}
      </TabsContainer>

      {tabs.map(tab => (
        <TabContent key={tab.id} $active={activeTab === tab.id}>
          {tab.data ? (
            <>
              <CategoryGrid>
                {Object.entries(tab.data).filter(([key]) => key !== 'issues').map(([key, value]) => (
                  <CategoryCard key={key}>
                    <CategoryHeader>
                      <CategoryIcon $background={getScoreColor(value.score || 0)}>
                        {getCategoryIcon(tab.id)}
                      </CategoryIcon>
                      <CategoryTitle>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</CategoryTitle>
                      <CategoryScore color={getScoreColor(value.score || 0)}>
                        {value.score || 0}%
                      </CategoryScore>
                    </CategoryHeader>
                  </CategoryCard>
                ))}
              </CategoryGrid>

              <IssuesList>
                {tab.data.issues?.map((issue, index) => (
                  <IssueCard key={index} $impactColor={getImpactColor(issue.impact)}>
                    <IssueHeader>
                      <IssueTitle>{issue.title}</IssueTitle>
                      <ImpactBadge $background={getImpactColor(issue.impact)}>
                        {issue.impact} Impact
                      </ImpactBadge>
                    </IssueHeader>
                    
                    <IssueDescription>{issue.description}</IssueDescription>
                    
                    <IssueDetails>
                      <IssueDetail>
                        <DetailLabel>Current Value:</DetailLabel>
                        <DetailValue>{issue.currentValue || 'N/A'}</DetailValue>
                      </IssueDetail>
                      <IssueDetail>
                        <DetailLabel>Recommended:</DetailLabel>
                        <DetailValue>{issue.recommendedValue || 'N/A'}</DetailValue>
                      </IssueDetail>
                    </IssueDetails>
                    
                    <IssueMeta>
                      <div>
                        <strong>User Benefit:</strong> {issue.userBenefit || 'N/A'}
                      </div>
                      <div>
                        <strong>Fix Time:</strong> {issue.estimatedFixTime || 0} min
                      </div>
                    </IssueMeta>
                  </IssueCard>
                ))}
              </IssuesList>
            </>
          ) : (
            <EmptyState>
              <EmptyStateIcon>
                {getCategoryIcon(tab.id)}
              </EmptyStateIcon>
              <h3>No {tab.label} Issues Found</h3>
              <p>Your website appears to be optimized for {tab.label.toLowerCase()}.</p>
            </EmptyState>
          )}
        </TabContent>
      ))}
    </SectionContainer>
  );
};

export default SeoAnalysisSection;