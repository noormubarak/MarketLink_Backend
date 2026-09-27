import { Router } from 'express';
import * as c from '../controllers/adminController.js';
import { verifyJWT, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(verifyJWT, requireRole('admin'));

// Analytics
router.get('/analytics', c.analytics);              // ← NEW

// Product Moderation
router.get('/products', c.listAllProducts);          // ← NEW
router.delete('/products/:id', c.removeProduct);
// Dashboard & Reports
router.get('/dashboard', c.dashboard);
router.get('/reports', c.reports);

// Farmer Management
router.get('/farmers/pending', c.pendingFarmers);
router.patch('/farmers/:id/approve', c.approveFarmer);
router.patch('/farmers/:id/suspend', c.suspendFarmer);

// Customer Management
router.get('/customers', c.listCustomers);           // ← NEW
router.patch('/customers/:id/status', c.setCustomerStatus);

// Content Moderation
router.delete('/products/:id', c.removeProduct);
router.get('/reviews', c.listReviews);               // ← NEW
router.delete('/reviews/:id', c.removeReview);       // ← NEW

// Market Management
router.post('/markets', c.createMarket);
router.put('/markets/:id', c.updateMarket);
router.delete('/markets/:id', c.deleteMarket);

export default router;