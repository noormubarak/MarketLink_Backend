import Notification from '../models/Notification.js';

export const createNotification = async ({
  userId,
  type,
  message,
  link = '',
  imageUrl = '',
}) => {
  try {
    await Notification.create({
      userId,
      type,
      message,
      link,
      imageUrl,
    });
  } catch (e) {
    console.error('Notification failed', e.message);
  }
};