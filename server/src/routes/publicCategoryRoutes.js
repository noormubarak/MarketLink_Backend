import { Router } from 'express';
import Category from '../models/Category.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

const router = Router();

// Public: any visitor can read active categories
router.get('/', asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('name');
  return ok(res, categories);
}));

export default router;