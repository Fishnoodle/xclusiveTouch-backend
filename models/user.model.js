const { default: mongoose } = require('mongoose');

const User = new mongoose.Schema(
    {
        email: { 
            type: String, 
            required: true,
            unique: true, // Prevents duplicate emails
            lowercase: true, // Always store as lowercase
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
        },
        password: { 
            type: String, 
            required: true
        },
        
        // Email validation
        isEmailVerified: { type: Boolean, default: false },
        confirmationToken: { type: String },
        confirmationTokenExpiration: { type: Date },
        
        // Password reset
        resetToken: { type: String },
        resetTokenExpiration: { type: Date },
        
        // Account status
        isActive: { type: Boolean, default: true },
        
        // Timestamps
        lastLogin: { type: Date },
    },
    { 
        collection: 'users',
        timestamps: true // Adds createdAt and updatedAt automatically
    }
)

// Indexes for faster queries
User.index({ email: 1 });

const model = mongoose.model('UserSchema', User)

module.exports = model