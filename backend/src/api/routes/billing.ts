import express from 'express';
import { ApiResponse } from '@/types';

const router = express.Router();

/**
 * @swagger
 * /api/billing/subscription:
 *   post:
 *     summary: Create subscription checkout session
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checkout session created
 */
router.post('/subscription', (req, res) => {
  const response: ApiResponse = {
    success: false,
    message: 'Billing endpoints not yet implemented',
    timestamp: new Date().toISOString(),
  };
  res.status(501).json(response);
});

/**
 * @swagger
 * /api/billing/credits:
 *   post:
 *     summary: Purchase credits
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               package:
 *                 type: string
 *                 enum: [single, starter, value]
 *     responses:
 *       200:
 *         description: Credit purchase session created
 */
router.post('/credits', (req, res) => {
  const response: ApiResponse = {
    success: false,
    message: 'Billing endpoints not yet implemented',
    timestamp: new Date().toISOString(),
  };
  res.status(501).json(response);
});

/**
 * @swagger
 * /api/billing/webhook:
 *   post:
 *     summary: Stripe webhook handler
 *     tags: [Billing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook', (req, res) => {
  const response: ApiResponse = {
    success: false,
    message: 'Billing endpoints not yet implemented',
    timestamp: new Date().toISOString(),
  };
  res.status(501).json(response);
});

export default router;