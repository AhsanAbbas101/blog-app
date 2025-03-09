// eslint-disable-next-line import/no-extraneous-dependencies
require('module-alias/register')
require('dotenv').config()

// eslint-disable-next-line no-console
console.log(`Hello ${process.env.HELLO}`)
