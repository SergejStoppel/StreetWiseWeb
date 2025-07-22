import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { analysisAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { FaGlobe, FaCalendar, FaChartLine, FaExternalLinkAlt, FaTrash } from 'react-icons/fa';

const DashboardContainer = styled.div`
  min-height: 80vh;
  padding: var(--spacing-4xl) var(--container-padding);
  max-width: var(--container-max-width);
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: var(--spacing-4xl);
`;

const Title = styled.h1`
  font-size: var(--font-size-4xl);
  color: var(--color-text-primary);
  font-family: var(--font-family-primary);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-sm);
`;

const Subtitle = styled.p`
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-4xl);
`;

const StatCard = styled.div`
  background-color: var(--color-surface-elevated);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--color-border-primary);
  box-shadow: var(--shadow-sm);
`;

const StatValue = styled.div`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-interactive-primary);
  margin-bottom: var(--spacing-xs);
`;

const StatLabel = styled.div`
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
`;

const AnalysisHistorySection = styled.div`
  margin-bottom: var(--spacing-4xl);
`;

const SectionTitle = styled.h2`
  font-size: var(--font-size-2xl);
  color: var(--color-text-primary);
  font-family: var(--font-family-primary);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-xl);
`;

const AnalysisList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
`;

const AnalysisCard = styled.div`
  background-color: var(--color-surface-elevated);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--color-border-primary);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  
  &:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--color-interactive-primary);
  }
`;

const AnalysisHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-md);
`;

const AnalysisInfo = styled.div`
  flex: 1;
`;

const AnalysisUrl = styled.h3`
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-xs);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
`;

const AnalysisDate = styled.div`
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
`;

const AnalysisActions = styled.div`
  display: flex;
  gap: var(--spacing-sm);
`;

const ActionButton = styled.button`
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  background-color: var(--color-surface-secondary);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  
  &:hover {
    background-color: var(--color-interactive-primary);
    color: var(--color-text-inverse);
    border-color: var(--color-interactive-primary);
  }
  
  &.danger:hover {
    background-color: var(--color-error);
    border-color: var(--color-error);
  }
`;

const ScoreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
`;

const ScoreItem = styled.div`
  text-align: center;
`;

const ScoreValue = styled.div`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: ${props => {
    if (props.score >= 80) return 'var(--color-success)';
    if (props.score >= 60) return 'var(--color-warning)';
    return 'var(--color-error)';
  }};
`;

const ScoreLabel = styled.div`
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-4xl);
  color: var(--color-text-secondary);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--spacing-4xl);
  color: var(--color-text-secondary);
`;

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('🏠 Dashboard: Component rendered', {
    user: user ? { id: user.id, email: user.email } : null,
    loading,
    error
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('🏠 Dashboard: Starting to fetch dashboard data...');
        setLoading(true);

        console.log('🏠 Dashboard: Making API calls to getRecent and getStats...');

        // Fetch recent analyses and stats in parallel
        const [analysesResult, statsResult] = await Promise.allSettled([
          analysisAPI.getRecent(10),
          analysisAPI.getStats()
        ]);

        console.log('🏠 Dashboard: API calls completed', {
          analysesResult: analysesResult.status,
          statsResult: statsResult.status,
          analysesReason: analysesResult.reason,
          statsReason: statsResult.reason
        });

        if (analysesResult.status === 'fulfilled') {
          console.log('✅ Dashboard: Recent analyses loaded successfully', analysesResult.value);
          setAnalyses(analysesResult.value.data || []);
        } else {
          console.error('❌ Dashboard: Failed to load recent analyses', analysesResult.reason);
        }

        if (statsResult.status === 'fulfilled') {
          console.log('✅ Dashboard: Stats loaded successfully', statsResult.value);
          setStats(statsResult.value.data || {});
        } else {
          console.error('❌ Dashboard: Failed to load stats', statsResult.reason);
        }

      } catch (err) {
        console.error('❌ Dashboard: Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        console.log('🏠 Dashboard: Setting loading to false');
        setLoading(false);
      }
    };

    console.log('🏠 Dashboard: useEffect triggered, calling fetchDashboardData');
    
    // Only fetch data if we have a user
    if (user) {
      fetchDashboardData();
    } else {
      console.log('🏠 Dashboard: No user found, clearing data');
      setAnalyses([]);
      setStats(null);
      setLoading(false);
    }
  }, [user]);

  const handleViewAnalysis = (analysis) => {
    console.log('🔍 Dashboard: Viewing analysis:', {
      id: analysis.id,
      url: analysis.url,
      hasAnalysisData: !!analysis.analysis_data,
      analysisDataType: typeof analysis.analysis_data,
      analysisDataPreview: analysis.analysis_data ? Object.keys(analysis.analysis_data) : 'null'
    });

    // Navigate to results page with analysis ID - let the results page fetch the data
    console.log('🧭 Dashboard: Navigating to results with ID:', analysis.id);
    navigate(`/results/${analysis.id}`);
  };

  const handleDeleteAnalysis = async (analysisId) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) {
      return;
    }
    
    try {
      await analysisAPI.delete(analysisId);
      setAnalyses(analyses.filter(a => a.id !== analysisId));
    } catch (err) {
      console.error('Error deleting analysis:', err);
      alert('Failed to delete analysis');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingSpinner>Loading your dashboard...</LoadingSpinner>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>Dashboard</Title>
        <Subtitle>
          Welcome back{userProfile?.first_name ? `, ${userProfile.first_name}` : ''}! 
          Here's an overview of your accessibility analyses.
        </Subtitle>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatValue>{stats?.totalAnalyses || 0}</StatValue>
          <StatLabel>Total Analyses</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats?.recentAnalyses || 0}</StatValue>
          <StatLabel>This Month</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats?.avgAccessibilityScore || 0}%</StatValue>
          <StatLabel>Avg Accessibility Score</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats?.avgOverallScore || 0}%</StatValue>
          <StatLabel>Avg Overall Score</StatLabel>
        </StatCard>
      </StatsGrid>

      <AnalysisHistorySection>
        <SectionTitle>Recent Analyses</SectionTitle>
        
        {analyses.length === 0 ? (
          <EmptyState>
            <p>No analyses yet. Start by running your first website analysis!</p>
          </EmptyState>
        ) : (
          <AnalysisList>
            {analyses.map((analysis) => (
              <AnalysisCard key={analysis.id}>
                <AnalysisHeader>
                  <AnalysisInfo>
                    <AnalysisUrl>
                      <FaGlobe />
                      {analysis.url}
                    </AnalysisUrl>
                    <AnalysisDate>
                      <FaCalendar />
                      {formatDate(analysis.created_at)}
                    </AnalysisDate>
                  </AnalysisInfo>
                  <AnalysisActions>
                    <ActionButton onClick={() => handleViewAnalysis(analysis)}>
                      <FaExternalLinkAlt />
                      View
                    </ActionButton>
                    <ActionButton 
                      className="danger" 
                      onClick={() => handleDeleteAnalysis(analysis.id)}
                    >
                      <FaTrash />
                      Delete
                    </ActionButton>
                  </AnalysisActions>
                </AnalysisHeader>
                
                <ScoreGrid>
                  <ScoreItem>
                    <ScoreValue score={analysis.overall_score}>
                      {analysis.overall_score || 0}%
                    </ScoreValue>
                    <ScoreLabel>Overall</ScoreLabel>
                  </ScoreItem>
                  <ScoreItem>
                    <ScoreValue score={analysis.accessibility_score}>
                      {analysis.accessibility_score || 0}%
                    </ScoreValue>
                    <ScoreLabel>Accessibility</ScoreLabel>
                  </ScoreItem>
                  <ScoreItem>
                    <ScoreValue score={analysis.seo_score}>
                      {analysis.seo_score || 0}%
                    </ScoreValue>
                    <ScoreLabel>SEO</ScoreLabel>
                  </ScoreItem>
                  <ScoreItem>
                    <ScoreValue score={analysis.performance_score}>
                      {analysis.performance_score || 0}%
                    </ScoreValue>
                    <ScoreLabel>Performance</ScoreLabel>
                  </ScoreItem>
                </ScoreGrid>
              </AnalysisCard>
            ))}
          </AnalysisList>
        )}
      </AnalysisHistorySection>
    </DashboardContainer>
  );
};

export default Dashboard;