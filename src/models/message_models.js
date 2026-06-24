import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {type: mongoose.Schema.Types.ObjectId,ref: 'users',required: true
  },
  receiver: {type: mongoose.Schema.Types.ObjectId,ref: 'users',required: true
  },
  text: {type: String,required: true,trim: true
  },
  isRead: {type: Boolean,default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('messages', messageSchema);
