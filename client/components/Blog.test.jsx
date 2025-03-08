import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect } from 'vitest'
import { Blog, BlogForm } from './Blog'

const BLOG = {
  title: 'a new blog',
  author: 'user',
  likes: 0,
  url: 'url:/blog/0',
  user: {
    name: 'name',
    username: 'username',
  },
}

describe('<Blog/>', () => {
  let container
  let mockOnLikeEvent

  beforeEach(() => {
    mockOnLikeEvent = vi.fn()
    container = render(<Blog blog={BLOG} onLikeClick={mockOnLikeEvent} />).container
  })

  test('renders title,author and not renders url,likes', () => {
    const div = container.querySelector('.blog')
    expect(div).toHaveTextContent(`${BLOG.title} ${BLOG.author}`)
    expect(div).not.toHaveTextContent(`${BLOG.url}`)
    expect(div).not.toHaveTextContent(`likes ${BLOG.likes}`)
  })

  test('renders url,likes when button is pressed', async () => {
    const user = userEvent.setup()
    const viewButton = screen.getByText('view')
    await user.click(viewButton)

    const div = container.querySelector('.blog')
    expect(div).toHaveTextContent(`${BLOG.url}`)
    expect(div).toHaveTextContent(`likes ${BLOG.likes}`)
  })

  test('like button called twice', async () => {
    const user = userEvent.setup()
    const viewButton = screen.getByText('view')
    await user.click(viewButton) // enable like button

    const likeButton = screen.getByText('like')
    await user.click(likeButton)
    await user.click(likeButton)

    expect(mockOnLikeEvent.mock.calls).toHaveLength(2)
  })
})

describe('<BlogForm />', () => {
  test('BlogForm ', async () => {
    const mockOnCreateBlogEvent = vi.fn()
    render(<BlogForm createBlog={mockOnCreateBlogEvent} />)

    const inputTitle = screen.getByPlaceholderText('write blog title')
    const inputAuthor = screen.getByPlaceholderText('write blog author')
    const inputUrl = screen.getByPlaceholderText('write blog url')
    const createButton = screen.getByText('create')

    const user = userEvent.setup()
    await user.type(inputTitle, BLOG.title)
    await user.type(inputAuthor, BLOG.author)
    await user.type(inputUrl, BLOG.url)
    await user.click(createButton)

    expect(mockOnCreateBlogEvent.mock.calls).toHaveLength(1)
    expect(mockOnCreateBlogEvent.mock.calls[0][0].title).toBe(BLOG.title)
    expect(mockOnCreateBlogEvent.mock.calls[0][0].author).toBe(BLOG.author)
    expect(mockOnCreateBlogEvent.mock.calls[0][0].url).toBe(BLOG.url)
  })
})
