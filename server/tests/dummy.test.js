const { test } = require('node:test')
const assert = require('node:assert')
const listHelper = require('@util/list_helper')

test('dummy returns one', () => {
  const blogs = []

  const result = listHelper.dummy(blogs)
  assert.strictEqual(result, 1)
})
