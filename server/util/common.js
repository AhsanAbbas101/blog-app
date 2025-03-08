const common = require('@root/config/common')

const PORT = process.env.PORT || 3003

const MONGODB_URI = process.env.NODE_ENV === 'test'
  ? process.env.TEST_MONGODB_URI
  : process.env.MONGODB_URI

const ENV = process.env.NODE_ENV

module.exports = {
  ...common,
  PORT,
  MONGODB_URI,
  ENV,
}
