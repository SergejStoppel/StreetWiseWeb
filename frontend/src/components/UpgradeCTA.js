/**
 * UpgradeCTA Component
 * Call-to-action for upgrading to deep analysis
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { FaRocket, FaBrain, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { paymentApi } from '../services/quotaApi';

const CTAContainer = styled.div`
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #1a56db));
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  color: white;
  text-align: center;
`;

const CTATitle = styled.h3`
  font-size: var(--font-size-xl);
  margin-bottom: var(--spacing-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
`;

const CTADescription = styled.p`
  font-size: var(--font-size-md);
  opacity: 0.9;
  margin-bottom: var(--spacing-lg);
`;

const Price = styled.div`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-md);

  span {
    font-size: var(--font-size-md);
    opacity: 0.8;
  }
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 var(--spacing-lg) 0;
  text-align: left;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
`;

const Feature = styled.li`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
  font-size: var(--font-size-sm);

  svg {
    color: #4ade80;
    flex-shrink: 0;
  }
`;

const UpgradeButton = styled.button`
  background: white;
  color: var(--color-primary);
  border: none;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const IssueCount = styled.div`
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-lg);
`;

const UpgradeCTA = ({ analysisId, totalIssues, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await paymentApi.createCheckout(analysisId);
      if (response.success && response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        setError('Failed to start checkout');
      }
    } catch (err) {
      setError(err.message || 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Complete analysis of all issues',
    'AI-powered fix recommendations',
    'Priority action items',
    'Content quality score',
    'Keyword suggestions',
    'Competitive insights'
  ];

  return (
    <CTAContainer>
      <CTATitle>
        <FaBrain /> Get Full AI Analysis
      </CTATitle>

      {totalIssues > 0 && (
        <IssueCount>
          We found <strong>{totalIssues} issues</strong> on your website
        </IssueCount>
      )}

      <CTADescription>
        Unlock detailed explanations and AI-powered recommendations
      </CTADescription>

      <Price>
        $49 <span>one-time</span>
      </Price>

      <FeatureList>
        {features.map((feature, index) => (
          <Feature key={index}>
            <FaCheckCircle />
            {feature}
          </Feature>
        ))}
      </FeatureList>

      <UpgradeButton onClick={handleUpgrade} disabled={loading}>
        {loading ? (
          <>
            <FaSpinner className="spin" /> Processing...
          </>
        ) : (
          <>
            <FaRocket /> Get Full Analysis
          </>
        )}
      </UpgradeButton>

      {error && (
        <p style={{ color: '#fca5a5', marginTop: 'var(--spacing-sm)' }}>
          {error}
        </p>
      )}
    </CTAContainer>
  );
};

export default UpgradeCTA;
