const React = require('react');
const ReactDOMServer = require('react-dom/server');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const https = require('https');
const multer = require('multer');
const sharp = require('sharp');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');

// Email Template
const Email = require('./templates/email');

// env imports - Support local, staging, and production environments
const productionEnvPath = '/root/config/xclusiveTouch.env';
const stagingEnvPath = '/root/config/xclusiveTouch.staging.env';

// Check NODE_ENV and load appropriate configuration
if (process.env.NODE_ENV === 'staging' && fs.existsSync(stagingEnvPath)) {
    // Staging environment
    require('dotenv').config({ path: stagingEnvPath });
    console.log('✅ Loaded STAGING environment from:', stagingEnvPath);
    console.log('🔧 Environment: STAGING');
} else if (fs.existsSync(productionEnvPath)) {
    // Production environment (DigitalOcean droplet)
    require('dotenv').config({ path: productionEnvPath });
    console.log('✅ Loaded PRODUCTION environment from:', productionEnvPath);
    console.log('🔧 Environment: PRODUCTION');
} else {
    // Local development environment
    require('dotenv').config();
    console.log('✅ Loaded LOCAL development environment from: .env');
    console.log('🔧 Environment: LOCAL');
}


const bucketName = process.env.BUCKET_NAME;
const region = process.env.BUCKET_REGION;
const accessKeyId = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey,
    }
});

// Emails imports 
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Models
const User = require('./models/user.model');
const Profile = require('./models/profile.model');
const ResetPassword = require('./templates/resetpassword');
const ExchangeContact = require('./templates/exchangecontact');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

// Mongoose connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if database connection fails
    });

/*
-------------
USER MODEL
-------------
*/

// Creates user, hashed password & checks for duplicate email
app.post('/api/register', async (req, res) => {
    console.log('Registration attempt for:', req.body.email);

    try {
        // Validate input
        if (!req.body.email || !req.body.password) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'Email and password are required' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: req.body.email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'Email already registered' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Generate confirmation token
        const confirmationToken = crypto.randomBytes(32).toString('hex');
        
        // Token expires in 24 hours
        const tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Create user
        const user = await User.create({
            email: req.body.email.toLowerCase(),
            password: hashedPassword,
            isEmailVerified: false,
            confirmationToken: confirmationToken,
            confirmationTokenExpiration: tokenExpiration
        });

        // Send confirmation email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const confirmationUrl = `${process.env.URL}/confirm/${confirmationToken}`;
        const emailHtml = ReactDOMServer.renderToStaticMarkup(
            React.createElement(Email, { 
                userFirstname: req.body.email.split('@')[0],
                confirmationUrl: confirmationUrl
            })
        );

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: req.body.email,
            subject: 'Confirm Your Xclusive Touch Account',
            html: emailHtml
        };

        await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent to:', req.body.email);

        res.json({ 
            status: 'ok', 
            message: 'Registration successful. Please check your email to verify your account.',
            userId: user._id 
        });
    } catch (err) {
        console.error('Registration error:', err);
        
        // Handle duplicate email error
        if (err.code === 11000) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'Email already registered' 
            });
        }
        
        res.status(500).json({ 
            status: 'error', 
            error: 'Registration failed. Please try again.' 
        });
    }
});

// Confirmation email - token
app.get('/api/confirm/:token', async (req, res) => {
    try {
        const user = await User.findOne({ 
            confirmationToken: req.params.token,
            confirmationTokenExpiration: { $gt: Date.now() } // Check if token not expired
        });

        if (!user) {
            return res.sendFile(path.join(__dirname, 'confirmation-error.html'));
        }

        // Mark email as verified
        user.isEmailVerified = true;
        user.confirmationToken = null;
        user.confirmationTokenExpiration = null;
        await user.save();

        console.log('Email verified for:', user.email);
        res.sendFile(path.join(__dirname, 'confirmation-success.html'));
    } catch (err) {
        console.error('Confirmation error:', err);
        res.sendFile(path.join(__dirname, 'confirmation-error.html'));
    }
});

// Resend confirmation email
app.post('/api/resend-confirmation', async (req, res) => {
    try {
        // Validate input
        if (!req.body.email) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'Email is required' 
            });
        }

        const user = await User.findOne({ 
            email: req.body.email.toLowerCase() 
        });

        if (!user) {
            return res.status(404).json({ 
                status: 'error', 
                error: 'User not found' 
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'Email already verified. You can login now.' 
            });
        }

        // Generate new token
        const confirmationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);

        user.confirmationToken = confirmationToken;
        user.confirmationTokenExpiration = tokenExpiration;
        await user.save();

        // Send confirmation email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const confirmationUrl = `${process.env.URL}/confirm/${confirmationToken}`;
        const emailHtml = ReactDOMServer.renderToStaticMarkup(
            React.createElement(Email, { 
                userFirstname: req.body.email.split('@')[0],
                confirmationUrl: confirmationUrl
            })
        );

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: req.body.email,
            subject: 'Confirm Your Xclusive Touch Account',
            html: emailHtml
        };

        await transporter.sendMail(mailOptions);
        console.log('Confirmation email resent to:', req.body.email);

        res.json({ 
            status: 'ok', 
            message: 'Confirmation email resent successfully. Please check your inbox.' 
        });
    } catch (err) {
        console.error('Resend confirmation error:', err);
        res.status(500).json({ 
            status: 'error', 
            error: 'Failed to resend confirmation email. Please try again.' 
        });
    }
});

app.post('/api/forgotpassword', async (req, res) => {
    try {
        // Validate input
        if (!req.body.email) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'Email is required' 
            });
        }

        const user = await User.findOne({ email: req.body.email.toLowerCase() });

        if (!user) {
            // Don't reveal whether email exists (security best practice)
            return res.json({ 
                status: 'ok', 
                message: 'If an account exists with this email, a password reset link has been sent.' 
            });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(403).json({ 
                status: 'error', 
                error: 'Please verify your email first. Check your inbox for the confirmation link.' 
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpiration = Date.now() + 900000; // 15 minutes in milliseconds
        await user.save();

        console.log('Password reset requested for:', user.email);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const resetUrl = `${process.env.URL}/reset-password/${resetToken}`;
        const emailHtml = ReactDOMServer.renderToStaticMarkup(
            React.createElement(ResetPassword, { 
                userEmail: user.email,
                resetUrl: resetUrl
            })
        );

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: req.body.email,
            subject: 'Reset Your Xclusive Touch Password',
            html: emailHtml
        };

        await transporter.sendMail(mailOptions);
        console.log('Password reset email sent to:', user.email);

        res.json({ 
            status: 'ok', 
            message: 'If an account exists with this email, a password reset link has been sent.' 
        });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ 
            status: 'error', 
            error: 'Unable to process request. Please try again.' 
        });
    }
})

app.post('/api/confirmreset/:id', async (req, res) => {
    try {
        // Validate input
        if (!req.body.password || !req.body.confirmPassword) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'Password and confirmation are required' 
            });
        }

        // Check passwords match
        if (req.body.password !== req.body.confirmPassword) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'Passwords do not match' 
            });
        }

        // Validate password strength (minimum 6 characters)
        if (req.body.password.length < 6) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'Password must be at least 6 characters long' 
            });
        }

        const user = await User.findOne({ 
            resetToken: req.params.id,
            resetTokenExpiration: { $gt: Date.now() } // Check token not expired
        });

        if (!user) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'Invalid or expired reset token. Please request a new password reset.' 
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        user.password = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpiration = null;
        await user.save();

        console.log('Password reset successful for:', user.email);

        res.json({ 
            status: 'ok', 
            message: 'Password has been reset successfully. You can now login with your new password.' 
        });
    } catch (err) {
        console.error('Password reset error:', err);
        res.status(500).json({ 
            status: 'error', 
            error: 'Failed to reset password. Please try again.' 
        });
    }
})

app.post('/api/login', async (req, res) => {
    try {
        console.log('Login attempt for:', req.body.email);

        // Validate input
        if (!req.body.email || !req.body.password) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'Email and password are required' 
            });
        }

        // Find user by email (email is unique)
        const user = await User.findOne({ 
            email: req.body.email.toLowerCase() 
        });

        // If no user found
        if (!user) {
            console.log('No user found with email:', req.body.email);
            return res.status(400).json({ 
                status: 'error', 
                error: 'Invalid email or password' 
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
        
        if (!isPasswordValid) {
            console.log('Invalid password for:', req.body.email);
            return res.status(400).json({ 
                status: 'error', 
                error: 'Invalid email or password' 
            });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(403).json({ 
                status: 'error', 
                error: 'Please verify your email before logging in. Check your inbox for the confirmation link.' 
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({ 
                status: 'error', 
                error: 'Your account has been deactivated. Please contact support.' 
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Create JWT token with environment variable
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email
            },
            process.env.JWT_SECRET, // Use environment variable
            { expiresIn: '7d' } // Token expires in 7 days
        );

        console.log('Login successful for:', req.body.email);

        return res.json({ 
            status: 'ok', 
            userId: user._id,
            email: user.email,
            token: token
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            status: 'error', 
            error: 'Login failed. Please try again.' 
        });
    }
})

// Verify JWT token
app.post('/api/verify-token', async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'No token provided' 
        });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        // Verify the token using environment variable
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user exists and is active
        const user = await User.findOne({ 
            _id: decoded.userId,
            isActive: true 
        });
        
        if (!user) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'User not found or inactive' 
            });
        }
        
        // Token is valid and user exists
        return res.json({ 
            status: 'ok',
            userId: user._id,
            email: user.email
        });
    } catch (error) {
        console.error('Token verification error:', error.message);
        return res.status(401).json({ 
            status: 'error', 
            message: 'Invalid or expired token' 
        });
    }
});

/*
-------------
PROFILE MODEL
-------------
*/

app.get('/api/profile/:id', async (req, res) => {
    const userId = req.params.id;
    console.log('Getting profile for user:', userId);

    try {
        // Find user by ID
        const user = await User.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ 
                status: 'error', 
                error: 'User not found' 
            });
        }

        // Find profile by userId
        const profile = await Profile.findOne({ userId: userId });

        if (!profile) {
            return res.status(404).json({ 
                status: 'error', 
                error: 'Profile not found',
                message: 'Please create your profile to continue'
            });
        }

        // Get pre-signed URL for profile photo
        let profilePhotoUrl = null;
        if (profile.profile[0]?.colours[0]?.profilePhoto) {
            const params = {
                Bucket: bucketName,
                Key: profile.profile[0].colours[0].profilePhoto
            };

            const command = new GetObjectCommand(params);
            const seconds = 3600; // 1 hour expiration
            profilePhotoUrl = await getSignedUrl(s3, command, { expiresIn: seconds });
        }

        // Add profile photo URL to profile object
        const profileData = profile.toObject();
        if (profilePhotoUrl) {
            profileData.profile[0].colours[0].profilePhotoUrl = profilePhotoUrl;
        }

        console.log('Profile found for:', user.email);

        return res.json({ 
            status: 'ok', 
            data: profileData
        });

    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ 
            status: 'error', 
            error: 'Failed to retrieve profile' 
        });
    }
})

app.get('/api/publicProfile/:slug', async (req, res) => {
    console.log('Getting public profile for slug:', req.params.slug);

    try {
        // Convert the slug to lowercase before querying the database
        const slug = req.params.slug.toLowerCase();
        const profile = await Profile.findOne({ profileSlug: slug });

        if (!profile) {
            return res.status(404).json({ 
                status: 'error', 
                error: 'Profile not found' 
            });
        }

        // Get pre-signed URL for profile photo
        let profilePhotoUrl = null;
        if (profile.profile[0]?.colours[0]?.profilePhoto) {
            const params = {
                Bucket: bucketName,
                Key: profile.profile[0].colours[0].profilePhoto
            };

            const command = new GetObjectCommand(params);
            const seconds = 3600; // 1 hour expiration
            profilePhotoUrl = await getSignedUrl(s3, command, { expiresIn: seconds });
        }

        // Add profile photo URL to profile object
        const profileData = profile.toObject();
        if (profilePhotoUrl) {
            profileData.profile[0].colours[0].profilePhotoUrl = profilePhotoUrl;
        }

        console.log('Public profile found:', slug);

        return res.json({ 
            status: 'ok', 
            data: profileData 
        });
    } catch (err) {
        console.error('Get public profile error:', err);
        res.status(500).json({ 
            status: 'error', 
            error: 'Failed to retrieve profile' 
        });
    }
});

app.post('/api/profile', upload.single('profilePhoto'), async (req, res) => {
    console.log('Creating profile');
    console.log(req.body);

    try {
        // Validate required fields
        if (!req.body.userId) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'User ID is required' 
            });
        }

        if (!req.body.firstName || !req.body.lastName || !req.body.phoneNumber) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'First name, last name, and phone number are required' 
            });
        }

        // Find user by ID
        const user = await User.findOne({ _id: req.body.userId });

        if (!user) {
            return res.status(404).json({ 
                status: 'error', 
                error: 'User not found' 
            });
        }

        // Check if profile already exists
        const existingProfile = await Profile.findOne({ userId: req.body.userId });
        if (existingProfile) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'Profile already exists for this user. Use PUT to update.' 
            });
        }

        console.log('Creating profile for user:', user.email);

        // Parse social media links
        const socialMediaLinks = [];
        if (req.body.socialMedia) {
            try {
                const socialMedia = JSON.parse(req.body.socialMedia);
                socialMedia.forEach((item) => {
                    const platform = item.platform;
                    const link = item.link;
                    if (platform && link) {
                        socialMediaLinks.push({ [platform.toLowerCase()]: link });
                    }
                });
            } catch (parseError) {
                console.error('Error parsing socialMedia:', parseError);
            }
        }

        // Upload profile photo to S3 if provided
        let fileName = null;
        if (req.file) {
            fileName = generateFileName();
            const fileBuffer = await sharp(req.file.buffer)
                .resize({ width: 750, height: 750, fit: "contain" })
                .toBuffer();

            const params = {
                Bucket: bucketName,
                Body: fileBuffer,
                Key: fileName,
                ContentType: req.file.mimetype,
            };

            await s3.send(new PutObjectCommand(params));
            console.log('Profile photo uploaded to S3:', fileName);
        }

        // Generate profile slug (unique URL)
        const baseSlug = `${req.body.firstName}-${req.body.lastName}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        
        let profileSlug = baseSlug;
        let slugExists = await Profile.findOne({ profileSlug });
        let counter = 1;
        
        while (slugExists) {
            profileSlug = `${baseSlug}-${counter}`;
            slugExists = await Profile.findOne({ profileSlug });
            counter++;
        }

        console.log('Generated profileSlug:', profileSlug);

        // Prepare profile data
        const profileData = {
            userId: req.body.userId,
            email: user.email,
            profileSlug: profileSlug,
            profile: [{
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                phoneNumber: req.body.phoneNumber,
                email: req.body.email || user.email,
                position: req.body.position || '',
                company: req.body.company || '',
                about: req.body.about || '',
                companyAddress: req.body.companyAddress || '',
                socialMedia: socialMediaLinks,
                colours: [{
                    primaryColour: req.body.primaryColour || '#D4AF37',
                    cardColour: req.body.cardColour || '#000000',
                    profilePhoto: fileName
                }]
            }]
        };

        const profile = await Profile.create(profileData);

        console.log('Profile created successfully for:', user.email);

        res.json({ 
            status: 'ok', 
            data: profile,
            profileSlug: profileSlug,
            message: 'Profile created successfully'
        });

    } catch (err) {
        console.error('Profile creation error:', err);
        
        // Handle duplicate key errors
        if (err.code === 11000) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'Profile with this email or slug already exists' 
            });
        }
        
        res.status(500).json({ 
            status: 'error', 
            error: 'Failed to create profile. Please try again.' 
        });
    }
});

app.put('/api/profile/:id', upload.single('profilePhoto'), async (req, res) => {
    const userId = req.params.id;

    console.log('Updating profile for user:', userId);
    console.log('Profile photo:', req.file ? 'provided' : 'not provided');

    try {
        // Validate required fields
        if (!req.body.firstName || !req.body.lastName || !req.body.phoneNumber) {
            return res.status(400).json({ 
                status: 'error', 
                error: 'First name, last name, and phone number are required' 
            });
        }

        // Find user by ID
        const user = await User.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ 
                status: 'error', 
                error: 'User not found' 
            });
        }

        // Find existing profile by userId
        const existingProfile = await Profile.findOne({ userId: userId });
        
        if (!existingProfile) {
            return res.status(404).json({ 
                status: 'error', 
                error: 'Profile not found. Please create a profile first.' 
            });
        }

        console.log('Updating profile for:', user.email);

        // Parse social media links
        const socialMediaLinks = [];
        if (req.body.socialMedia) {
            try {
                const socialMedia = JSON.parse(req.body.socialMedia);
                socialMedia.forEach((item) => {
                    const platform = item.platform;
                    const link = item.link;
                    if (platform && link) {
                        socialMediaLinks.push({ [platform.toLowerCase()]: link });
                    }
                });
            } catch (parseError) {
                console.error('Error parsing socialMedia:', parseError);
            }
        }

        // Upload new profile photo to S3 if provided
        let fileName = existingProfile.profile[0].colours[0].profilePhoto; // Keep existing photo
        if (req.file) {
            fileName = generateFileName();
            const fileBuffer = await sharp(req.file.buffer)
                .resize({ width: 750, height: 750, fit: "contain" })
                .toBuffer();

            const params = {
                Bucket: bucketName,
                Body: fileBuffer,
                Key: fileName,
                ContentType: req.file.mimetype,
            };

            await s3.send(new PutObjectCommand(params));
            console.log('New profile photo uploaded to S3:', fileName);
        }

        // Check if name changed - regenerate slug if needed
        const currentSlug = existingProfile.profileSlug;
        let newProfileSlug = currentSlug;

        const currentName = `${existingProfile.profile[0].firstName}-${existingProfile.profile[0].lastName}`.toLowerCase();
        const newName = `${req.body.firstName}-${req.body.lastName}`.toLowerCase();

        if (currentName !== newName) {
            // Name changed - generate new slug
            const baseSlug = `${req.body.firstName}-${req.body.lastName}`
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            
            let profileSlug = baseSlug;
            let slugExists = await Profile.findOne({ 
                profileSlug: profileSlug,
                _id: { $ne: existingProfile._id } // Exclude current profile
            });
            let counter = 1;
            
            while (slugExists) {
                profileSlug = `${baseSlug}-${counter}`;
                slugExists = await Profile.findOne({ 
                    profileSlug: profileSlug,
                    _id: { $ne: existingProfile._id }
                });
                counter++;
            }

            newProfileSlug = profileSlug;
            console.log('Name changed - new profileSlug:', newProfileSlug);
        }

        // Update profile with new data
        existingProfile.profileSlug = newProfileSlug;
        existingProfile.profile[0].firstName = req.body.firstName;
        existingProfile.profile[0].lastName = req.body.lastName;
        existingProfile.profile[0].phoneNumber = req.body.phoneNumber;
        existingProfile.profile[0].email = req.body.email || user.email;
        existingProfile.profile[0].position = req.body.position || '';
        existingProfile.profile[0].company = req.body.company || '';
        existingProfile.profile[0].about = req.body.about || '';
        existingProfile.profile[0].companyAddress = req.body.companyAddress || '';
        existingProfile.profile[0].socialMedia = socialMediaLinks;
        existingProfile.profile[0].colours[0].primaryColour = req.body.primaryColour || '#D4AF37';
        existingProfile.profile[0].colours[0].cardColour = req.body.cardColour || '#000000';
        existingProfile.profile[0].colours[0].profilePhoto = fileName;

        await existingProfile.save();

        console.log('Profile updated successfully for:', user.email);

        res.json({ 
            status: 'ok', 
            data: existingProfile,
            profileSlug: newProfileSlug,
            message: 'Profile updated successfully'
        });

    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ 
            status: 'error', 
            error: 'Failed to update profile. Please try again.' 
        });
    }
});

app.post('/api/exchangeContact/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const user = await Profile.findOne({ _id: id }); // Find the user's profile

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const emailHtml = ReactDOMServer.renderToStaticMarkup(
            React.createElement(ExchangeContact, { user: user.profile[0].firstName, name: req.body.name, email: req.body.email, message: req.body.message })
        );

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: user.email,
            subject: 'Xclusive Touch - Exchange Contact',
            html: emailHtml
        }

        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        console.log('Email sent to:', user.email);

        res.json({ status: 'ok', user: user.email });
    } catch (err) {
        console.log(err);
        res.json({ status: 'error', error: 'Unable to send exchange'})
    }
})

app.listen(8001, () => {
    console.log('Server started on port 8001')
    console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`📍 Frontend URL: ${process.env.URL}`)
    console.log(`💾 Database: ${process.env.MONGODB_URI?.includes('localhost') ? 'Local MongoDB' : 'MongoDB Atlas'}`)
})