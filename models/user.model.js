const { default: mongoose } = require('mongoose');

const User = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true},
        password: { type: String, required: true },
        isValid: { type: Boolean, default: false},
        confirmationToken: { type: String }
    },
    { collection: 'users'}
)

const model = mongoose.model('UserSchema', User)

module.exports = model