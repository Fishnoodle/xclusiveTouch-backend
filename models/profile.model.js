const { default: mongoose } = require('mongoose');

const profile = new mongoose.Schema(
    {
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'UserSchema',
            required: true,
            unique: true // One profile per user
        },
        email: { type: String, required: true, unique: true },
        profileSlug: { 
            type: String, 
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[a-z0-9-]+$/, 'Profile slug can only contain lowercase letters, numbers, and hyphens']
        }, // Custom URL: xclusivetouch.ca/john-doe-attorney
        profile: [{
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            phoneNumber: { type: String, required: true },
            email: { type: String, required: true },
            companyAddress: { type: String},
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
            colours: [{
                primaryColour: { type: String },
                profilePhoto: { type: String },
                cardColour: { type: String },
            }]
        }],
    },
    { 
        collection: 'profile',
        timestamps: true // Adds createdAt and updatedAt
    }
)

// Indexes for faster queries
profile.index({ userId: 1 });
profile.index({ email: 1 });
profile.index({ profileSlug: 1 });

const model = mongoose.model('Profile', profile)

module.exports = model