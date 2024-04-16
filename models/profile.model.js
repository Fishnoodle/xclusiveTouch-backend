const { default: mongoose } = require('mongoose');

const profile = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true},
        profile: [{
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            phoneNumber: { type: String, required: true },
            email: { type: String, required: true },
            position: { type: String },
            company: { type: String },
            about: { type: String },
            socialMedia: [{
                facebook: { type: String },
                twitter: { type: String },
                linkedIn: { type: String },
                instagram: { type: String },
                tikTok: { type: String },
                snapchat: { type: String },
                youtube: { type: String },
                pinterest: { type: String },
                twitch: { type: String },
                other: { type: String },
            }],
        }],
    },
    { collection: 'profile'}
)

const model = mongoose.model('Profile', profile)

module.exports = model