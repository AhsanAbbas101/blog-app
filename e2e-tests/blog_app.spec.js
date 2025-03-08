/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const {
  test, expect, beforeEach, describe,
} = require('@playwright/test')
const { loginWith, createBlog } = require('./helper')

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('/api/testing/reset')
    await request.post('/api/users', {
      data: {
        name: 'New User',
        username: 'newUser',
        password: 'iamnewhere',
      },
    })
    await request.post('/api/users', {
      data: {
        name: 'Second User',
        username: 'secondUser',
        password: 'iamnotnewhere',
      },
    })

    await page.goto('/')
  })

  test('Login form is shown', async ({ page }) => {
    await expect(page.getByText('log in to application')).toBeVisible()
    await expect(page.getByTestId('username')).toBeVisible()
    await expect(page.getByTestId('password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await loginWith(page, 'newUser', 'iamnewhere')
      await expect(page.getByText('New User logged in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      await loginWith(page, 'newUser', 'hehehe')
      const errorDiv = await page.locator('.error')
      await expect(errorDiv).toContainText('Invalid username or password')
      await expect(page.getByText('New User logged in')).not.toBeVisible()
    })
  })

  describe('When logged in', () => {
    const BLOG = {
      title: 'a new blog',
      author: 'John',
      url: 'url:/blog/0',
    }

    beforeEach(async ({ page }) => {
      await loginWith(page, 'newUser', 'iamnewhere')
    })

    test('a new blog can be created', async ({ page }) => {
      await createBlog(page, BLOG.title, BLOG.author, BLOG.url)

      const errorDiv = await page.locator('.error')
      await expect(errorDiv).toContainText(`New Blog with title ${BLOG.title} added!`)

      const blogDiv = await page.locator('.blog').filter({ hasText: `${BLOG.title} ${BLOG.author}` })
      await expect(blogDiv).toHaveCount(1)

      await page.getByText(`${BLOG.title} ${BLOG.author}`).waitFor()
      await expect(page.getByText(`${BLOG.title} ${BLOG.author}`)).toBeVisible()
    })

    describe('blog added', () => {
      beforeEach(async ({ page }) => {
        await createBlog(page, BLOG.title, BLOG.author, BLOG.url)
        await page.getByText(`${BLOG.title} ${BLOG.author}`).waitFor()
      })

      test('like blog', async ({ page }) => {
        const blogDiv = await page.locator('.blog').filter({ hasText: `${BLOG.title} ${BLOG.author}` })
        await blogDiv.getByRole('button', { name: 'view' }).click()

        await blogDiv.getByRole('button', { name: 'like' }).click()
        await expect(blogDiv).toContainText('likes 1')
      })

      test('delete blog', async ({ page }) => {
        const blogDiv = await page.locator('.blog').filter({ hasText: `${BLOG.title} ${BLOG.author}` })
        await blogDiv.getByRole('button', { name: 'view' }).click()

        page.on('dialog', (dialog) => dialog.accept())
        await blogDiv.getByRole('button', { name: 'remove' }).click()

        await expect(page.locator('.blog')).toHaveCount(0)
      })

      describe('blog added for other user', () => {
        const otherBlogs = [
          {
            title: 'blog about me',
            author: 'Dave',
            url: 'url:/blog/dave/0',
          },
          {
            title: 'blog about world',
            author: 'Dave',
            url: 'url:/blog/dave/1',
          },
        ]
        beforeEach(async ({ page }) => {
          // logout previous user
          await page.getByRole('button', { name: 'Log out' }).click()

          await loginWith(page, 'secondUser', 'iamnotnewhere')
          await page.getByText('Second User logged in').waitFor()

          for (const blog of otherBlogs) {
            await createBlog(page, blog.title, blog.author, blog.url)
            await page.getByText(`${blog.title} ${blog.author}`).waitFor()
          }
        })

        test('second user cannot delete first users blog', async ({ page }) => {
          const blogDiv = await page.locator('.blog').filter({ hasText: `${BLOG.title} ${BLOG.author}` })
          await blogDiv.getByRole('button', { name: 'view' }).click()

          await expect(blogDiv.getByRole('button', { name: 'remove' })).not.toBeVisible()
        })

        test('blogs appear in desc likes order', async ({ page, request }) => {
          const response = await request.get('/api/blogs')
          const allBlogs = await response.json()

          let n = 1
          for (const blog of allBlogs) {
            const div = await page.getByTestId(blog.id)
            await div.getByRole('button', { name: 'view' }).click()

            // give n likes to blog. blog[0] will have lowest likes and blog[2] will have highest
            for (let i = 0; i < n; ++i) {
              // const div = await page.getByTestId(blog.id)
              await div.getByRole('button', { name: 'like' }).click()

              blog.likes += 1
              await div.getByText(`likes ${blog.likes}`).waitFor()
            }
            n += 1
          }

          const blogDivs = await page.locator('.blog').all()
          await expect(blogDivs[0].getByText(`likes ${allBlogs[2].likes}`)).toBeVisible() // blog[2] with highest likes have the first div
          await expect(blogDivs[1].getByText(`likes ${allBlogs[1].likes}`)).toBeVisible()
          await expect(blogDivs[2].getByText(`likes ${allBlogs[0].likes}`)).toBeVisible()
        })
      })
    })
  })
})
