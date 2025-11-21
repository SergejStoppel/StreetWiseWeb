/**
 * QuotaDisplay Component
 * Shows user's current scan quota and tier status
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaChartBar, FaCrown, FaFlask } from 'react-icons/fa';
import { quotaApi } from '../services/quotaApi';

const QuotaContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-surface-secondary);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
`;

const QuotaInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const QuotaLabel = styled.span`
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
`;

const QuotaValue = styled.span`
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
`;

const TierBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;

  ${({ $tier }) => {
    switch ($tier) {
      case 'tester':
        return `
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          color: white;
        `;
      case 'paid':
        return `
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
        `;
      default:
        return `
          background: var(--color-surface-tertiary);
          color: var(--color-text-secondary);
        `;
    }
  }}
`;

const ProgressBar = styled.div`
  width: 100px;
  height: 6px;
  background: var(--color-surface-tertiary);
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${({ $percentage }) =>
    $percentage >= 90 ? 'var(--color-error)' :
    $percentage >= 70 ? 'var(--color-warning)' :
    'var(--color-success)'
  };
  width: ${({ $percentage }) => Math.min(100, $percentage)}%;
  transition: width 0.3s ease;
`;

const QuotaDisplay = ({ compact = false }) => {
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuota();
  }, []);

  const loadQuota = async () => {
    try {
      const response = await quotaApi.getQuota();
      if (response.success) {
        setQuota(response.data);
      }
    } catch (error) {
      console.error('Failed to load quota:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!quota || quota.tier === 'guest') {
    return null;
  }

  const getTierIcon = () => {
    switch (quota.tier) {
      case 'tester':
        return <FaFlask />;
      case 'paid':
        return <FaCrown />;
      default:
        return <FaChartBar />;
    }
  };

  const percentage = quota.tier === 'tester'
    ? 0
    : (quota.scansUsed / quota.scansLimit) * 100;

  if (compact) {
    return (
      <TierBadge $tier={quota.tier}>
        {getTierIcon()}
        {quota.tier === 'tester' ? 'Tester' : `${quota.scansRemaining} scans left`}
      </TierBadge>
    );
  }

  return (
    <QuotaContainer>
      <TierBadge $tier={quota.tier}>
        {getTierIcon()}
        {quota.tier}
      </TierBadge>

      {quota.tier !== 'tester' && (
        <>
          <QuotaInfo>
            <QuotaLabel>Monthly Scans</QuotaLabel>
            <QuotaValue>{quota.scansUsed} / {quota.scansLimit}</QuotaValue>
          </QuotaInfo>

          <ProgressBar>
            <ProgressFill $percentage={percentage} />
          </ProgressBar>
        </>
      )}

      {quota.tier === 'tester' && (
        <QuotaInfo>
          <QuotaLabel>Unlimited Access</QuotaLabel>
          <QuotaValue>Testing Mode</QuotaValue>
        </QuotaInfo>
      )}
    </QuotaContainer>
  );
};

export default QuotaDisplay;
