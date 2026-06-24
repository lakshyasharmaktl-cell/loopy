import mongoose from 'mongoose';

const snapSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  image: { type: String, required: true }, // base64 or URL
  createdAt: { type: Date, default: Date.now },
  // streak is stored on receiver side; kept for reference
  streak: { type: Number, default: 1 },
});

export default mongoose.model('snaps', snapSchema);
