import express from 'express';
import { ApiResponse } from '@/types';
import { createAnalysis } from '@/lib/db/analysis';
import { masterQueue } from '@/lib/queue/master';

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
 *     responses:
 *       201:
 *         description: Analysis started
 */
router.post('/', async (req, res, next) => {
  try {
    const { websiteId } = req.body;
    // @ts-ignore
    const userId = req.user.id;

    const analysis = await createAnalysis(websiteId, userId);

    await masterQueue.add('master-analysis-job', { 
      analysisId: analysis.id, 
      websiteId, 
      userId 
    });

    const response: ApiResponse = {
      success: true,
      message: 'Analysis started successfully',
      data: analysis,
      timestamp: new Date().toISOString(),
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
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