const {
  describe, test, after, beforeEach,
} = require('node:test')
const assert = require('node:assert')
const supertest = require('supertest')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const app = require('../index')
const helper = require('./test_helper')

const api = supertest(app)

const User = require('@models/user')

beforeEach(async () => {
  await User.deleteMany({})

  const passwordHash = await bcrypt.hash('secrytKey', 10)
  const user = new User({
    username: 'root',
    name: 'admin',
    passwordHash,
  })

  await user.save()
})

const baseURL = '/users'

describe('[POST] /api/users', () => {
  test('a valid user is added', async () => {
    const usersInDb = await helper.usersInDb()

    const newUser = {
      username: 'aabbas',
      name: 'Ahsan Abbas',
      password: 'passwordSeckret',
    }

    await api
      .post(baseURL)
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersInDb.length + 1)

    const usernames = usersAtEnd.map((user) => user.username)
    assert(usernames.includes(newUser.username))
  })

  test('missing username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      name: 'Ahsan Abbas',
      password: 'passwordSeckret',
    }

    await api
      .post(baseURL)
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })

  test('missing password', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'aabbas',
      name: 'Ahsan Abbas',
    }

    await api
      .post(baseURL)
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })

  test('username length less than 3', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'aa',
      name: 'Ahsan Abbas',
      password: 'passwordSeckret',
    }

    await api
      .post(baseURL)
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })

  test('password length less than 3', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'aabbas',
      name: 'Ahsan Abbas',
      password: 'pa',
    }

    await api
      .post(baseURL)
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })
})

after(async () => {
  await mongoose.connection.close()
})
