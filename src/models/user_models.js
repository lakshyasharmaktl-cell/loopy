import mongoose from 'mongoose'
import { validname, validEmail, validpassword } from '../validation/validation.js'
import bcrypt from 'bcrypt'
// import { uploadProfileImg } from '../images/upload.js'

export const userSchema = new mongoose.Schema({


name: {type: String, trim: true,required: [true, 'Name is required'], validate: [validname, 'Invalid name']
},

email: {type: String, trim: true, lowercase: true, unique: true, required: [true, 'Email is required'], validate: [validEmail, 'Invalid email']
},

gender: { type: String,enum: ['Male', 'Female', 'Other'],required: true
},

role: {type: String,enum: ['user', 'admin'],default: 'user'
},

profileImg: {type: String, default: ''
},

bio: { type: String, default: ''
},

password: { type: String, trim: true, required: [true, 'Password is required'], validate: [   validpassword,
     'Password must contain uppercase, lowercase, number and special character'
    ]
},

user: {
    isDelete: {type: Boolean, default: false  },

    otpExpire: {  type: Number,  default: 0},

    isVerify: {  type: Boolean,  default: false },

    userotp: { type: Number, default: null},

    lastSeen: { type: Date, default: Date.now },

    isOnline: {
        type: Boolean,
        default: false
    }
},

// Accepted Friends
friends: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }
],

// Requests Received
friendRequests: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }
],

// Requests Sent
sentRequests: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }
],

// Blocked Users
blockedUsers: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }
],

// Streaks with other users
streaks: [{
    friendId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    count: { type: Number, default: 0 },
    lastSent: { type: Date }
}],

friendsCount: {
    type: Number,
    default: 0
}


},
{
timestamps: true
})

userSchema.pre('save', async function (next) {


try {

    if (!this.isModified('password')) {
        return next()
    }

    this.password = await bcrypt.hash(
        this.password,
        10
    )

    next()

} catch (err) {
    console.log(err.message)
}


})

export default mongoose.model(
'users',
userSchema
)

