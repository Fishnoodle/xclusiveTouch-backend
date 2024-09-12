const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const fs = require('fs')
const https = require('https')
const multer = require('multer');
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// env imports
require('dotenv').config()

const bucketName = process.env.BUCKET_NAME
const bucketRegion = process.env.BUCKET_REGION
const accessKey = process.env.ACCESS_KEY
const secretAccessKey = process.env.SECRET_ACCESS_KEY

const s3 = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey
    },
    region: bucketRegion
})

// Emails imports 
const crypto = require('crypto')
const nodemailer = require('nodemailer')

// Models
const User = require('./models/user.model')
const Profile = require('./models/profile.model')


const app = express()

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json())

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })


// Mongoose connection
try {
    mongoose.connect('mongodb+srv://Dev123:Mikey2024@xclusivetouch.gs88nsy.mongodb.net/?retryWrites=true&w=majority&appName=XclusiveTouch')
    console.log('MongoDB connected')
} catch (err) {
    console.log(err)
}

/*
-------------
USER MODEL
-------------
*/

// Creates user, hashed password & checks for duplicate email
app.post('/api/register', async (req, res) => {
    console.log('Registering user')

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const confirmationToken = crypto.randomBytes(20).toString('hex')

        const user = await User.create({
            email: req.body.email,
            password: hashedPassword,
            username: req.body.username,
            isValid: false,
            confirmationToken: confirmationToken
        })

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        })

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: req.body.email,
            subject: 'Confirm Email',
            text: `Please click this link to confirm your email: https://api.xclusivetouch.ca/api/confirm/${confirmationToken}`
        }

        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.log(error)
            } else {
                console.log('Email sent: ' + info.response)
            }
        })

        res.json({ status: 'ok', user: user })
    } catch (err) {
        console.log(err)
        res.json({ status: 'error', error: 'Duplicate email' })
    }
})

// Confirmation email - token
app.get('/api/confirm/:token', async (req, res) => {
    try {
        const user = await User.findOne({ confirmationToken: req.params.token })

        if (!user) {
            return res.json({ status: 'error', error: 'Invalid confirmation token' })
        }

        user.isValid = true
        user.confirmationToken = null
        await user.save()

        res.json({ status: 'ok' })
    } catch (err) {
        console.log(err)
        res.json({ status: 'error', error: 'Error confirming registration' });
    }
})

// Login user, hashed password, and create jwt token
app.post('/api/login', async (req, res) => {
    try {
    console.log('Loggin in user')

    console.log(req.body.email, req.body.password)

    const user = await User.findOne({
        email: req.body.email,
    })

    if (User.isValid === false) {
        return res.json({ status: 'error', error: 'Please confirm your email' })
    }

    if (!user) {
        return res.json({ status: 'error', error: 'Invalid email/password' })
    }

    const isPasswordValid = await bcrypt.compare(
        req.body.password,
        user.password
    )

    if (isPasswordValid) {
        const token = jwt.sign(
            {
                name: user.name,
                email: user.email
            },
            'secret123'
        )

        res.cookie('token', token, { httpOnly: true });

        return res.json({ status: 'ok', user: user, data: token })
    } else {
        return res.json({ status: 'error', error: 'Incorrect Credentials' })
    }
} catch (err) {
    console.log(err)
    res.json({ status: 'error', error: 'Invalid email/password' })
}
})

/*
-------------
PROFILE MODEL
-------------
*/

app.get('/api/profile/:id', async (req, res) => {
    const id = req.params.id
    console.log('Getting profile')
    try {
        const user = await User.findOne({ _id: id })

        console.log('User', user)

        const profile = await Profile.findOne({ email: user.email })

        return res.json({ status: 'ok', data: profile })
    } catch (err) {
        console.log(err)
        res.json({ status: 'error', error: 'Invalid Profile' })
    }
})

app.get('/api/publicProfile/:username', async (req, res) => {
    const username = req.params.username
    console.log('Getting public profile')
    try {
        const profile = await Profile.findOne({ username: username})

        return res.json({ status: 'ok', data: profile })
    } catch (err) {
        console.log(err)
        res.json({ status: 'error', error: 'Invalid Profile' })
    }
})

app.post('/api/profile', async (req, res) => {
    console.log('Creating or updating profile')
    console.log(req.body)

    console.log('socialMedia:', req.body.socialMedia);

    try {
        const socialMediaLinks = {};
        (JSON.parse(req.body.socialMedia || '[]')).forEach(({ platform, link }) => {
            if (platform) {
                socialMediaLinks[platform.toLowerCase()] = link;
            }
        })
    } catch (err) {
        console.error('Error parsing socialMedia:', err);
    }
    
    try{
        const user = await User.findOne({ email: req.body.email })

        const profile = await Profile.create({
            email: req.body.email,
            username: user.username,
            profile: {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                phoneNumber: req.body.phoneNumber,
                email: req.body.email,
                position: req.body.position,
                company: req.body.company,
                about: req.body.about,
                socialMedia: socialMediaLinks,
                colours: {
                    primaryColour: req.body.primaryColour,
                    // profilePhoto: req.body.profilePhoto,
                    cardColour: req.body.cardColour
                }
            }
        })

        req.file.buffer

        const params = {
            Bucket: bucketName,
            Key: req.file.originalname,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        }

        const command = new PutObjectCommand(params)
        await s3.send(command)

        res.json({ status: 'ok', data: profile })

    } catch (err) {
        console.log(err)
        res.json({ status: 'error', error: 'Invalid Profile' })
    }
})

app.put('/api/profile/:id', upload.single('profilePhoto'), async (req, res) => {
    const id = req.params.id
    const generateFileName = (btyes = 32) => crypto.randomBytes(bytes).toString('hex')

    console.log('Updating profile')
    console.log(req.body)
    try {
        const user = await User.findOne({ id: req.body._id })

        if (!user) {
            return res.json({ status: 'error', error: 'User not found' })
        }

        const socialMediaLinks = {};
        (req.body.socialMedia || []).forEach(({ platform, link }) => {
            if (platform) {
                socialMediaLinks[platform.toLowerCase()] = link;
            }
        })

        const profile = await Profile.findOneAndUpdate(
            { email: req.body.email },
            {
                profile: {
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    phoneNumber: req.body.phoneNumber,
                    email: req.body.email,
                    position: req.body.position,
                    company: req.body.company,
                    about: req.body.about,
                    socialMedia: socialMediaLinks,
                    colours: {
                        primaryColour: req.body.primaryColour,
                        // profilePhoto: req.body.profilePhoto,
                        cardColour: req.body.cardColour
                    }
                }
            }
        )

        if (!req.file) {
            throw new Error('No file uploaded');
        }

        const file = file = req.file

        const fileBuffer = await sharp(file.buffer)
            .resize({ width: 1920, height: 1080, fit: "contain" })
            .toBuffer()

        const fileName = generateFileName()
        const params = {
            Bucket: bucketName,
            Body: fileBuffer,
            Key: fileName,
            ContentType: file.mimetype,
        }

        // Send the upload to S3
        await S3Client.send(new PutObjectCommand(params))

        res.json({ status: 'ok', data: profile })
    } catch (err) {
        console.log(err)
        res.json({ status: 'error', error: 'Invalid Profile' })
    }
})

app.listen(8001, () => {
    console.log('Server started on port 8001')
})