import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { analysisAPI, websiteAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { FaGlobe, FaCalendar, FaChartLine, FaExternalLinkAlt, FaTrash, FaDesktop, FaMobile } from 'react-icons/fa';

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
  justify-content: space-between;
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

const ScreenshotSection = styled.div`
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border-secondary);
`;

const ScreenshotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
`;

const ScreenshotCard = styled.div`
  position: relative;
  border-radius: var(--border-radius-md);
  overflow: hidden;
  background: var(--color-surface-secondary);
  border: 1px solid var(--color-border-primary);
  aspect-ratio: 3/2;
  cursor: pointer;
  transition: all var(--transition-fast);
  
  &:hover {
    transform: scale(1.02);
    box-shadow: var(--shadow-md);
  }
`;

const ScreenshotImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ScreenshotOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
`;

const ScreenshotModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-xl);
`;

const ScreenshotModalContent = styled.div`
  max-width: 90vw;
  max-height: 90vh;
  position: relative;
`;

const ScreenshotModalImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: var(--border-radius-md);
`;

const ScreenshotModalClose = styled.button`
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: var(--font-size-xl);
  cursor: pointer;
  padding: var(--spacing-sm);
  
  &:hover {
    opacity: 0.7;
  }
`;

const ErrorMessage = styled.div`
  background-color: var(--color-error-light, #fee);
  color: var(--color-error, #c00);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-xl);
  border: 1px solid var(--color-error, #c00);
`;

const Dashboard = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState('');
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const response = await websiteAPI.getWebsites();
        setWebsites(response.data);
        if (response.data.length > 0) {
          setSelectedWebsite(response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching websites:', error);
      }
    };

    fetchWebsites();
  }, []);

  const handleStartAnalysis = async () => {
    if (!selectedWebsite) {
      alert('Please select a website to analyze.');
      return;
    }

    try {
      const response = await analysisAPI.startAnalysis(selectedWebsite);
      navigate(`/results/${response.data.id}`);
    } catch (error) {
      console.error('Error starting analysis:', error);
      alert('Failed to start analysis');
    }
  };

  console.log('🏠 Dashboard: Component rendered', {
    user: user ? { id: user.id, email: user.email } : null,
    userProfile: userProfile ? { id: userProfile.id, name: userProfile.full_name } : null,
    loading,
    error,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    let isMounted = true;
    let abortController = new AbortController();

    const fetchDashboardData = async () => {
      try {
        console.log('🏠 Dashboard: Starting to fetch dashboard data...');
        if (isMounted) {
          setLoading(true);
          setError(null);
        }

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

        // Only update state if component is still mounted
        if (!isMounted) {
          console.log('🏠 Dashboard: Component unmounted, skipping state updates');
          return;
        }

        if (analysesResult.status === 'fulfilled') {
          console.log('✅ Dashboard: Recent analyses loaded successfully', analysesResult.value);
          console.log('✅ Dashboard: First analysis screenshots:', analysesResult.value.data?.[0]?.screenshots);
          setAnalyses(analysesResult.value.data || []);
        } else {
          console.error('❌ Dashboard: Failed to load recent analyses', analysesResult.reason);
          // Set empty data on failure to prevent infinite loading
          setAnalyses([]);
        }

        if (statsResult.status === 'fulfilled') {
          console.log('✅ Dashboard: Stats loaded successfully', statsResult.value);
          setStats(statsResult.value.data || {});
        } else {
          console.error('❌ Dashboard: Failed to load stats', statsResult.reason);
          // Set default stats on failure
          setStats({
            totalAnalyses: 0,
            recentAnalyses: 0,
            avgAccessibilityScore: 0,
            avgOverallScore: 0
          });
        }

      } catch (err) {
        console.error('❌ Dashboard: Error fetching dashboard data:', err);
        if (isMounted) {
          setError('Failed to load dashboard data');
          // Ensure we have default data even on error
          setAnalyses([]);
          setStats({
            totalAnalyses: 0,
            recentAnalyses: 0,
            avgAccessibilityScore: 0,
            avgOverallScore: 0
          });
        }
      } finally {
        console.log('🏠 Dashboard: In finally block, isMounted:', isMounted);
        if (isMounted) {
          console.log('🏠 Dashboard: Setting loading to false');
          setLoading(false);
        } else {
          console.log('🏠 Dashboard: Component unmounted, not updating loading state');
        }
      }
    };

    console.log('🏠 Dashboard: useEffect triggered', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      isMounted: isMounted
    });
    
    let timeoutId;
    
    // Only fetch data if we have a user
    if (user && user.id) {
      console.log('🏠 Dashboard: User found, fetching data');
      // Add a timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        if (isMounted && loading) {
          console.error('🏠 Dashboard: Fetch timeout after 30 seconds');
          setError('Request timed out. Please refresh the page.');
          setLoading(false);
          setAnalyses([]);
          setStats({
            totalAnalyses: 0,
            recentAnalyses: 0,
            avgAccessibilityScore: 0,
            avgOverallScore: 0
          });
        }
      }, 30000); // 30 second timeout
      
      fetchDashboardData().finally(() => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
    } else {
      console.log('🏠 Dashboard: No user found, clearing data');
      if (isMounted) {
        setAnalyses([]);
        setStats(null);
        setLoading(false);
        setError(null);
      }
    }

    // Cleanup function
    return () => {
      console.log('🏠 Dashboard: Cleaning up effect');
      isMounted = false;
      abortController.abort();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user]);

  const handleViewAnalysis = (analysis) => {
    console.log('🔍 Dashboard: Viewing analysis:', {
      id: analysis.id,
      url: analysis.websites?.url,
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
    console.log('📅 Dashboard: Formatting date:', { input: dateString, type: typeof dateString });
    
    if (!dateString) {
      console.warn('📅 Dashboard: No date string provided');
      return 'No date';
    }
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.error('📅 Dashboard: Invalid date string:', dateString);
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScreenshotUrl = (screenshot) => {
    if (!screenshot) return null;
    const baseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://iywlcimloohmgjhjptoj.supabase.co';
    const url = `${baseUrl}/storage/v1/object/public/${screenshot.storage_bucket}/${screenshot.storage_path}`;
    console.log('🖼️ Dashboard: Screenshot URL constructed:', {
      baseUrl,
      bucket: screenshot.storage_bucket,
      path: screenshot.storage_path,
      fullUrl: url
    });
    return url;
  };

  const openScreenshotModal = (screenshot) => {
    setSelectedScreenshot(screenshot);
  };

  const closeScreenshotModal = () => {
    setSelectedScreenshot(null);
  };

  const renderScreenshots = (screenshots) => {
    console.log('🖼️ Dashboard: Rendering screenshots:', { screenshots });
    if (!screenshots || screenshots.length === 0) {
      console.log('🖼️ Dashboard: No screenshots to render');
      return null;
    }

    return (
      <ScreenshotSection>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
          Screenshots
        </div>
        <ScreenshotGrid>
          {screenshots.map((screenshot) => (
            <ScreenshotCard 
              key={screenshot.id} 
              onClick={() => openScreenshotModal(screenshot)}
            >
              <ScreenshotImage
                src={getScreenshotUrl(screenshot)}
                alt={`${screenshot.type} screenshot`}
                loading="lazy"
              />
              <ScreenshotOverlay>
                {screenshot.type === 'desktop' ? <FaDesktop /> : <FaMobile />}
                {screenshot.type}
              </ScreenshotOverlay>
            </ScreenshotCard>
          ))}
        </ScreenshotGrid>
      </ScreenshotSection>
    );
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

      <div style={{ marginBottom: '2rem' }}>
        <select value={selectedWebsite} onChange={(e) => setSelectedWebsite(e.target.value)} style={{ marginRight: '1rem' }}>
          {websites.map((website) => (
            <option key={website.id} value={website.id}>
              {website.url}
            </option>
          ))}
        </select>
        <button onClick={handleStartAnalysis}>Start Analysis</button>
      </div>

      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}

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
                      {analysis.websites?.url || 'Unknown URL'}
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
                
                {/* Add screenshots section */}
                {renderScreenshots(analysis.screenshots)}
              </AnalysisCard>
            ))}
          </AnalysisList>
        )}
      </AnalysisHistorySection>

      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <ScreenshotModal onClick={closeScreenshotModal}>
          <ScreenshotModalContent onClick={(e) => e.stopPropagation()}>
            <ScreenshotModalClose onClick={closeScreenshotModal}>×</ScreenshotModalClose>
            <ScreenshotModalImage
              src={getScreenshotUrl(selectedScreenshot)}
              alt={`${selectedScreenshot.type} screenshot`}
            />
          </ScreenshotModalContent>
        </ScreenshotModal>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;