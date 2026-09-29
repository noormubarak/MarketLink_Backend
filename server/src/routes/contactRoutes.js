import { Router } from 'express';
import * as c from '../controllers/contactController.js';
import { verifyJWT, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', verifyJWT, requireRole('customer'), c.create);
router.get('/', verifyJWT, requireRole('admin'), c.list);

export default router;