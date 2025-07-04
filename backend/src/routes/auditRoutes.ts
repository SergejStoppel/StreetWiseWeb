import express from 'express';
import auditController from '../controllers/auditController';
import { auditRateLimit } from '../middleware/rateLimiter';

const router = express.Router();

// Audit routes
router.post('/scan', auditRateLimit, auditController.scanWebsite);
router.get('/results/:auditId', auditController.getAuditResults);
router.get('/recent', auditController.listRecentAudits);
router.get('/health', auditController.healthCheck);

export default router;