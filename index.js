const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const fs = require('fs')
const https = require('https')

// Models
const User = require('./models/user.model')
const Profile = require('./models/profile.model')

const app = express()

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json())

// Mongoose connection
try {
    mongoose.connect('mongodb+srv://root:WxIMksA4XiLxnEd6@xclusivetouch.gs88nsy.mongodb.net/?retryWrites=true&w=majority&appName=XclusiveTouch')
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
    console.log(req.body.email, req.body.password)
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        const user = await User.create({
            email: req.body.email,
            password: hashedPassword
        })

        res.json({ status: 'ok', user: user })
    } catch (err) {
        console.log(err)
        res.json({ status: 'error', error: 'Duplicate email' })
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

    console.log('User Status', user)

    console.log('User Status', user, user.email)

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

app.post('/api/profile', async (req, res) => {
    console.log('Creating or updating profile')
    console.log(req.body)

    let socialMedia = req.body.socialMedia || {}
    
    try{
        const profile = await Profile.create({
            email: req.body.email,
            profile: {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                phoneNumber: req.body.phoneNumber,
                email: req.body.email,
                position: req.body.position,
                company: req.body.company,
                about: req.body.about,
                socialMedia: {
                    facebook: socialMedia.facebook,
                    twitter: socialMedia.twitter,
                    linkedIn: socialMedia.linkedIn,
                    instagram: socialMedia.instagram,
                    tikTok: socialMedia.tikTok,
                    snapchat: socialMedia.snapchat,
                    youtube: socialMedia.youtube,
                    pinterest: socialMedia.pinterest,
                    twitch: socialMedia.twitch,
                    other: socialMedia.other
                },
                colours: {
                    primaryColour: req.body.primaryColour,
                    profilePhoto: req.body.profilePhoto,
                    cardColour: req.body.cardColour
                }
            }
        })

        res.json({ status: 'ok', data: profile })

    } catch (err) {
        console.log(err)
        res.json({ status: 'error', error: 'Invalid Profile' })
    }
})

app.put('/api/profile/:id', async (req, res) => {
    const id = req.params.id
    console.log('Updating profile')
    console.log(req.body)
    try {
        const user = await User.findOne({ id: req.body._id })

        if (!user) {
            return res.json({ status: 'error', error: 'User not found' })
        }

        const profile = await Profile.findOneAndUpdate(
            { email: req.body.email },
            {
                profile: {
                    firstName: req.body.profile.firstName,
                    lastName: req.body.profile.lastName,
                    phoneNumber: req.body.profile.phoneNumber,
                    email: req.body.profile.email,
                    position: req.body.profile.position,
                    company: req.body.profile.company,
                    about: req.body.profile.about,
                    socialMedia: {
                        facebook: req.body.profile.socialMedia.facebook,
                        twitter: req.body.profile.socialMedia.twitter,
                        linkedIn: req.body.profile.socialMedia.linkedIn,
                        instagram: req.body.profile.socialMedia.instagram,
                        tikTok: req.body.profile.socialMedia.tikTok,
                        snapchat: req.body.profile.socialMedia.snapchat,
                        youtube: req.body.profile.socialMedia.youtube,
                        pinterest: req.body.profile.socialMedia.pinterest,
                        twitch: req.body.profile.socialMedia.twitch,
                        other: req.body.profile.socialMedia.other
                    },
                    colours: {
                        primaryColour: req.body.profile.colours.primaryColour,
                        profilePhoto: req.body.profile.colours.profilePhoto,
                        cardColour: req.body.profile.colours.cardColour
                    }
                }
            }
        )

        res.json({ status: 'ok', data: profile })
    } catch (err) {
        console.log(err)
        res.json({ status: 'error', error: 'Invalid Profile' })
    }
})

app.listen(8001, () => {
    console.log('Server started on port 8001')
})