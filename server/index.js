// const config = require('./utils/config')
// const app = require('./app')
// const logger = require('./utils/logger')

// app.listen(config.PORT, () => {
//     logger.info(`Server running on port ${config.PORT}`)
// })

const config = require('@util/common')

const express = require('express')
require('express-async-errors')

const app = express()
const mongoose = require('mongoose')
const cors = require('cors')

const blogsRouter = require('@controllers/blogs')
const usersRouter = require('@controllers/users')
const loginRouter = require('@controllers/login')

const logger = require('@util/logger')
const middleware = require('@middleware')

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

app.use('/blogs', blogsRouter)
app.use('/users', usersRouter)
app.use('/login', loginRouter)
if (config.ENV === 'test') {
  // eslint-disable-next-line global-require
  const testingRouter = require('@controllers/testing')
  app.use('/testing', testingRouter)
}

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app
