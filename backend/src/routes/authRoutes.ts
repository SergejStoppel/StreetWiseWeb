import express from 'express';
import authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateRegister, validateLogin } from '../middleware/validation';
import { authRateLimit } from '../middleware/rateLimiter';

const router = express.Router();

// Debug route to test if module is loaded
router.get('/debug', (_req, res) => {
  res.json({ message: 'Auth routes loaded successfully!' });
});

// Authentication routes
router.post('/register', authRateLimit, validateRegister, authController.register);
router.post('/login', authRateLimit, validateLogin, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/logout-all', authenticate, authController.logoutAllDevices);

// Profile routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, authController.changePassword);
router.post('/deactivate', authenticate, authController.deactivateAccount);

export default router;