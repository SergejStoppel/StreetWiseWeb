import express from 'express';
import authController from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateRegistration, validateLogin } from '../middleware/validation';
import { authRateLimit } from '../middleware/rateLimiter';

const router = express.Router();

// Authentication routes
router.post('/register', authRateLimit, validateRegistration, authController.register);
router.post('/login', authRateLimit, validateLogin, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/logout-all', authenticateToken, authController.logoutAllDevices);

// Profile routes
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/change-password', authenticateToken, authController.changePassword);
router.post('/deactivate', authenticateToken, authController.deactivateAccount);

export default router;