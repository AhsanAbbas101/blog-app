import { useState, useEffect, useRef } from 'react'

// Components
import { Blog, BlogForm } from './Blog'
import Login from './Login'
import Notification from './Notification'
import Togglable from './Togglable'

// Services
import blogService from '../services/blogs'
import loginService from '../services/login'

function App() {
  const [blogs, setBlogs] = useState([])
  const [loggedUser, setLoggedUser] = useState(null)
  const [noificationMsg, setNoificationMsg] = useState(null)

  const blogFormRef = useRef()

  const setBlogsSorted = (blogs) => {
    setBlogs(blogs.sort((a, b) => b.likes - a.likes))
  }

  useEffect(() => {
    blogService.getAll().then((blogs) => setBlogsSorted(blogs))
  }, [])

  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedAppUser')
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON)
      blogService.setToken(user.token)
      setLoggedUser(user)
    }
  }, [])

  const onLogout = () => {
    setLoggedUser(null)
    window.localStorage.removeItem('loggedAppUser')
  }

  const loginUser = async (username, password) => {
    try {
      const user = await loginService.login({ username, password })
      blogService.setToken(user.token)

      window.localStorage.setItem('loggedAppUser', JSON.stringify(user))
      setLoggedUser(user)

      enableNotification(true, `${username} successfully logged in.`)
      return true
    } catch (exception) {
      enableNotification(false, 'Invalid username or password')
      console.log('Invalid username or password')
      return false
    }
  }

  const createBlog = async (newBlog) => {
    try {
      const blog = await blogService.create(newBlog)
      setBlogs(blogs.concat(blog))

      console.log(`New Blog title ${blog.title} added!`)
      enableNotification(true, `New Blog with title ${blog.title} added!`)

      blogFormRef.current.toggleVisibility()
    } catch (exception) {
      enableNotification(false, 'Failed to create new blog.')
      console.log('Error creating new blog')
    }
  }

  const likePost = async (blog) => {
    blog.likes = blog.likes + 1 || 1
    const obj = {
      user: blog.user.id,
      likes: blog.likes,
      author: blog.author,
      title: blog.title,
      url: blog.url,
    }

    const updatedBlog = await blogService.put(blog.id, obj)
    setBlogsSorted(blogs.map((blog) => (blog.id === updatedBlog.id ? updatedBlog : blog)))
  }

  const deleteBlog = async (blog) => {
    await blogService.del(blog.id)

    enableNotification(true, 'Blog deleted successfully.')
    setBlogs(blogs.filter((b) => b.id.toString() !== blog.id.toString()))
  }

  const enableNotification = (positive, msg, delay = 5000) => {
    setNoificationMsg({
      positive,
      msg,
    })
    setTimeout(() => {
      setNoificationMsg(null)
    }, delay)
  }

  if (loggedUser === null) {
    return (
      <div>
        <h2>log in to application</h2>
        <Notification notification={noificationMsg} />
        <Login loginUser={loginUser} />
      </div>
    )
  }

  return (
    <div>
      <h2>blogs</h2>
      <Notification notification={noificationMsg} />
      <p>
        {loggedUser.name}
        {' '}
        logged in
        <button onClick={onLogout}>Log out</button>
      </p>

      <h2>create new</h2>
      <Togglable buttonLabel="new blog" ref={blogFormRef}>
        <BlogForm createBlog={createBlog} />
      </Togglable>

      {blogs.map((blog) => <Blog key={blog.id} blog={blog} onLikeClick={likePost} onRemoveClick={deleteBlog} loggedUsername={loggedUser.username} />)}
    </div>
  )
}

export default App
