const loginWith = async (page, username, password) => {
  await page.getByTestId('username').fill(username)
  await page.getByTestId('password').fill(password)
  await page.getByRole('button', { name: 'Login' }).click()
}

const createBlog = async (page, title, author, url) => {
  await page.getByRole('button', { name: 'new blog' }).click()

  await page.getByPlaceholder('write blog title').fill(title)
  await page.getByPlaceholder('write blog author').fill(author)
  await page.getByPlaceholder('write blog url').fill(url)

  await page.getByRole('button', { name: 'create' }).click()
}

export { loginWith, createBlog }
