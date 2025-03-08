const {
  describe, test, after, beforeEach, before,
} = require('node:test')
const assert = require('node:assert')
const supertest = require('supertest')
const mongoose = require('mongoose')
const app = require('../index')
const helper = require('./test_helper')

const api = supertest(app)

const Blog = require('@models/blog')
const User = require('@models/user')

let TOKEN = null

before(async () => {
  await User.deleteMany({})
  await User.insertMany(helper.initialUsers)

  const res = await api
    .post('/login')
    .send({
      username: 'newUser',
      password: 'iamnewhere',
    })

  TOKEN = `Bearer ${res.body.token}`
})

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})

// TESTS
const baseURL = '/blogs'

describe('[GET] /api/blogs', () => {
  test('blogs are returned from db', async () => {
    await api
      .get(baseURL)
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('there are two blogs', async () => {
    const response = await api.get(baseURL)

    assert.strictEqual(response.body.length, helper.initialBlogs.length)
  })

  test('the first blog author is Michael Chan', async () => {
    const response = await api.get(baseURL)

    const authors = response.body.map((blog) => blog.author)
    assert(authors.includes('Michael Chan'))
  })
})

describe('blog object properties', () => {
  test('check id', async () => {
    const response = await api.get(baseURL)

    assert(Object.keys(response.body[0]).includes('id'))
  })
})

describe('[POST] /api/blogs', () => {
  test('a valid blog is added', async () => {
    const newBlog = {
      title: 'A new blog',
      author: 'Jon Doe',
      url: 'https://example.com',
      likes: 5,
    }

    await api.post(baseURL)
      .set('Authorization', TOKEN)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogs = await helper.blogsInDb()
    assert.strictEqual(blogs.length, helper.initialBlogs.length + 1)

    const titles = blogs.map((blog) => blog.title)
    assert(titles.includes('A new blog'))
  })

  test('missing likes property defaults to 0', async () => {
    const newBlog = {
      title: 'A new blog with no likes property',
      author: 'Jon Doe',
      url: 'https://example.com',
    }

    const response = await api
      .post(baseURL)
      .set('Authorization', TOKEN)
      .send(newBlog)

    assert.strictEqual(response.body.likes, 0)
  })

  test('400 if title is missing', async () => {
    const newBlogwithNoTitle = {
      author: 'Jon Doe',
      url: 'https://example.com',
      likes: 5,
    }

    await api.post(baseURL)
      .set('Authorization', TOKEN)
      .send(newBlogwithNoTitle)
      .expect(400)

    const blogs = await helper.blogsInDb()
    assert.strictEqual(blogs.length, helper.initialBlogs.length)
  })

  test('400 if url is missing', async () => {
    const newBlogwithNoURL = {
      title: 'A new blog with no url',
      author: 'Jon Doe',
      likes: 5,
    }

    await api
      .post(baseURL)
      .set('Authorization', TOKEN)
      .send(newBlogwithNoURL)
      .expect(400)

    const blogs = await helper.blogsInDb()
    assert.strictEqual(blogs.length, helper.initialBlogs.length)
  })

  test('invalid token', async () => {
    const newBlog = {
      title: 'A new blog',
      author: 'Jon Doe',
      url: 'https://example.com',
      likes: 5,
    }

    await api
      .post(baseURL)
      .set('Authorization', 'Bearer InvalidTokenPlaceHere')
      .send(newBlog)
      .expect(401)

    const blogs = await helper.blogsInDb()
    assert.strictEqual(blogs.length, helper.initialBlogs.length)
  })

  test('no token provided', async () => {
    const newBlog = {
      title: 'A new blog',
      author: 'Jon Doe',
      url: 'https://example.com',
      likes: 5,
    }

    await api
      .post(baseURL)
      .send(newBlog)
      .expect(401)

    const blogs = await helper.blogsInDb()
    assert.strictEqual(blogs.length, helper.initialBlogs.length)
  })

  test('token user shall be linked with post', async () => {
    const newBlog = {
      title: 'A new blog',
      author: 'Jon Doe',
      url: 'https://example.com',
      likes: 5,
    }

    const response = await api
      .post(baseURL)
      .set('Authorization', TOKEN)
      .send(newBlog)
      .expect(201)

    const blogs = await helper.blogsInDb()
    assert.strictEqual(blogs.length, helper.initialBlogs.length + 1)

    assert.strictEqual(response.body.user.id.toString(), helper.initialUsers[1]._id)
  })
})

describe('[DELETE] /api/blogs', () => {
  test('204 successfully delete a blog belonging to token user', async () => {
    const blogsInDb = await helper.blogsInDb()
    const blogToDelete = blogsInDb[3]

    await api
      .delete(`${baseURL}/${blogToDelete.id}`)
      .set('Authorization', TOKEN)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)

    const titles = blogsAtEnd.map((blog) => blog.title)
    assert(!titles.includes(blogToDelete.title))
  })

  test('401 unauthorized on deleting a blog not belonging to token user', async () => {
    const blogsInDb = await helper.blogsInDb()
    const blogToDelete = blogsInDb[0]

    await api
      .delete(`${baseURL}/${blogToDelete.id}`)
      .set('Authorization', TOKEN)
      .expect(401)

    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)

    const titles = blogsAtEnd.map((blog) => blog.title)
    assert(titles.includes(blogToDelete.title))
  })

  test('400 on invalid id', async () => {
    const invalidId = 'invalidID'

    await api
      .delete(`${baseURL}/${invalidId}`)
      .set('Authorization', TOKEN)
      .expect(400)

    const blogs = await helper.blogsInDb()
    assert.strictEqual(blogs.length, helper.initialBlogs.length)
  })

  test('404 on missing valid id', async () => {
    const blogsInDb = await helper.blogsInDb()
    const blogToDelete = blogsInDb[3]

    await api
      .delete(`${baseURL}/${blogToDelete.id}`)
      .set('Authorization', TOKEN)
      .expect(204)

    await api
      .delete(`${baseURL}/${blogToDelete.id}`)
      .set('Authorization', TOKEN)
      .expect(404)
  })

  test('401 invalid token', async () => {
    const blogsInDb = await helper.blogsInDb()
    const blogToDelete = blogsInDb[3]

    await api
      .delete(`${baseURL}/${blogToDelete.id}`)
      .set('Authorization', 'Bearer InvalidTokenPlaceHere')
      .expect(401)

    const blogs = await helper.blogsInDb()
    assert.strictEqual(blogs.length, helper.initialBlogs.length)
  })

  test('401 missing token', async () => {
    const blogsInDb = await helper.blogsInDb()
    const blogToDelete = blogsInDb[3]

    await api
      .delete(`${baseURL}/${blogToDelete.id}`)
      .expect(401)

    const blogs = await helper.blogsInDb()
    assert.strictEqual(blogs.length, helper.initialBlogs.length)
  })
})

describe('[PUT] /api/blogs', () => {
  test('200 successfully update likes of blog', async () => {
    const blogsInDb = await helper.blogsInDb()
    const blogToUpdate = blogsInDb[3]

    blogToUpdate.likes += 10

    const response = await api
      .put(`${baseURL}/${blogToUpdate.id}`)
      .set('Authorization', TOKEN)
      .send(blogToUpdate)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogsInEnd = await helper.blogsInDb()

    // assert in both response and db
    assert.strictEqual(blogsInEnd[3].likes, blogToUpdate.likes)
    assert.strictEqual(response.body.likes, blogToUpdate.likes)
  })

  /* not required
    test('401 unathorized update of blog not belonging to token user', async () => {
        const blogsInDb = await helper.blogsInDb()
        const blogToUpdate = blogsInDb[0]

        blogToUpdate.likes = blogToUpdate.likes + 10

        await api
            .put(`${baseURL}/${blogToUpdate.id}`)
            .set('Authorization', TOKEN)
            .send(blogToUpdate)
            .expect(401)
            .expect('Content-Type', /application\/json/)

        const blogsInEnd = await helper.blogsInDb()
        assert.notStrictEqual(blogsInEnd[0].likes, blogToUpdate.likes)

    })
    */

  test('400 on invalid id', async () => {
    const blogsInDb = await helper.blogsInDb()
    const blogToUpdate = blogsInDb[3]

    blogToUpdate.likes += 10
    const invalidId = 'invalidID'

    await api
      .put(`${baseURL}/${invalidId}`)
      .set('Authorization', TOKEN)
      .send(blogToUpdate)
      .expect(400)

    const blogsInEnd = await helper.blogsInDb()
    assert.notStrictEqual(blogsInEnd[3].likes, blogToUpdate.likes)
  })

  test('404 on missing valid id', async () => {
    const blogsInDb = await helper.blogsInDb()
    const blogToUpdate = blogsInDb[3]

    blogToUpdate.likes += 10

    await api
      .delete(`${baseURL}/${blogToUpdate.id}`)
      .set('Authorization', TOKEN)
      .expect(204)

    await api
      .put(`${baseURL}/${blogToUpdate.id}`)
      .set('Authorization', TOKEN)
      .send(blogToUpdate)
      .expect(404)

    const blogsInEnd = await helper.blogsInDb()
    assert.notStrictEqual(blogsInEnd[3].likes, blogToUpdate.likes)
  })

  test('401 invalid token', async () => {
    const blogsInDb = await helper.blogsInDb()
    const blogToUpdate = blogsInDb[3]
    blogToUpdate.likes += 10

    await api
      .delete(`${baseURL}/${blogToUpdate.id}`)
      .set('Authorization', 'Bearer InvalidTokenPlaceHere')
      .expect(401)

    const blogsInEnd = await helper.blogsInDb()
    assert.notStrictEqual(blogsInEnd[3].likes, blogToUpdate.likes)
  })

  test('401 missing token', async () => {
    const blogsInDb = await helper.blogsInDb()
    const blogToUpdate = blogsInDb[3]
    blogToUpdate.likes += 10

    await api
      .delete(`${baseURL}/${blogToUpdate.id}`)
      .expect(401)

    const blogsInEnd = await helper.blogsInDb()
    assert.notStrictEqual(blogsInEnd[3].likes, blogToUpdate.likes)
  })
})

after(async () => {
  await mongoose.connection.close()
})
