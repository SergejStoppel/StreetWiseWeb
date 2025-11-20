import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/config';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

/**
 * GET /api/onboarding/status
 * Get current onboarding status for authenticated user
 */
router.get('/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch user onboarding data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('onboarding_completed, onboarding_step, onboarding_skipped, product_tour_completed, features_explored, first_analysis_completed, results_viewed_count')
      .eq('id', req.user.id)
      .single();

    if (userError) {
      throw userError;
    }

    // Get analysis count
    const { count: analysisCount, error: analysisError } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    if (analysisError) {
      console.error('Error fetching analysis count:', analysisError);
    }

    // Get website count
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', req.user.id);

    if (workspaceError) {
      console.error('Error fetching workspaces:', workspaceError);
    }

    const workspaceIds = workspaces?.map(w => w.id) || [];

    let websiteCount = 0;
    if (workspaceIds.length > 0) {
      const { count: webCount, error: webError } = await supabase
        .from('websites')
        .select('*', { count: 'exact', head: true })
        .in('workspace_id', workspaceIds);

      if (webError) {
        console.error('Error fetching website count:', webError);
      } else {
        websiteCount = webCount || 0;
      }
    }

    // Calculate completion status
    const steps = [
      { id: 1, name: 'create_account', completed: true }, // Always true if authenticated
      { id: 2, name: 'add_website', completed: websiteCount > 0 },
      { id: 3, name: 'run_analysis', completed: (analysisCount || 0) > 0 },
      { id: 4, name: 'view_results', completed: userData.results_viewed_count > 0 },
      { id: 5, name: 'explore_features', completed: (userData.features_explored?.length || 0) >= 3 },
    ];

    const completedSteps = steps.filter(s => s.completed).length;
    const progress = Math.round((completedSteps / steps.length) * 100);

    // Determine current step (first incomplete step)
    const currentStep = steps.find(s => !s.completed)?.id || 5;

    return res.json({
      success: true,
      data: {
        onboarding_completed: userData.onboarding_completed,
        onboarding_step: userData.onboarding_step,
        onboarding_skipped: userData.onboarding_skipped,
        product_tour_completed: userData.product_tour_completed,
        features_explored: userData.features_explored || [],
        progress,
        currentStep,
        steps,
        stats: {
          totalWebsites: websiteCount,
          totalAnalyses: analysisCount || 0,
          resultsViewed: userData.results_viewed_count,
          featuresExplored: userData.features_explored?.length || 0,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch onboarding status',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/onboarding/complete-step
 * Mark a specific onboarding step as completed
 */
router.post('/complete-step', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }

    const { step, completed } = req.body;

    if (typeof step !== 'number' || step < 0 || step > 5) {
      return res.status(400).json({
        success: false,
        message: 'Invalid step number (must be 0-5)',
        timestamp: new Date().toISOString(),
      });
    }

    // Call database function to update onboarding step
    const { error } = await supabase.rpc('update_onboarding_step', {
      p_user_id: req.user.id,
      p_step: step,
      p_completed: completed || false,
    });

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      message: 'Onboarding step updated',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating onboarding step:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update onboarding step',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/onboarding/skip
 * Mark onboarding as skipped
 */
router.post('/skip', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }

    const { error } = await supabase
      .from('users')
      .update({
        onboarding_skipped: true,
        onboarding_completed: true,
        last_onboarding_update: new Date().toISOString(),
      })
      .eq('id', req.user.id);

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      message: 'Onboarding skipped',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error skipping onboarding:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to skip onboarding',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/onboarding/reset
 * Reset onboarding progress for user
 */
router.post('/reset', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }

    const { error } = await supabase
      .from('users')
      .update({
        onboarding_completed: false,
        onboarding_step: 0,
        onboarding_skipped: false,
        product_tour_completed: false,
        last_onboarding_update: new Date().toISOString(),
      })
      .eq('id', req.user.id);

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      message: 'Onboarding reset successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset onboarding',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/onboarding/complete-tour
 * Mark product tour as completed
 */
router.post('/complete-tour', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }

    const { error } = await supabase
      .from('users')
      .update({
        product_tour_completed: true,
        last_onboarding_update: new Date().toISOString(),
      })
      .eq('id', req.user.id);

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      message: 'Product tour completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error completing product tour:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete product tour',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/onboarding/record-interaction
 * Record a feature interaction
 */
router.post('/record-interaction', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }

    const { feature_name, interaction_type, metadata } = req.body;

    if (!feature_name || !interaction_type) {
      return res.status(400).json({
        success: false,
        message: 'feature_name and interaction_type are required',
        timestamp: new Date().toISOString(),
      });
    }

    const validInteractionTypes = ['viewed', 'clicked', 'completed', 'dismissed'];
    if (!validInteractionTypes.includes(interaction_type)) {
      return res.status(400).json({
        success: false,
        message: `interaction_type must be one of: ${validInteractionTypes.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Call database function to record interaction
    const { data, error } = await supabase.rpc('record_feature_interaction', {
      p_user_id: req.user.id,
      p_feature_name: feature_name,
      p_interaction_type: interaction_type,
      p_metadata: metadata || {},
    });

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      message: 'Interaction recorded',
      data: { interaction_id: data },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error recording interaction:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record interaction',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/onboarding/mark-results-viewed
 * Increment results viewed counter
 */
router.post('/mark-results-viewed', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }

    // Get current count
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('results_viewed_count')
      .eq('id', req.user.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const newCount = (userData.results_viewed_count || 0) + 1;

    // Update count and potentially update onboarding step
    const { error } = await supabase
      .from('users')
      .update({
        results_viewed_count: newCount,
        onboarding_step: newCount === 1 ? 4 : undefined, // Move to step 4 on first view
      })
      .eq('id', req.user.id);

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      message: 'Results viewed count updated',
      data: { count: newCount },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating results viewed count:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update results viewed count',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
