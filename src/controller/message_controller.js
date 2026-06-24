import user_models from '../models/user_models.js';
import message_models from '../models/message_models.js';
import { error } from '../errorhandling/error.js';

export const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const friendId = req.params.friendId;

    // Mark received messages from this friend as read
    await message_models.updateMany(
      { sender: friendId, receiver: currentUserId, isRead: false },
      { $set: { isRead: true } }
    );

    const messages = await message_models.find({
      $or: [
        { sender: currentUserId, receiver: friendId },
        { sender: friendId, receiver: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    return res.status(200).json({ status: true, messages });
  } catch (err) {
    error(err, res);
  }
};

export const getChatList = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const user = await user_models.findById(currentUserId).populate('friends', 'name email profileImg user');
    if (!user) {
      return res.status(404).json({ status: false, msg: "User not found" });
    }

    const chatList = [];

    for (const friend of user.friends) {
      // Find last message
      const lastMessage = await message_models.findOne({
        $or: [
          { sender: currentUserId, receiver: friend._id },
          { sender: friend._id, receiver: currentUserId }
        ]
      }).sort({ createdAt: -1 });

      // Count unread messages
      const unreadCount = await message_models.countDocuments({
        sender: friend._id,
        receiver: currentUserId,
        isRead: false
      });

      chatList.push({
        id: friend._id,
        name: friend.name,
        email: friend.email,
        profileImg: friend.profileImg,
        online: friend.user?.isOnline || false,
        avatar: friend.name ? friend.name.charAt(0).toUpperCase() : 'U',
        lastMsg: lastMessage ? lastMessage.text : 'No messages yet',
        time: lastMessage ? formatTimeDifference(lastMessage.createdAt) : '',
        unread: unreadCount,
        lastMsgTime: lastMessage ? lastMessage.createdAt : new Date(0)
      });
    }

    // Sort chat list by last message time (most recent first)
    chatList.sort((a, b) => b.lastMsgTime - a.lastMsgTime);

    return res.status(200).json({ status: true, chatList });
  } catch (err) {
    error(err, res);
  }
};

function formatTimeDifference(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d`;
}
