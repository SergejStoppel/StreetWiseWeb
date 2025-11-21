/**
 * Payment API Routes
 * Handles checkout sessions and payment webhooks
 */

import { Router, Request, Response, NextFunction } from 'express';
import { paymentService } from '@/services/payment/paymentService';
import { quotaService } from '@/services/quota/quotaService';
import { createLogger } from '@/config/logger';

const router = Router();
const logger = createLogger('payment-routes');

/**
 * GET /api/payments/price
 * Get current pricing information
 */
router.get('/price', async (req: Request, res: Response) => {
  const priceInfo = paymentService.getPriceInfo();

  res.json({
    success: true,
    data: {
      deepAnalysis: {
        amount: priceInfo.amount,
        currency: priceInfo.currency,
        formatted: priceInfo.formatted,
        description: 'Full deep analysis with AI-powered recommendations'
      }
    }
  });
});

/**
 * POST /api/payments/checkout
 * Create a checkout session for deep analysis
 */
router.post('/checkout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { url } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please sign in to purchase a deep analysis'
      });
    }

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    const session = await paymentService.createCheckoutSession(userId, url);

    if (!session) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create checkout session'
      });
    }

    logger.info('Checkout session created', {
      userId,
      url,
      paymentId: session.paymentId,
      isMocked: session.isMocked
    });

    res.json({
      success: true,
      data: {
        checkoutUrl: session.url,
        sessionId: session.id,
        paymentId: session.paymentId,
        isMocked: session.isMocked
      }
    });

  } catch (error) {
    logger.error('Error creating checkout', { error: (error as Error).message });
    next(error);
  }
});

/**
 * GET /api/payments/mock-checkout/:paymentId
 * Mock checkout page for development
 * In production, this would redirect to Stripe
 */
router.get('/mock-checkout/:paymentId', async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const payment = await paymentService.getPayment(paymentId);

  if (!payment) {
    return res.status(404).send('Payment not found');
  }

  if (!payment.is_mocked) {
    return res.status(400).send('This is not a mocked payment');
  }

  // Return a simple HTML page for mock checkout
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Mock Checkout - Deep Analysis</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 500px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #333; margin-bottom: 20px; }
    .price { font-size: 32px; color: #2563eb; margin: 20px 0; }
    .description { color: #666; margin-bottom: 30px; }
    .url {
      background: #f0f0f0;
      padding: 10px;
      border-radius: 4px;
      word-break: break-all;
      margin-bottom: 20px;
    }
    button {
      width: 100%;
      padding: 15px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 18px;
      cursor: pointer;
    }
    button:hover { background: #1d4ed8; }
    .mock-notice {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 20px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="mock-notice">
      ⚠️ This is a mock checkout for development. No real payment will be processed.
    </div>
    <h1>Deep Analysis</h1>
    <div class="price">$49.00</div>
    <div class="description">
      Full analysis with AI-powered recommendations for:
    </div>
    <div class="url">${payment.metadata?.url || 'Your website'}</div>
    <form action="/api/payments/mock-complete/${paymentId}" method="POST">
      <button type="submit">Complete Mock Payment</button>
    </form>
  </div>
</body>
</html>
  `;

  res.send(html);
});

/**
 * POST /api/payments/mock-complete/:paymentId
 * Complete a mocked payment (development only)
 */
router.post('/mock-complete/:paymentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentId } = req.params;

    const payment = await paymentService.completeMockedPayment(paymentId);

    if (!payment) {
      return res.status(400).json({
        success: false,
        error: 'Failed to complete payment'
      });
    }

    logger.info('Mock payment completed', { paymentId, userId: payment.user_id });

    // Redirect to success page or return JSON based on accept header
    if (req.accepts('html')) {
      // Redirect to frontend with success
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/payment/success?payment_id=${paymentId}`);
    }

    res.json({
      success: true,
      message: 'Payment completed successfully',
      data: {
        paymentId: payment.id,
        status: payment.status
      }
    });

  } catch (error) {
    logger.error('Error completing mock payment', { error: (error as Error).message });
    next(error);
  }
});

/**
 * POST /api/payments/webhook
 * Stripe webhook handler (for future Stripe integration)
 */
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Verify Stripe signature
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    const event = req.body;

    const success = await paymentService.handleStripeWebhook(event);

    if (success) {
      res.json({ received: true });
    } else {
      res.status(400).json({ error: 'Webhook handling failed' });
    }

  } catch (error) {
    logger.error('Webhook error', { error: (error as Error).message });
    res.status(400).json({ error: 'Webhook error' });
  }
});

/**
 * GET /api/payments/history
 * Get user's payment history
 */
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const payments = await paymentService.getUserPayments(userId);

    res.json({
      success: true,
      data: payments.map(p => ({
        id: p.id,
        amount: p.amount_cents / 100,
        currency: p.currency,
        status: p.status,
        description: p.description,
        analysisId: p.analysis_id,
        createdAt: p.created_at,
        completedAt: p.completed_at
      }))
    });

  } catch (error) {
    logger.error('Error getting payment history', { error: (error as Error).message });
    next(error);
  }
});

/**
 * GET /api/payments/:id
 * Get specific payment details
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const payment = await paymentService.getPayment(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Only allow users to see their own payments
    if (payment.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        id: payment.id,
        amount: payment.amount_cents / 100,
        currency: payment.currency,
        status: payment.status,
        description: payment.description,
        analysisId: payment.analysis_id,
        createdAt: payment.created_at,
        completedAt: payment.completed_at
      }
    });

  } catch (error) {
    logger.error('Error getting payment', { error: (error as Error).message });
    next(error);
  }
});

export default router;
