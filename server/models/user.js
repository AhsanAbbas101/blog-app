const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minLength: [3, 'Must be at least 3, got {VALUE}'],
  },
  name: String,
  passwordHash: {
    type: String,
    required: true,
  },
  blogs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
    },
  ],
})

userSchema.set('toJSON', {
  transform: (doc, retDoc) => {
    retDoc.id = doc._id.toString()
    delete retDoc._id
    delete retDoc.__v
    delete retDoc.passwordHash
  },
})

module.exports = mongoose.model('User', userSchema)
