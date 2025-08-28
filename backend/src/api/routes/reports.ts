import express from 'express';
import { ApiResponse } from '@/types';

const router = express.Router();

/**
 * @swagger
 * /api/reports/{analysisId}:
 *   get:
 *     summary: Get analysis report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: analysisId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [free, detailed]
 *           default: free
 *     responses:
 *       200:
 *         description: Analysis report
 *       402:
 *         description: Payment required for detailed report
 */
router.get('/:analysisId', (req, res) => {
  const response: ApiResponse = {
    success: false,
    message: 'Report endpoints not yet implemented',
    timestamp: new Date().toISOString(),
  };
  res.status(501).json(response);
});

export default router;