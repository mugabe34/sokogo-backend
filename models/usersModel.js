const mongoose = require("mongoose")

const userSchema = mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['buyer', 'seller', 'admin'],
        default: 'buyer'
    },
    createdAt: { type: Date, default: Date.now }
}, {
    versionKey: false,
})

const UserModel = mongoose.model("users", userSchema)

module.exports = { UserModel }
