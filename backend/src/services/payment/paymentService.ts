/**
 * Payment Service
 * Handles payment processing for deep analyses
 * Currently mocked - will integrate Stripe later
 */

import { supabase } from '@/config/supabase';
import { createLogger } from '@/config/logger';
import { quotaService } from '@/services/quota/quotaService';

const logger = createLogger('payment-service');

// Price in cents
const DEEP_ANALYSIS_PRICE_CENTS = 4900; // $49.00
const CURRENCY = 'usd';

export interface Payment {
  id: string;
  user_id: string;
  analysis_id: string | null;
  amount_cents: number;
  currency: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'mocked';
  is_mocked: boolean;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
  completed_at: string | null;
}

export interface CheckoutSession {
  id: string;
  url: string;
  paymentId: string;
  isMocked: boolean;
}

class PaymentService {
  /**
   * Create a checkout session for deep analysis
   * Returns URL to redirect user to payment
   */
  async createCheckoutSession(
    userId: string,
    analysisUrl: string,
    options: { mock?: boolean } = {}
  ): Promise<CheckoutSession | null> {
    try {
      // For now, always mock unless Stripe is configured
      const isMocked = options.mock ?? !this.isStripeConfigured();

      // Create payment record
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          amount_cents: DEEP_ANALYSIS_PRICE_CENTS,
          currency: CURRENCY,
          status: 'pending',
          is_mocked: isMocked,
          description: `Deep Analysis for ${analysisUrl}`,
          metadata: { url: analysisUrl }
        })
        .select()
        .single();

      if (error || !payment) {
        logger.error('Failed to create payment record', { userId, error });
        return null;
      }

      if (isMocked) {
        // Return mock checkout URL that will auto-complete
        logger.info('Created mocked checkout session', { paymentId: payment.id, userId });
        return {
          id: `mock_session_${payment.id}`,
          url: `/api/payments/mock-checkout/${payment.id}`,
          paymentId: payment.id,
          isMocked: true
        };
      }

      // TODO: Integrate real Stripe checkout
      // const session = await stripe.checkout.sessions.create({...});
      // return { id: session.id, url: session.url, paymentId: payment.id, isMocked: false };

      logger.warn('Stripe not configured, returning mock session');
      return {
        id: `mock_session_${payment.id}`,
        url: `/api/payments/mock-checkout/${payment.id}`,
        paymentId: payment.id,
        isMocked: true
      };

    } catch (error) {
      logger.error('Error creating checkout session', { userId, error });
      return null;
    }
  }

  /**
   * Complete a mocked payment (for development)
   */
  async completeMockedPayment(paymentId: string): Promise<Payment | null> {
    try {
      const { data: payment, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (fetchError || !payment) {
        logger.error('Payment not found', { paymentId });
        return null;
      }

      if (!payment.is_mocked) {
        logger.error('Cannot mock-complete a real payment', { paymentId });
        return null;
      }

      // Update payment status
      const { data: updated, error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'mocked',
          completed_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (updateError) {
        logger.error('Failed to complete mocked payment', { paymentId, error: updateError });
        return null;
      }

      // Upgrade user to paid tier
      await quotaService.upgradeToPaidTier(payment.user_id);

      logger.info('Mocked payment completed', { paymentId, userId: payment.user_id });
      return updated;

    } catch (error) {
      logger.error('Error completing mocked payment', { paymentId, error });
      return null;
    }
  }

  /**
   * Handle Stripe webhook (for when Stripe is integrated)
   */
  async handleStripeWebhook(event: any): Promise<boolean> {
    // TODO: Implement when Stripe is added
    logger.info('Stripe webhook received', { type: event.type });

    switch (event.type) {
      case 'checkout.session.completed':
        // const session = event.data.object;
        // await this.onPaymentSuccess(session);
        break;
      case 'payment_intent.payment_failed':
        // await this.onPaymentFailed(event.data.object);
        break;
    }

    return true;
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error) {
        logger.error('Failed to get payment', { paymentId, error });
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Error getting payment', { paymentId, error });
      return null;
    }
  }

  /**
   * Get user's payment history
   */
  async getUserPayments(userId: string): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to get user payments', { userId, error });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error getting user payments', { userId, error });
      return [];
    }
  }

  /**
   * Link payment to analysis
   */
  async linkPaymentToAnalysis(paymentId: string, analysisId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ analysis_id: analysisId })
        .eq('id', paymentId);

      if (error) {
        logger.error('Failed to link payment to analysis', { paymentId, analysisId, error });
        return false;
      }

      // Also update analysis with payment reference
      await supabase
        .from('analyses')
        .update({ payment_id: paymentId })
        .eq('id', analysisId);

      return true;
    } catch (error) {
      logger.error('Error linking payment to analysis', { paymentId, analysisId, error });
      return false;
    }
  }

  /**
   * Check if user has paid for a specific analysis
   */
  async hasUserPaidForAnalysis(userId: string, analysisId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('id')
        .eq('user_id', userId)
        .eq('analysis_id', analysisId)
        .in('status', ['completed', 'mocked'])
        .limit(1);

      if (error) {
        logger.error('Failed to check payment status', { userId, analysisId, error });
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      logger.error('Error checking payment status', { userId, analysisId, error });
      return false;
    }
  }

  /**
   * Check if Stripe is configured
   */
  private isStripeConfigured(): boolean {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    return !!stripeKey && stripeKey.length > 0;
  }

  /**
   * Get price info
   */
  getPriceInfo(): { amount: number; currency: string; formatted: string } {
    return {
      amount: DEEP_ANALYSIS_PRICE_CENTS,
      currency: CURRENCY,
      formatted: `$${(DEEP_ANALYSIS_PRICE_CENTS / 100).toFixed(2)}`
    };
  }
}

export const paymentService = new PaymentService();
export default paymentService;
