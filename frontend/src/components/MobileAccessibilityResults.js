import React from 'react';
import styled from 'styled-components';
import { 
  FaMobile, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaInfoCircle,
  FaTimes,
  FaCheck,
  FaWpforms,
  FaBars,
  FaSearchPlus,
  FaTabletAlt
} from 'react-icons/fa';

const MobileAccessibilitySection = styled.section`
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

const FeatureList = styled.div`
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const FeatureItem = styled.div`
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

const FeatureHeader = styled.div`
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

const FeatureDetails = styled.div`
  color: #6b7280;
  line-height: 1.5;
`;

const ComplianceBox = styled.div`
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  background: ${props => props.isGood ? '#f0f9ff' : '#fef2f2'};
  border: 1px solid ${props => props.isGood ? '#bfdbfe' : '#fecaca'};
`;

const ComplianceHeader = styled.div`
  font-weight: 600;
  color: ${props => props.isGood ? '#1e40af' : '#dc2626'};
  margin-bottom: 0.5rem;
`;

const ComplianceText = styled.div`
  color: #374151;
  font-size: 0.875rem;
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

const MobileAccessibilityResults = ({ mobileAccessibilityData }) => {
  if (!mobileAccessibilityData || mobileAccessibilityData.summary?.testFailed) {
    return null;
  }

  const { summary, navigation, forms, responsive, touchInteractions, issues } = mobileAccessibilityData;

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

  const getFeatureType = (isGood) => {
    return isGood ? 'good' : 'error';
  };

  return (
    <MobileAccessibilitySection>
      <SectionTitle>
        <FaMobile />
        Mobile Accessibility Analysis
      </SectionTitle>
      
      <ScoreGrid>
        <ScoreCard>
          <ScoreIcon color={getScoreColor(summary.overallScore)}>
            <FaMobile />
          </ScoreIcon>
          <ScoreValue>{summary.overallScore}%</ScoreValue>
          <ScoreLabel>Mobile Accessibility Score</ScoreLabel>
        </ScoreCard>
        
        <ScoreCard>
          <ScoreIcon color={getScoreColor(summary.mobileNavigationScore)}>
            <FaBars />
          </ScoreIcon>
          <ScoreValue>{summary.mobileNavigationScore}%</ScoreValue>
          <ScoreLabel>Mobile Navigation Score</ScoreLabel>
        </ScoreCard>
        
        <ScoreCard>
          <ScoreIcon color={getScoreColor(summary.formCompatibilityScore)}>
            <FaWpforms />
          </ScoreIcon>
          <ScoreValue>{summary.formCompatibilityScore}%</ScoreValue>
          <ScoreLabel>Form Compatibility Score</ScoreLabel>
        </ScoreCard>
        
        <ScoreCard>
          <ScoreIcon color={responsive.hasViewportMeta ? '#10b981' : '#ef4444'}>
            <FaTabletAlt />
          </ScoreIcon>
          <ScoreValue>{responsive.hasViewportMeta ? 'Yes' : 'No'}</ScoreValue>
          <ScoreLabel>Viewport Meta Tag</ScoreLabel>
        </ScoreCard>
      </ScoreGrid>

      {/* Mobile Compliance Overview */}
      <ComplianceBox isGood={summary.overallScore >= 80}>
        <ComplianceHeader isGood={summary.overallScore >= 80}>
          {summary.overallScore >= 80 ? 
            '✅ Good mobile accessibility implementation' :
            '⚠️ Mobile accessibility needs improvement'
          }
        </ComplianceHeader>
        <ComplianceText>
          {summary.overallScore >= 80 ? 
            'Mobile navigation and forms follow accessibility best practices for touch devices.' :
            'Some mobile accessibility issues may affect users on touch devices.'
          }
        </ComplianceText>
      </ComplianceBox>

      {/* Responsive Design Features */}
      <DetailSection>
        <DetailTitle>Responsive Design Features</DetailTitle>
        <FeatureList>
          <FeatureItem type={getFeatureType(responsive.hasViewportMeta)}>
            <FeatureHeader type={getFeatureType(responsive.hasViewportMeta)}>
              {responsive.hasViewportMeta ? <FaCheck color="#10b981" /> : <FaTimes color="#dc2626" />}
              Viewport Meta Tag
            </FeatureHeader>
            <FeatureDetails>
              {responsive.hasViewportMeta ? 
                `Configured: ${responsive.viewportContent || 'width=device-width, initial-scale=1'}` :
                'Missing viewport meta tag - essential for mobile optimization'
              }
            </FeatureDetails>
          </FeatureItem>
          
          <FeatureItem type={getFeatureType(touchInteractions.zoomSupport)}>
            <FeatureHeader type={getFeatureType(touchInteractions.zoomSupport)}>
              {touchInteractions.zoomSupport ? <FaCheck color="#10b981" /> : <FaTimes color="#dc2626" />}
              Zoom Support
            </FeatureHeader>
            <FeatureDetails>
              {touchInteractions.zoomSupport ? 
                'Users can zoom up to 200% for better readability' :
                'Zoom disabled - affects users who need to enlarge content'
              }
            </FeatureDetails>
          </FeatureItem>
          
          <FeatureItem type={getFeatureType(touchInteractions.orientationSupport)}>
            <FeatureHeader type={getFeatureType(touchInteractions.orientationSupport)}>
              {touchInteractions.orientationSupport ? <FaCheck color="#10b981" /> : <FaInfoCircle color="#d97706" />}
              Orientation Support
            </FeatureHeader>
            <FeatureDetails>
              {touchInteractions.orientationSupport ? 
                'Supports both portrait and landscape orientations' :
                'Limited orientation change detection'
              }
            </FeatureDetails>
          </FeatureItem>

          {responsive.flexibleLayouts && responsive.flexibleLayouts.length > 0 && (
            <FeatureItem>
              <FeatureHeader>
                <FaCheck color="#10b981" />
                Flexible Layouts Detected
              </FeatureHeader>
              <FeatureDetails>
                Uses modern CSS layout methods:
                {responsive.flexibleLayouts.map((layout, index) => (
                  <div key={index}>
                    • {layout.hasFlexbox && 'Flexbox'} {layout.hasGrid && 'CSS Grid'}
                  </div>
                ))}
              </FeatureDetails>
            </FeatureItem>
          )}
        </FeatureList>
      </DetailSection>

      {/* Mobile Navigation Patterns */}
      {navigation.patterns && navigation.patterns.length > 0 && (
        <DetailSection>
          <DetailTitle>Mobile Navigation Patterns ({navigation.patterns.length})</DetailTitle>
          <FeatureList>
            {navigation.patterns.slice(0, 8).map((pattern, index) => (
              <FeatureItem key={index} type={pattern.isAccessible === false ? 'warning' : 'good'}>
                <FeatureHeader type={pattern.isAccessible === false ? 'warning' : 'good'}>
                  {pattern.isAccessible === false ? <FaInfoCircle color="#d97706" /> : <FaCheck color="#10b981" />}
                  {pattern.type ? pattern.type.replace('_', ' ').toUpperCase() : 'Navigation Element'}
                </FeatureHeader>
                <FeatureDetails>
                  Element: {pattern.element}
                  {pattern.itemCount && <><br />Items: {pattern.itemCount}</>}
                  {pattern.hasHamburgerPattern && <><br />Hamburger menu pattern detected</>}
                  {pattern.hasDropdownMenus && <><br />Dropdown menus present</>}
                  {pattern.touchTargetSize && (
                    <><br />Touch target: {Math.round(pattern.touchTargetSize)}px</>
                  )}
                  <br />
                  ARIA: {pattern.hasProperAria ? 'Properly implemented' : 'Missing attributes'}
                </FeatureDetails>
              </FeatureItem>
            ))}
            {navigation.patterns.length > 8 && (
              <div style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
                ...and {navigation.patterns.length - 8} more navigation patterns
              </div>
            )}
          </FeatureList>
        </DetailSection>
      )}

      {/* Form Field Compatibility */}
      {forms.mobileOptimized && forms.mobileOptimized.length > 0 && (
        <DetailSection>
          <DetailTitle>Form Field Mobile Compatibility ({forms.mobileOptimized.length} fields)</DetailTitle>
          <div style={{ 
            fontSize: '0.875rem', 
            color: '#6b7280', 
            marginBottom: '1rem' 
          }}>
            Form fields should be at least 44px tall with appropriate input types for mobile keyboards.
          </div>
          <FeatureList>
            {forms.mobileOptimized.slice(0, 10).map((field, index) => (
              <FeatureItem key={index} type={field.isMobileOptimized ? 'good' : 'warning'}>
                <FeatureHeader type={field.isMobileOptimized ? 'good' : 'warning'}>
                  {field.isMobileOptimized ? <FaCheck color="#10b981" /> : <FaInfoCircle color="#d97706" />}
                  {field.type.toUpperCase()} Field
                </FeatureHeader>
                <FeatureDetails>
                  Size: {Math.round(field.width)}×{Math.round(field.height)}px 
                  | Font: {field.fontSize}px
                  <br />
                  Input type: {field.hasProperInputType ? 'Appropriate' : 'Could be improved'}
                  <br />
                  Label: {field.hasAssociatedLabel ? 'Properly labeled' : 'Missing accessible label'}
                  <br />
                  Mobile optimized: {field.isMobileOptimized ? 'Yes' : 'Needs improvement'}
                </FeatureDetails>
              </FeatureItem>
            ))}
            {forms.mobileOptimized.length > 10 && (
              <div style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
                ...and {forms.mobileOptimized.length - 10} more form fields
              </div>
            )}
          </FeatureList>
        </DetailSection>
      )}

      {/* Touch Gesture Support */}
      {touchInteractions.gestureSupport && touchInteractions.gestureSupport.length > 0 && (
        <DetailSection>
          <DetailTitle>Touch Gesture Support ({touchInteractions.gestureSupport.length} elements)</DetailTitle>
          <FeatureList>
            {touchInteractions.gestureSupport.map((gesture, index) => (
              <FeatureItem key={index} type={gesture.hasAriaLabel ? 'good' : 'warning'}>
                <FeatureHeader type={gesture.hasAriaLabel ? 'good' : 'warning'}>
                  {gesture.hasAriaLabel ? <FaCheck color="#10b981" /> : <FaInfoCircle color="#d97706" />}
                  Touch Gesture Element
                </FeatureHeader>
                <FeatureDetails>
                  Element: {gesture.element}
                  <br />
                  ARIA Label: {gesture.hasAriaLabel ? 'Present' : 'Missing'}
                  <br />
                  Instructions: {gesture.hasInstructions ? 'Provides usage hints' : 'No usage instructions'}
                </FeatureDetails>
              </FeatureItem>
            ))}
          </FeatureList>
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
    </MobileAccessibilitySection>
  );
};

export default MobileAccessibilityResults;