import mongoose from 'mongoose';

// In-app notification shown in the navbar bell. Created on user activity
// (publish, purchase, sale, etc.) by the createNotification helper.
const notificationSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type:    { type: String, default: 'info' }, // info | success | sale | purchase | publish
    title:   { type: String, required: true },
    message: { type: String, default: '' },
    read:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
