import express from 'express';
import { ApiResponse } from '@/types';
import { authenticateToken, AuthRequest } from '@/api/middleware/auth';
import { supabase } from '@/config/supabase';

const router = express.Router();

/**
 * @swagger
 * /api/workspaces/websites:
 *   get:
 *     summary: Get websites in user's workspaces
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of websites
 */
router.get('/websites', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    // Get user's workspaces and their websites
    const { data: websites, error } = await supabase
      .from('websites')
      .select(`
        id,
        url,
        name,
        created_at,
        workspaces!inner (
          id,
          name,
          owner_id
        )
      `)
      .eq('workspaces.owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Websites retrieved successfully',
      data: websites || [],
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/workspaces:
 *   get:
 *     summary: Get user workspaces
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of workspaces
 */
router.get('/', (req, res) => {
  const response: ApiResponse = {
    success: false,
    message: 'Workspace endpoints not yet implemented',
    timestamp: new Date().toISOString(),
  };
  res.status(501).json(response);
});

/**
 * @swagger
 * /api/workspaces:
 *   post:
 *     summary: Create new workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Workspace created
 */
router.post('/', (req, res) => {
  const response: ApiResponse = {
    success: false,
    message: 'Workspace endpoints not yet implemented',
    timestamp: new Date().toISOString(),
  };
  res.status(501).json(response);
});

export default router;