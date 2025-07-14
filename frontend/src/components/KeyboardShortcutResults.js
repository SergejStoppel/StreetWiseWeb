import React from 'react';
import styled from 'styled-components';
import { 
  FaKeyboard, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaInfoCircle,
  FaTimes,
  FaCheck
} from 'react-icons/fa';

const KeyboardShortcutSection = styled.section`
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

const AccessKeyList = styled.div`
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const AccessKeyItem = styled.div`
  padding: 1rem;
  background: ${props => {
    if (props.type === 'conflict') return '#fef2f2';
    if (props.type === 'duplicate') return '#fff7ed';
    return '#f0f9ff';
  }};
  border: 1px solid ${props => {
    if (props.type === 'conflict') return '#fecaca';
    if (props.type === 'duplicate') return '#fed7aa';
    return '#bfdbfe';
  }};
  border-radius: 0.5rem;
  font-family: monospace;
  font-size: 0.875rem;
`;

const AccessKeyHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const AccessKeyDetails = styled.div`
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

const KeyboardShortcutResults = ({ keyboardShortcutData }) => {
  if (!keyboardShortcutData || keyboardShortcutData.summary?.testFailed) {
    return null;
  }

  const { summary, accessKeys, shortcuts, issues } = keyboardShortcutData;

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

  return (
    <KeyboardShortcutSection>
      <SectionTitle>
        <FaKeyboard />
        Keyboard Shortcut Accessibility Analysis
      </SectionTitle>
      
      <ScoreGrid>
        <ScoreCard>
          <ScoreIcon color={getScoreColor(summary.score)}>
            <FaKeyboard />
          </ScoreIcon>
          <ScoreValue>{summary.score}%</ScoreValue>
          <ScoreLabel>Keyboard Shortcut Score</ScoreLabel>
        </ScoreCard>
        
        <ScoreCard>
          <ScoreIcon color="#6b7280">
            <FaKeyboard />
          </ScoreIcon>
          <ScoreValue>{summary.totalAccessKeys}</ScoreValue>
          <ScoreLabel>Total Access Keys</ScoreLabel>
        </ScoreCard>
        
        <ScoreCard>
          <ScoreIcon color={summary.conflictingAccessKeys > 0 ? "#ef4444" : "#10b981"}>
            {summary.conflictingAccessKeys > 0 ? <FaTimes /> : <FaCheck />}
          </ScoreIcon>
          <ScoreValue>{summary.conflictingAccessKeys}</ScoreValue>
          <ScoreLabel>Conflicting Keys</ScoreLabel>
        </ScoreCard>
        
        <ScoreCard>
          <ScoreIcon color={summary.reservedConflicts > 0 ? "#ef4444" : "#10b981"}>
            {summary.reservedConflicts > 0 ? <FaTimes /> : <FaCheck />}
          </ScoreIcon>
          <ScoreValue>{summary.reservedConflicts}</ScoreValue>
          <ScoreLabel>Reserved Conflicts</ScoreLabel>
        </ScoreCard>
      </ScoreGrid>

      {/* Keyboard Shortcut Compliance */}
      <div style={{ 
        background: summary.conflictingAccessKeys === 0 ? '#f0f9ff' : '#fef2f2', 
        padding: '1rem', 
        borderRadius: '0.5rem', 
        marginBottom: '1.5rem',
        border: `1px solid ${summary.conflictingAccessKeys === 0 ? '#bfdbfe' : '#fecaca'}`
      }}>
        <div style={{ 
          fontWeight: '600', 
          color: summary.conflictingAccessKeys === 0 ? '#1e40af' : '#dc2626',
          marginBottom: '0.5rem'
        }}>
          {summary.conflictingAccessKeys === 0 ? 
            (summary.totalAccessKeys === 0 ? 
              '✅ No access keys found - no conflicts detected' :
              `✅ ${Math.round((summary.validAccessKeys / summary.totalAccessKeys) * 100)}% of access keys are properly implemented`
            ) :
            `⚠️ ${summary.conflictingAccessKeys} access key conflicts detected`
          }
        </div>
        <div style={{ color: '#374151', fontSize: '0.875rem' }}>
          {summary.conflictingAccessKeys === 0 ? 
            (summary.totalAccessKeys === 0 ?
              'Page has no access keys defined. Consider adding them to improve keyboard navigation.' :
              'All access keys follow WCAG guidelines and don\'t conflict with browser shortcuts.'
            ) :
            'Some access keys conflict with browser or assistive technology shortcuts.'
          }
        </div>
      </div>

      {/* Conflicting Access Keys */}
      {accessKeys.conflicts && accessKeys.conflicts.length > 0 && (
        <DetailSection>
          <DetailTitle>Conflicting Access Keys</DetailTitle>
          <AccessKeyList>
            {accessKeys.conflicts.slice(0, 10).map((conflict, index) => (
              <AccessKeyItem key={index} type="conflict">
                <AccessKeyHeader>
                  <FaExclamationTriangle color="#dc2626" />
                  accesskey="{conflict.accessKey}" - {conflict.element}
                </AccessKeyHeader>
                <AccessKeyDetails>
                  {conflict.conflictsWith && `Conflicts with: ${conflict.conflictsWith}`}
                  <br />
                  Element: {conflict.tagName}
                  {conflict.text && ` - "${conflict.text}"`}
                </AccessKeyDetails>
              </AccessKeyItem>
            ))}
          </AccessKeyList>
        </DetailSection>
      )}

      {/* Duplicate Access Keys */}
      {accessKeys.duplicates && accessKeys.duplicates.length > 0 && (
        <DetailSection>
          <DetailTitle>Duplicate Access Keys</DetailTitle>
          <AccessKeyList>
            {accessKeys.duplicates.slice(0, 5).map((duplicate, index) => (
              <AccessKeyItem key={index} type="duplicate">
                <AccessKeyHeader>
                  <FaInfoCircle color="#d97706" />
                  accesskey="{duplicate.accessKey}" (used by {duplicate.elements.length} elements)
                </AccessKeyHeader>
                <AccessKeyDetails>
                  Elements using this key:
                  {duplicate.elements.map((el, i) => (
                    <div key={i}>• {el.element} ({el.tagName})</div>
                  ))}
                </AccessKeyDetails>
              </AccessKeyItem>
            ))}
          </AccessKeyList>
        </DetailSection>
      )}

      {/* All Access Keys */}
      {accessKeys.all && accessKeys.all.length > 0 && (
        <DetailSection>
          <DetailTitle>All Access Keys ({accessKeys.all.length})</DetailTitle>
          <AccessKeyList>
            {accessKeys.all.slice(0, 15).map((accessKey, index) => (
              <AccessKeyItem key={index}>
                <AccessKeyHeader>
                  <FaKeyboard color="#2563eb" />
                  accesskey="{accessKey.accessKey}" - {accessKey.element}
                </AccessKeyHeader>
                <AccessKeyDetails>
                  Element: {accessKey.tagName}
                  {accessKey.text && ` - "${accessKey.text}"`}
                  <br />
                  Visible: {accessKey.isVisible ? 'Yes' : 'No'}
                  {accessKey.hasLabel ? ' • Has Label' : ' • No Label'}
                </AccessKeyDetails>
              </AccessKeyItem>
            ))}
            {accessKeys.all.length > 15 && (
              <div style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
                ...and {accessKeys.all.length - 15} more access keys
              </div>
            )}
          </AccessKeyList>
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
                  {issue.note && issue.note}
                  {issue.suggestion && issue.suggestion}
                </IssueDescription>
                <WcagReference>
                  WCAG Criterion: {issue.wcagCriterion}
                </WcagReference>
              </IssueItem>
            ))}
          </IssueList>
        </DetailSection>
      )}

      {/* Keyboard Event Handlers */}
      {shortcuts.detected && shortcuts.detected.length > 0 && (
        <DetailSection>
          <DetailTitle>Custom Keyboard Event Handlers ({shortcuts.detected.length})</DetailTitle>
          <div style={{ 
            fontSize: '0.875rem', 
            color: '#6b7280', 
            marginBottom: '1rem' 
          }}>
            Elements with custom keyboard event handlers. Ensure these don't interfere with assistive technology.
          </div>
          <AccessKeyList>
            {shortcuts.detected.slice(0, 10).map((handler, index) => (
              <AccessKeyItem key={index}>
                <AccessKeyHeader>
                  <FaKeyboard color="#6b7280" />
                  {handler.element}
                </AccessKeyHeader>
                <AccessKeyDetails>
                  Element: {handler.tagName}
                  <br />
                  Events: {[
                    handler.hasKeydown && 'keydown',
                    handler.hasKeyup && 'keyup', 
                    handler.hasKeypress && 'keypress'
                  ].filter(Boolean).join(', ')}
                  <br />
                  Visible: {handler.isVisible ? 'Yes' : 'No'}
                </AccessKeyDetails>
              </AccessKeyItem>
            ))}
            {shortcuts.detected.length > 10 && (
              <div style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
                ...and {shortcuts.detected.length - 10} more handlers
              </div>
            )}
          </AccessKeyList>
        </DetailSection>
      )}
    </KeyboardShortcutSection>
  );
};

export default KeyboardShortcutResults;