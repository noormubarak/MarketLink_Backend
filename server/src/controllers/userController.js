import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, imageUrl } = req.body;

  const updateData = { name, phone, address };
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true }
  ).select('-passwordHash');

  return ok(res, user, 'Profile updated');
});