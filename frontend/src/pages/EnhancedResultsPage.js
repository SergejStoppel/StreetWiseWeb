import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import {
  FaArrowLeft,
  FaCrown,
  FaSync
} from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { accessibilityAPI, analysisAPI } from '../services/api';

// Import Phase 2 components
import EnhancedReportHeader from '../components/EnhancedReportHeader';
import AiInsightsDashboard from '../components/AiInsightsDashboard';
import SeoAnalysisSection from '../components/SeoAnalysisSection';
import PriorityMatrix from '../components/PriorityMatrix';
import CustomCodeFixesDisplay from '../components/CustomCodeFixesDisplay';

// Import existing components
import ScoreCard from '../components/ScoreCard';
import IssueTable from '../components/reports/DetailedReport/IssueTable/IssueTable';
import { AccessibilityIssue } from '../models/AccessibilityIssue';
import CallToActionSection from '../components/CallToActionSection';

const ResultsContainer = styled.div`
  max-width: 75vw;
  margin: 0 auto;
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const HeaderRight = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e5e7eb;
    border-color: #9ca3af;
  }
`;


const UpgradeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const ErrorTitle = styled.h2`
  font-size: 1.5rem;
  color: #ef4444;
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.p`
  color: #6b7280;
  margin-bottom: 2rem;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  margin: 0 auto;
  
  &:hover {
    background: #2563eb;
  }
`;

const ContentSections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const TabContainer = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const TabHeader = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
`;

const Tab = styled.button`
  flex: 1;
  padding: 1rem 2rem;
  background: ${props => props.active ? '#f8fafc' : 'white'};
  border: none;
  border-bottom: 2px solid ${props => props.active ? '#667eea' : 'transparent'};
  color: ${props => props.active ? '#667eea' : '#6b7280'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f8fafc;
    color: #667eea;
  }
`;

const TabContent = styled.div`
  padding: 2rem;
  display: ${props => props.active ? 'block' : 'none'};
`;

const EnhancedResultsPage = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upgradingToDetailed, setUpgradingToDetailed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedIssues, setExpandedIssues] = useState([]);

  const navigate = useNavigate();
  const { analysisId } = useParams();
  const { i18n } = useTranslation();

  useEffect(() => {
    console.log('📊 Results page useEffect triggered', { analysisId });

    const loadResults = async () => {
      try {
        // If we have an analysisId parameter, fetch from API (authenticated user)
        if (analysisId) {
          console.log('🔍 Loading analysis from API with ID:', analysisId);
          const response = await analysisAPI.getById(analysisId);

          if (response.success && response.data) {
            // With the new backend transformation, the data is now directly in response.data
            let analysisData = response.data;

            if (!analysisData || typeof analysisData !== 'object') {
              console.error('❌ Analysis data is null or invalid:', analysisData);
              setError('This analysis does not have detailed results available. Please run a new analysis.');
              return;
            }

            console.log('✅ Successfully loaded analysis from API:', {
              id: response.data.id,
              url: response.data.url,
              hasAnalysisData: !!analysisData,
              dataKeys: Object.keys(analysisData)
            });

            // Mark as authenticated user report
            const enhancedResults = {
              ...analysisData,
              analysisId: response.data.id,
              reportType: response.data.report_type || 'overview',
              isAnonymous: false // Flag to show premium features
            };

            setResults(enhancedResults);
          } else {
            console.error('❌ Failed to load analysis from API:', response);
            setError('Failed to load analysis results');
          }
        } else {
          // No analysisId parameter, try sessionStorage (anonymous user)
          console.log('🔍 No analysisId parameter, checking sessionStorage');
          const storedResults = sessionStorage.getItem('analysisResult');

          console.log('🔍 Checking sessionStorage for analysisResult:', {
            hasData: !!storedResults,
            dataLength: storedResults?.length,
            dataPreview: storedResults?.substring(0, 100)
          });

          if (storedResults) {
            const parsedResults = JSON.parse(storedResults);

            // Check if parsed results is null or invalid
            if (!parsedResults || typeof parsedResults !== 'object') {
              console.error('❌ Parsed results is null or invalid:', parsedResults);
              setError('Analysis results are not available. Please run a new analysis.');
              return;
            }

            console.log('✅ Successfully parsed results from sessionStorage:', {
              resultKeys: Object.keys(parsedResults),
              hasViolations: !!parsedResults.violations,
              hasSummary: !!parsedResults.summary
            });

            // Mark as anonymous/free report
            const enhancedResults = {
              ...parsedResults,
              reportType: parsedResults.reportType || 'overview',
              isAnonymous: true // Flag to show free vs premium features
            };

            setResults(enhancedResults);
          } else {
            console.log('❌ No analysis results found in sessionStorage');
            setError('No analysis results found');
          }
        }
      } catch (error) {
        console.error('❌ Error loading results:', error);
        setError('Failed to load analysis results');
      } finally {
        console.log('🔄 Setting loading to false');
        setLoading(false);
      }
    };

    loadResults();
  }, [analysisId]);

  const handleBack = () => {
    navigate('/');
  };

  const handleUpgradeToDetailed = async () => {
    if (!results) return;
    
    setUpgradingToDetailed(true);
    
    try {
      toast.info('Loading detailed report...', { autoClose: 2000 });
      
      const detailedResult = await accessibilityAPI.getDetailedReport(results.analysisId || results.id, i18n.language);
      
      if (detailedResult.success) {
        setResults(detailedResult.data);
        sessionStorage.setItem('analysisResult', JSON.stringify(detailedResult.data));
        toast.success('Detailed report loaded successfully!');
      } else {
        toast.error('Failed to load detailed report');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error(error.message || 'Failed to load detailed report');
    } finally {
      setUpgradingToDetailed(false);
    }
  };


  const handleRefresh = () => {
    window.location.reload();
  };

  const handleConsultation = () => {
    window.location.href = '/contact?service=consultation';
  };

  const convertViolationsToIssues = (violations) => {
    if (!violations || !Array.isArray(violations)) return [];
    
    return violations.map((violation, index) => {
      return new AccessibilityIssue({
        id: `violation-${index}`,
        title: violation.help || violation.description || 'Unknown Issue',
        description: violation.description || '',
        severity: mapSeverityToIssueLevel(violation.impact),
        category: getIssueCategory(violation.id),
        wcagCriteria: violation.tags
          ?.filter(tag => tag.startsWith('wcag'))
          ?.map(tag => tag.replace('wcag', '').replace(/(\d)(\d)/g, '$1.$2'))
          ?.slice(0, 3) || [],
        elements: violation.nodes?.map(node => ({
          selector: node.target?.join(', ') || '',
          html: node.html || '',
          failureSummary: node.failureSummary || ''
        })) || [],
        remediation: {
          summary: violation.help || 'Fix this accessibility issue',
          steps: violation.nodes?.[0]?.all?.map(check => check.message) || [],
          resources: [violation.helpUrl].filter(Boolean)
        }
      });
    });
  };

  const mapSeverityToIssueLevel = (impact) => {
    switch (impact) {
      case 'critical': return 'critical';
      case 'serious': return 'serious';
      case 'moderate': return 'moderate';
      case 'minor': return 'minor';
      default: return 'moderate';
    }
  };

  const getIssueCategory = (violationId) => {
    if (violationId.includes('color') || violationId.includes('contrast')) return 'color-contrast';
    if (violationId.includes('image') || violationId.includes('alt')) return 'images';
    if (violationId.includes('form') || violationId.includes('label')) return 'forms';
    if (violationId.includes('keyboard') || violationId.includes('focus')) return 'keyboard';
    if (violationId.includes('heading') || violationId.includes('structure')) return 'structure';
    if (violationId.includes('aria')) return 'aria';
    return 'other';
  };

  if (loading) {
    return (
      <ResultsContainer>
        <LoadingContainer>
          <LoadingSpinner />
        </LoadingContainer>
      </ResultsContainer>
    );
  }

  if (error || !results) {
    return (
      <ResultsContainer>
        <ErrorContainer>
          <ErrorTitle>Unable to Load Results</ErrorTitle>
          <ErrorMessage>
            {error || 'No analysis results found. Please run a new analysis.'}
          </ErrorMessage>
          <RefreshButton onClick={handleRefresh}>
            <FaSync />
            Refresh Page
          </RefreshButton>
        </ErrorContainer>
      </ResultsContainer>
    );
  }

  const accessibilityIssues = convertViolationsToIssues(results.violations || []);

  return (
    <ResultsContainer>
      <Header>
        <HeaderLeft>
          <Title>
            Analysis Results
            {results.reportType === 'detailed' && (
              <span style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <FaCrown /> Premium Report
              </span>
            )}
          </Title>
        </HeaderLeft>
        <HeaderRight>
          <BackButton onClick={handleBack}>
            <FaArrowLeft />
            Back to Home
          </BackButton>
          
          {results.reportType !== 'detailed' && (
            <UpgradeButton 
              onClick={handleUpgradeToDetailed}
              disabled={upgradingToDetailed}
            >
              {upgradingToDetailed ? (
                <>
                  <LoadingSpinner size="small" />
                  Upgrading...
                </>
              ) : (
                <>
                  <FaCrown />
                  Get Detailed Report
                </>
              )}
            </UpgradeButton>
          )}
        </HeaderRight>
      </Header>

      <ContentSections>
        {/* Enhanced Report Header with Screenshots */}
        <EnhancedReportHeader report={{
          ...results,
          metadata: results.metadata || {},
          summary: results.summary || {},
          screenshot: results.screenshot || null
        }} />

        {/* AI Insights Dashboard */}
        <AiInsightsDashboard aiInsights={results.aiInsights} />

        {/* SEO Analysis Section */}
        <SeoAnalysisSection seoAnalysis={results.seo} />

        {/* Priority Matrix */}
        <PriorityMatrix 
          priorityMatrix={results.aiInsights?.priorityMatrix}
          allIssues={accessibilityIssues}
        />

        {/* Custom Code Fixes Display */}
        <CustomCodeFixesDisplay 
          customCodeFixes={results.aiInsights?.customCodeFixes}
        />

        {/* Detailed Analysis Tabs */}
        <TabContainer>
          <TabHeader>
            <Tab 
              active={activeTab === 'overview'} 
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </Tab>
            <Tab 
              active={activeTab === 'accessibility'} 
              onClick={() => setActiveTab('accessibility')}
            >
              Accessibility Issues
            </Tab>
            <Tab 
              active={activeTab === 'recommendations'} 
              onClick={() => setActiveTab('recommendations')}
            >
              Recommendations
            </Tab>
          </TabHeader>

          <TabContent active={activeTab === 'overview'}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <ScoreCard
                title="Accessibility Score"
                score={results.scores?.overall || results.summary?.accessibilityScore || 0}
                description="Overall accessibility compliance"
                color={results.scores?.overall >= 80 ? '#10b981' : results.scores?.overall >= 60 ? '#f59e0b' : '#ef4444'}
                enhanced={true}
                wcagBreakdown={{
                  critical: results.summary?.criticalIssues || 0,
                  passed: results.summary?.passedAudits || 0,
                  manual: results.summary?.manualAudits || 0,
                  notApplicable: results.summary?.notApplicable || 0
                }}
              />
              
              {results.seo && (
                <ScoreCard
                  title="SEO Score"
                  score={results.summary?.seoScore || results.seo?.score || 0}
                  description="Search engine optimization"
                  color={results.seo?.score >= 80 ? '#10b981' : results.seo?.score >= 60 ? '#f59e0b' : '#ef4444'}
                  enhanced={true}
                />
              )}
              
              <ScoreCard
                title="Performance Score"
                score={results.summary?.performanceScore || 0}
                description="Website performance metrics"
                color="#6b7280"
                enhanced={true}
              />
            </div>
          </TabContent>

          <TabContent active={activeTab === 'accessibility'}>
            <IssueTable
              issues={accessibilityIssues}
              onIssueToggle={(issueId) => setExpandedIssues(prev => 
                prev.includes(issueId) 
                  ? prev.filter(id => id !== issueId)
                  : [...prev, issueId]
              )}
              expandedIssues={expandedIssues}
              detailedMode={results.reportType === 'detailed'}
            />
            
            {/* Show additional detailed analysis sections for premium reports */}
            {results.reportType === 'detailed' && (
              <div style={{ marginTop: '2rem' }}>
                {/* Structure Analysis */}
                {results.structure && (
                  <div style={{ 
                    background: 'white', 
                    borderRadius: '12px', 
                    padding: '2rem', 
                    marginBottom: '1.5rem',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' 
                  }}>
                    <h3 style={{ color: '#1f2937', marginBottom: '1rem' }}>Structure Analysis</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                      <div>
                        <strong>Headings:</strong> {results.structure.headings?.length || 0} found
                      </div>
                      <div>
                        <strong>Structure Score:</strong> {results.structure.score || 0}%
                      </div>
                      <div>
                        <strong>Issues:</strong> {results.structure.issues?.length || 0}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* ARIA Analysis */}
                {results.aria && (
                  <div style={{ 
                    background: 'white', 
                    borderRadius: '12px', 
                    padding: '2rem', 
                    marginBottom: '1.5rem',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' 
                  }}>
                    <h3 style={{ color: '#1f2937', marginBottom: '1rem' }}>ARIA Analysis</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                      <div>
                        <strong>ARIA Score:</strong> {results.aria.score || 0}%
                      </div>
                      <div>
                        <strong>Elements with ARIA:</strong> {results.aria.elementsWithAria?.length || 0}
                      </div>
                      <div>
                        <strong>Issues:</strong> {results.aria.issues?.length || 0}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Form Analysis */}
                {results.forms && (
                  <div style={{ 
                    background: 'white', 
                    borderRadius: '12px', 
                    padding: '2rem', 
                    marginBottom: '1.5rem',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' 
                  }}>
                    <h3 style={{ color: '#1f2937', marginBottom: '1rem' }}>Form Analysis</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                      <div>
                        <strong>Forms Found:</strong> {results.forms.formsFound || 0}
                      </div>
                      <div>
                        <strong>Form Score:</strong> {results.forms.score || 0}%
                      </div>
                      <div>
                        <strong>Issues:</strong> {results.forms.issues?.length || 0}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabContent>

          <TabContent active={activeTab === 'recommendations'}>
            {results.reportType === 'detailed' && results.recommendations && results.recommendations.length > 0 ? (
              <div style={{ padding: '2rem' }}>
                <h3 style={{ color: '#1f2937', marginBottom: '2rem' }}>Detailed Recommendations</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {results.recommendations.map((rec, index) => (
                    <div key={index} style={{ 
                      background: 'white', 
                      borderRadius: '12px', 
                      padding: '1.5rem', 
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <h4 style={{ color: '#1f2937', margin: 0 }}>{rec.title || rec.description}</h4>
                        <span style={{ 
                          background: rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f59e0b' : '#10b981',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {rec.priority} Priority
                        </span>
                      </div>
                      <p style={{ color: '#4b5563', margin: '0 0 1rem 0' }}>{rec.explanation || rec.description}</p>
                      {rec.userBenefit && (
                        <p style={{ color: '#059669', margin: '0 0 1rem 0', fontStyle: 'italic' }}>
                          <strong>Benefit:</strong> {rec.userBenefit}
                        </p>
                      )}
                      {rec.estimatedFixTime && (
                        <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
                          <strong>Estimated fix time:</strong> {rec.estimatedFixTime} minutes
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                <h3>Recommendations</h3>
                <p>{results.reportType === 'detailed' 
                  ? 'No specific recommendations available for this analysis.' 
                  : 'Upgrade to Premium Report to see detailed recommendations with implementation guides.'
                }</p>
              </div>
            )}
          </TabContent>
        </TabContainer>
        
        {/* Call to Action Section */}
        <CallToActionSection 
          reportType={results.reportType}
          onUpgrade={handleUpgradeToDetailed}
          onConsultation={handleConsultation}
        />
      </ContentSections>
    </ResultsContainer>
  );
};

export default EnhancedResultsPage;