const morgan = require('morgan')
const jwt = require('jsonwebtoken')

const logger = require('@util/logger')
const User = require('@models/user')

morgan.token('req-data', (req) => JSON.stringify(req.body))

const requestLogger = morgan(':method :url :status :res[content-length] - :response-time ms :req-data')

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
    return response.status(400).json({ error: 'expected `username` to be unique' })
  } if (error.name === 'JsonWebTokenError') {
    return response.status(401).json({ error: 'invalid token' })
  } if (error.name === 'TokenExpiredError') {
    return response.status(401).json({ error: 'token expired' })
  }
  next(error)
}

const tokenExtractor = (request, response, next) => {
  request.token = null
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    request.token = authorization.replace('Bearer ', '')
  }

  next()
}

const userExtractor = (request, response, next) => {
  request.user = null

  const decodedToken = jwt.verify(request.token, process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'invalid token' })
  }

  User
    .findById(decodedToken.id.toString())
    .then((user) => {
      request.user = user
      next()
    })
    .catch(() => response.status(401).json({ error: 'invalid user' }))
    // request.user = await User.findById(decodedToken.id)
}

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
}
