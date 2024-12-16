const { default: mongoose } = require('mongoose');

const User = new mongoose.Schema(
    {
        email: { type: String, required: true},
        username: { type: String },
        password: { type: String, required: true },
        isValid: { type: Boolean, default: false},
        confirmationToken: { type: String },
        resetToken: { type: String },
        resetTokenExpiration: { type: Date },
    },
    { collection: 'users'}
)

const model = mongoose.model('UserSchema', User)

module.exports = model