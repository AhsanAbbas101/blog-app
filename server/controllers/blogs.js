const blogsRouter = require('express').Router()

const Blog = require('@models/blog')
const User = require('@models/user')
const { userExtractor } = require('@middleware')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({})
    .populate('user', { username: 1, name: 1 })

  return response.json(blogs)
})

blogsRouter.post('/', userExtractor, async (request, response) => {
  const blog = new Blog(request.body)
  blog.likes = blog.likes || 0

  if (blog.title && blog.url) {
    const { user } = request
    blog.user = user._id

    const result = await blog.save().then((t) => t.populate('user', { username: 1, name: 1 })).then((t) => t)

    // assign blog id to user doc
    await User.findByIdAndUpdate(user._id, { blogs: user.blogs.concat([blog.id]) }, { new: true })

    return response.status(201).json(result)
  }

  return response.status(400).json({ error: 'Missing blog title or url' })
})

blogsRouter.delete('/:id', userExtractor, async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  if (!blog) {
    return response.status(404).json({ error: 'invalid blog id' })
  }

  if (blog.user.toString() === request.user.id.toString()) {
    await Blog.findByIdAndDelete(request.params.id)
    return response.status(204).end()
  }

  return response.status(401).json({ error: 'Deletion on object not allowed.' })
})

blogsRouter.put('/:id', userExtractor, async (request, response) => {
  const { body } = request
  const blogToUpdate = {
    likes: body.likes || 0,
  }

  const blog = await Blog.findById(request.params.id)
  if (!blog) {
    return response.status(404).json({ error: 'invalid blog id' })
  }

  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blogToUpdate, { new: true }).populate('user', { username: 1, name: 1 })
  return response.status(200).json(updatedBlog)
})

module.exports = blogsRouter
