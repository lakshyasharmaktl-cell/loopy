import user_models from '../models/user_models.js'
import bcrypt from 'bcrypt'
import { userotpsend } from '../mail/nodemailer.js'
import jwt from "jsonwebtoken"
import { error } from '../errorhandling/error.js'

export const register = async (req, res) => {
    try {
        const data = req.body
        const { email } = data

        const randomotp = Math.floor(1000 + Math.random() * 9000)
        const expiryTime = Date.now() + 5 * 60 * 1000;

        const checkuser = await user_models.findOneAndUpdate(
            { email: email },
            { $set: { 'user.userotp': randomotp, 'user.otpExpire': expiryTime } }
        )

        if (checkuser) {
            const { isVerify, isDelete } = checkuser.user

            if (isDelete) return res.status(200).send({ status: true, msg: "Your account has been deleted." })
            if (isVerify) return res.status(200).send({ status: true, msg: "Account already verified. Please login." })

            if (!isVerify) {
                await userotpsend(checkuser.email, checkuser.name, randomotp)
                return res.status(200).send({
                    status: true,
                    msg: "OTP resent to your email. Please verify.",
                    id: checkuser._id,
                    name: checkuser.name,
                    email: checkuser.email
                })
            }
        }

        data.role = "user"
        data.user = { otpExpire: expiryTime, userotp: randomotp }

        const DB = await user_models.create(data)
        await userotpsend(data.email, data.name, randomotp)

        return res.status(201).send({
            status: true,
            msg: "Account created! OTP sent to your email.",
            id: DB._id,
            name: DB.name,
            email: DB.email
        })

    } catch (err) {
        error(err, res)
    }
}

export const verify_otp = async (req, res) => {
    try {
        const { id } = req.params;
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({ status: false, msg: "Please provide the OTP." })
        }

        const user = await user_models.findById(id);
        if (!user) {
            return res.status(404).json({ status: false, msg: "User not found." })
        }

        const { userotp, otpExpire, isVerify } = user?.user;

        if (isVerify) {
            return res.status(409).json({ status: false, msg: "Account already verified. Please login." })
        }

        if (Date.now() > otpExpire) {
            return res.status(410).json({ status: false, msg: "OTP has expired. Please request a new one." })
        }

        if (String(otp) !== String(userotp)) {
            return res.status(401).json({ status: false, msg: "Invalid OTP. Please try again." })
        }

        await user_models.findOneAndUpdate(
            { _id: id },
            { $set: { 'user.isVerify': true, 'user.userotp': null, 'user.otpExpire': null } }
        )

        return res.status(200).json({ status: true, msg: "Account verified successfully! Please login." });

    } catch (err) {
        error(err, res)
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email) return res.status(400).send({ status: false, msg: "Email is required." })
        if (!password) return res.status(400).send({ status: false, msg: "Password is required." })

        const checkuser = await user_models.findOne({ email: email, 'user.isDelete': false, role: "user" })
        if (!checkuser) return res.status(404).send({ status: false, msg: "User not found. Please sign up first." })

        if (!checkuser.user.isVerify) return res.status(400).send({ status: false, msg: "Account not verified. Please verify your OTP." })

        const comparepass = await bcrypt.compare(password, checkuser.password)
        if (!comparepass) return res.status(400).send({ status: false, msg: "Incorrect password." })

        const token = jwt.sign({ id: checkuser._id }, process.env.JWT_token, { expiresIn: process.env.Expire_id || '7d' })

        const userData = {
            name: checkuser.name,
            email: checkuser.email,
            id: checkuser._id,
            profileImg: checkuser.profileImg,
            gender: checkuser.gender,
        }

        res.status(200).send({ status: true, msg: "Login successful!", token, user: userData })

    } catch (err) {
        error(err, res)
    }
}

export const getSuggestions = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const currentUser = await user_models.findById(currentUserId);
        if (!currentUser) return res.status(404).json({ status: false, msg: "User not found" });

        // Exclude current user, friends, received requests, AND sent requests
        const excludedUserIds = [
            currentUserId,
            ...currentUser.friends,
            ...currentUser.friendRequests,
            ...(currentUser.sentRequests || [])
        ];

        const suggestions = await user_models.find({
            _id: { $nin: excludedUserIds },
            'user.isVerify': true,
            'user.isDelete': false
        }).select('name email profileImg gender').limit(20);

        return res.status(200).json({ status: true, suggestions });
    } catch (err) {
        error(err, res);
    }
};

export const searchUsers = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const query = req.query.q || '';
        if (!query.trim()) {
            return res.status(200).json({ status: true, users: [] });
        }

        const users = await user_models.find({
            _id: { $ne: currentUserId },
            'user.isVerify': true,
            'user.isDelete': false,
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        }).select('name email profileImg gender').limit(20);

        const currentUser = await user_models.findById(currentUserId);

        const formattedUsers = users.map((u) => {
            let status = 'none'; // none, friend, received, sent
            if (currentUser.friends.some(id => id.toString() === u._id.toString())) {
                status = 'friend';
            } else if (currentUser.friendRequests.some(id => id.toString() === u._id.toString())) {
                status = 'received';
            } else if ((currentUser.sentRequests || []).some(id => id.toString() === u._id.toString())) {
                status = 'sent';
            }
            return {
                id: u._id,
                name: u.name,
                email: u.email,
                profileImg: u.profileImg,
                gender: u.gender,
                status
            };
        });

        return res.status(200).json({ status: true, users: formattedUsers });
    } catch (err) {
        error(err, res);
    }
};

export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await user_models.findById(userId)
            .select('-password -user.userotp -user.otpExpire')
            .populate('friends', 'name email profileImg');

        if (!user) {
            return res.status(404).json({ status: false, msg: "User not found" });
        }

        return res.status(200).json({ status: true, user });
    } catch (err) {
        error(err, res);
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, bio, gender } = req.body;

        const updatedUser = await user_models.findByIdAndUpdate(
            userId,
            { $set: { name, bio, gender } },
            { new: true, runValidators: true }
        ).select('-password -user.userotp -user.otpExpire');

        if (!updatedUser) {
            return res.status(404).json({ status: false, msg: "User not found" });
        }

        // Also update stored user in localstorage if needed, client will handle this.
        return res.status(200).json({ status: true, msg: "Profile updated successfully!", user: updatedUser });
    } catch (err) {
        error(err, res);
    }
};

