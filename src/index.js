import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import routes from './routes/routes.js';
import message_models from './models/message_models.js';
import user_models from './models/user_models.js';

dotenv.config();

const app = express();
const PORT = 1234;

app.use(cors());
app.use(express.json());
app.use('/', routes);

mongoose.connect(process.env.MongoDBUrl)
    .then(() => console.log('MongoDB connected ...'))
    .catch((err) => console.log('MongoDB error =>', err.message));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', async (userId) => {
    if (!userId) return;
    socket.join(userId);
    userSockets.set(socket.id, userId);
    console.log(`User ${userId} joined room. Socket: ${socket.id}`);

    try {
      await user_models.findByIdAndUpdate(userId, { $set: { 'user.isOnline': true } });
      io.emit('user_status', { userId, online: true });
    } catch (err) {
      console.error('Error updating user online status:', err);
    }
  });

  socket.on('send_message', async (data) => {
    const { senderId, receiverId, text } = data;
    if (!senderId || !receiverId || !text) return;

    try {
      // Save message in DB
      const message = await message_models.create({
        sender: senderId,
        receiver: receiverId,
        text: text,
        isRead: false
      });

      const messageData = {
        _id: message._id,
        sender: senderId,
        receiver: receiverId,
        text: text,
        isRead: false,
        createdAt: message.createdAt
      };

      // Deliver to both sender and receiver rooms
      io.to(receiverId).emit('receive_message', messageData);
      io.to(senderId).emit('receive_message', messageData);
      
      console.log(`Real-time message delivered from ${senderId} to ${receiverId}`);
    } catch (err) {
      console.error('Error handling socket message:', err);
    }
  });

  socket.on('go_offline', async (userId) => {
    if (!userId) return;
    try {
      await user_models.findByIdAndUpdate(userId, { $set: { 'user.isOnline': false, 'user.lastSeen': new Date() } });
      io.emit('user_status', { userId, online: false });
      console.log(`User ${userId} went offline explicitly.`);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('disconnect', async () => {
    const userId = userSockets.get(socket.id);
    if (userId) {
      userSockets.delete(socket.id);
      console.log(`User ${userId} socket disconnected: ${socket.id}`);
      
      // Update status to offline (delay slightly in case of instant page refreshes/reconnects)
      setTimeout(async () => {
        // Only set offline if no other socket exists for this user ID
        const activeSockets = Array.from(userSockets.values());
        if (!activeSockets.includes(userId)) {
          try {
            await user_models.findByIdAndUpdate(userId, { $set: { 'user.isOnline': false, 'user.lastSeen': new Date() } });
            io.emit('user_status', { userId, online: false });
            console.log(`User ${userId} is now offline.`);
          } catch (err) {
            console.error(err);
          }
        }
      }, 5000);
    }
  });
});

server.listen(PORT, () => console.log('Server running on port', PORT));