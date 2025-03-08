const config = require('./utils/config')
const express = require('express')
require('express-async-errors')

const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const blogsRouter = require('./controllers/blogs')
const usersRouter = require('./controllers/users')
const logger = require('./utils/logger')
const middleware = require('./utils/middleware')
const loginRouter = require('./controllers/login')

mongoose.set('strictQuery', false)
logger.info('connecting to mongodb')
mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB.')
  })
  .catch((error) => {
    logger.error(`error connecting to MongoDB: ${error.message}`)
  })

app.use(cors())
app.use(express.json())

if (config.ENV !== 'test') {
  app.use(middleware.requestLogger)
}
app.use(middleware.tokenExtractor)

// controllers
app.use('/api/blogs', blogsRouter)
app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)

// testing controllers
if (process.env.NODE_ENV === 'test') {
  // eslint-disable-next-line global-require
  const testingRouter = require('./controllers/testing')
  app.use('/api/testing', testingRouter)
}

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app
