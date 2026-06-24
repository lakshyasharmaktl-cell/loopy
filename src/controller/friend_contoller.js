import user_models from '../models/user_models.js'
import { error } from '../errorhandling/error.js'

export const friends = async (req, res) => {
  try {
    const { requestId, action } = req.body;
    const currentUserId = req.user.id;

    const currentUser = await user_models.findById(currentUserId);
    const senderUser = await user_models.findById(requestId);

    if (!currentUser || !senderUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const requestExists = currentUser.friendRequests.some(id => id.toString() === requestId);

    if (!requestExists) {
      return res.status(400).json({ success: false, message: "Friend request not found" });
    }

    if (action === "accept") {
      // Remove from receiver's friendRequests
      currentUser.friendRequests = currentUser.friendRequests.filter(
        (id) => id.toString() !== requestId
      );
      senderUser.sentRequests = (senderUser.sentRequests || []).filter(
        (id) => id.toString() !== currentUserId
      );
      if (!currentUser.friends.some(id => id.toString() === requestId)) {
        currentUser.friends.push(requestId);
      }
      if (!senderUser.friends.some(id => id.toString() === currentUserId)) {
        senderUser.friends.push(currentUserId);
      }
      currentUser.friendsCount = currentUser.friends.length;
      senderUser.friendsCount = senderUser.friends.length;

      await currentUser.save();
      await senderUser.save();
      return res.status(200).json({ success: true, message: "Friend request accepted" });
    }

    if (action === "reject") {
      // Remove from receiver's friendRequests
      currentUser.friendRequests = currentUser.friendRequests.filter(
        (id) => id.toString() !== requestId
      );
      // Remove from sender's sentRequests
      senderUser.sentRequests = (senderUser.sentRequests || []).filter(
        (id) => id.toString() !== currentUserId
      );
      await currentUser.save();
      await senderUser.save();
      return res.status(200).json({ success: true, message: "Friend request rejected" });
    }

    return res.status(400).json({ success: false, message: "Invalid action. Use 'accept' or 'reject'" });

  } catch (err) {
    error(err, res);
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const receiverId = req.params.id;

    if (senderId === receiverId) {
      return res.status(400).json({ status: false, msg: "You cannot send a request to yourself" });
    }

    const sender = await user_models.findById(senderId);
    const receiver = await user_models.findById(receiverId);

    if (!sender) {
      return res.status(404).json({ status: false, msg: "Sender not found" });
    }
    if (!receiver) {
      return res.status(404).json({ status: false, msg: "User not found" });
    }

    // Check if already friends (check both sides)
    const alreadyFriend = sender.friends?.some(id => id.toString() === receiverId) ||
                          receiver.friends?.some(id => id.toString() === senderId);
    if (alreadyFriend) {
      return res.status(400).json({ status: false, msg: "Already friends" });
    }

    // Check if request already sent
    const alreadyRequested = receiver.friendRequests?.some(id => id.toString() === senderId);
    if (alreadyRequested) {
      return res.status(400).json({ status: false, msg: "Friend request already sent" });
    }

    // Check if receiver already sent a request to sender (auto-accept)
    const reverseRequest = sender.friendRequests?.some(id => id.toString() === receiverId);
    if (reverseRequest) {
      // Auto-accept: both users want to be friends
      sender.friendRequests = sender.friendRequests.filter(id => id.toString() !== receiverId);
      receiver.sentRequests = (receiver.sentRequests || []).filter(id => id.toString() !== senderId);
      if (!sender.friends.some(id => id.toString() === receiverId)) {
        sender.friends.push(receiverId);
      }
      if (!receiver.friends.some(id => id.toString() === senderId)) {
        receiver.friends.push(senderId);
      }
      sender.friendsCount = sender.friends.length;
      receiver.friendsCount = receiver.friends.length;
      await sender.save();
      await receiver.save();
      return res.status(200).json({ status: true, msg: "You are now friends! (auto-accepted)" });
    }

    // Add to receiver's friendRequests and sender's sentRequests
    receiver.friendRequests.push(senderId);
    if (!sender.sentRequests) sender.sentRequests = [];
    sender.sentRequests.push(receiverId);
    await receiver.save();
    await sender.save();

    return res.status(200).json({ status: true, msg: "Friend request sent" });

  } catch (err) {
    error(err, res);
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const user = await user_models
      .findById(req.user.id)
      .populate("friendRequests", "name email profileImg");

    if (!user) return res.status(404).json({ status: false, msg: "User not found" });

    return res.status(200).json({ status: true, requests: user.friendRequests });

  } catch (err) {
    error(err, res);
  }
};

export const removeFriend = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const friendId = req.params.id;

    await user_models.findByIdAndUpdate(currentUserId, { $pull: { friends: friendId }, $inc: { friendsCount: -1 } });
    await user_models.findByIdAndUpdate(friendId, { $pull: { friends: currentUserId }, $inc: { friendsCount: -1 } });

    return res.status(200).json({ status: true, msg: "Friend removed successfully" });

  } catch (err) {
    error(err, res);
  }
};

export const cancelFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const receiverId = req.params.id;

    // Remove from sender's sentRequests
    await user_models.findByIdAndUpdate(senderId, { $pull: { sentRequests: receiverId } });
    // Remove from receiver's friendRequests
    await user_models.findByIdAndUpdate(receiverId, { $pull: { friendRequests: senderId } });

    return res.status(200).json({ status: true, msg: "Friend request cancelled" });
  } catch (err) {
    error(err, res);
  }
};

export const getFriends = async (req, res) => {
  try {
    const user = await user_models
      .findById(req.user.id)
      .populate("friends", "name email profileImg user");

    if (!user) return res.status(404).json({ status: false, msg: "User not found" });

    return res.status(200).json({ status: true, friends: user.friends });

  } catch (err) {
    error(err, res);
  }
};
