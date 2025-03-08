const _ = require('lodash')

// eslint-disable-next-line no-unused-vars
const dummy = (blogs) => 1

const totalLikes = (blogs) => {
  const reducer = (sum, item) => sum + (item.likes || 0)

  return blogs.length === 0
    ? 0
    : blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) return {}

  const max = blogs.reduce((acc, val) => Math.max(acc, val.likes), blogs[0].likes)

  const favBlog = blogs.find((blog) => blog.likes === max)
  return (({ title, author, likes }) => ({ title, author, likes }))(favBlog)
}

const mostBlogs = (blogs) => {
  if (blogs.length === 0) return {}

  const authors = _.countBy(blogs, (blog) => blog.author)
  const max = _.max(Object.values(authors))
  const mostBlogsAuthor = _.findKey(authors, (o) => o === max)
  return {
    author: mostBlogsAuthor,
    blogs: max,
  }
}

const mostLikes = (blogs) => {
  if (blogs.length === 0) return {}

  const result = _(blogs).groupBy((blog) => blog.author).mapValues((groupedBlogs) => groupedBlogs.reduce((sum, item) => item.likes + sum, 0)).value()
  const max = _.max(Object.values(result))
  const mostLikesByAuthor = _.findKey(result, (o) => o === max)
  return {
    author: mostLikesByAuthor,
    likes: max,
  }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
}
