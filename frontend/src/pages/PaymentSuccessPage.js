/**
 * Payment Success Page
 * Shown after successful payment for deep analysis
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaCheckCircle, FaSpinner, FaArrowRight } from 'react-icons/fa';
import { paymentApi } from '../services/quotaApi';

const Container = styled.div`
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
`;

const Card = styled.div`
  background: var(--color-surface);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-2xl);
  text-align: center;
  max-width: 500px;
  width: 100%;
  box-shadow: var(--shadow-lg);
`;

const SuccessIcon = styled.div`
  font-size: 64px;
  color: var(--color-success);
  margin-bottom: var(--spacing-lg);
`;

const Title = styled.h1`
  font-size: var(--font-size-2xl);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
`;

const Description = styled.p`
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
`;

const Button = styled.button`
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: background 0.2s;

  &:hover {
    background: var(--color-primary-dark, #1a56db);
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  color: var(--color-text-secondary);

  svg {
    font-size: 48px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);

  const paymentId = searchParams.get('payment_id');
  const analysisId = searchParams.get('analysis_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!paymentId) {
        setLoading(false);
        return;
      }

      try {
        const response = await paymentApi.getPayment(paymentId);
        if (response.success) {
          setPayment(response.data);
        }
      } catch (error) {
        console.error('Failed to verify payment:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [paymentId]);

  const handleViewResults = () => {
    if (analysisId) {
      navigate(`/results/${analysisId}`);
    } else {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <Container>
        <Card>
          <LoadingState>
            <FaSpinner />
            <p>Verifying payment...</p>
          </LoadingState>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <SuccessIcon>
          <FaCheckCircle />
        </SuccessIcon>

        <Title>Payment Successful!</Title>

        <Description>
          Your deep analysis is now being processed.
          AI-powered insights will be available shortly.
        </Description>

        <Button onClick={handleViewResults}>
          View Analysis <FaArrowRight />
        </Button>
      </Card>
    </Container>
  );
};

export default PaymentSuccessPage;
