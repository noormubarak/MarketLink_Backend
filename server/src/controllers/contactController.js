import ContactMessage from '../models/ContactMessage.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, fail } from '../utils/response.js';

export const create = asyncHandler(async (req, res) => {
  const subject = typeof req.body.subject === 'string' ? req.body.subject.trim() : '';
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';

  if (!message) return fail(res, 'Please enter a message.');
  if (subject.length > 120) return fail(res, 'Subject must be 120 characters or fewer.');
  if (message.length > 3000) return fail(res, 'Message must be 3000 characters or fewer.');

  const contactMessage = await ContactMessage.create({
    userId: req.user._id,
    name: req.user.name,
    email: req.user.email,
    subject,
    message,
  });

  return ok(res, { _id: contactMessage._id }, 'Your message has been sent.', 201);
});

export const list = asyncHandler(async (_req, res) => {
  const messages = await ContactMessage.find()
    .select('name email subject message createdAt')
    .sort('-createdAt')
    .limit(500);

  return ok(res, messages);
});