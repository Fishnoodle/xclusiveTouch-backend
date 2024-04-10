const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const fs = require('fs')
const https = require('https')

// User Model
const User = require('./models/user.model')

const app = express()

app.use(cors())
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
    console.log('Loggin in user')

    const user = await User.findOne({
        email: req.body.email,
    })

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

        return res.json({ status: 'ok', user: user, data: token })
    } else {
        return res.json({ status: 'error', user: false })
    }
})

app.listen(8001, () => {
    console.log('Server started on port 8001')
})