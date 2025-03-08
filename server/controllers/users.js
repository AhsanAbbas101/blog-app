const bcrypt = require('bcryptjs')
const userRouter = require('express').Router()
const User = require('@models/user')

userRouter.get('/', async (req, res) => {
  const users = await User
    .find({})
    .populate('blogs', { url: 1, title: 1, author: 1 })

  res.json(users)
})

userRouter.post('/', async (req, res) => {
  const reqUser = req.body

  if (reqUser.username === undefined || reqUser.password === undefined) {
    return res.status(400).json({
      error: 'username or password missing.',
    })
  }

  // require password to be 3 characters long
  if (reqUser.password.length < 3) {
    return res.status(400).json({
      error: 'password must be atleast 3 characters long',
    })
  }

  const { username, name, password } = reqUser

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    passwordHash: `${passwordHash}`,
  })

  const savedUser = await user.save()

  res.status(201).json(savedUser)
})

module.exports = userRouter
