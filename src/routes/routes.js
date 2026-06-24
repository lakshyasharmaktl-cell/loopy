import express from "express";
const routes = express.Router();

import { register, verify_otp, login, getSuggestions, searchUsers, getProfile, updateProfile } from '../controller/user_controller.js';
import { friends, sendFriendRequest, getFriendRequests, removeFriend, getFriends, cancelFriendRequest } from '../controller/friend_contoller.js';
import { getMessages, getChatList } from '../controller/message_controller.js';
import { user_authentication } from '../errorhandling/user_auth.js';

// Auth routes (public)
routes.post('/register', register);
routes.post('/verify-otp/:id', verify_otp);
routes.post('/login', login);

// Profile routes (protected)
routes.get('/profile', user_authentication, getProfile);
routes.put('/profile', user_authentication, updateProfile);

// Friend routes (protected)
routes.get('/friends', user_authentication, getFriends);
routes.get('/friend-requests', user_authentication, getFriendRequests);
routes.post('/friend-request/:id', user_authentication, sendFriendRequest);
routes.delete('/friend-request/:id', user_authentication, cancelFriendRequest);
routes.post('/friend-respond', user_authentication, friends);
routes.delete('/friend/:id', user_authentication, removeFriend);

// User suggestions & search (protected)
routes.get('/users/suggestions', user_authentication, getSuggestions);
routes.get('/users/search', user_authentication, searchUsers);

// Messages routes (protected)
routes.get('/messages/:friendId', user_authentication, getMessages);
routes.get('/chat-list', user_authentication, getChatList);

export default routes;