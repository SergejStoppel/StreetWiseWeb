import express from 'express';
import { ApiResponse } from '@/types';

const router = express.Router();

/**
 * @swagger
 * /api/analyses:
 *   post:
 *     summary: Start new analysis
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               websiteId:
 *                 type: string
 *                 format: uuid
 *               analysisTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [accessibility, seo, performance]
 *     responses:
 *       201:
 *         description: Analysis started
 */
router.post('/', (req, res) => {
  const response: ApiResponse = {
    success: false,
    message: 'Analysis endpoints not yet implemented',
    timestamp: new Date().toISOString(),
  };
  res.status(501).json(response);
});

/**
 * @swagger
 * /api/analyses/{id}:
 *   get:
 *     summary: Get analysis status
 *     tags: [Analyses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Analysis status
 */
router.get('/:id', (req, res) => {
  const response: ApiResponse = {
    success: false,
    message: 'Analysis endpoints not yet implemented',
    timestamp: new Date().toISOString(),
  };
  res.status(501).json(response);
});

export default router;