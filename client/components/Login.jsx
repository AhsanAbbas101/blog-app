import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

/*
* Login component
*
*/
function Login({ loginUser }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const onLogin = (event) => {
    event.preventDefault()
    loginUser(username, password)

    setUsername('')
    setPassword('')
  }

  return (

    <form onSubmit={onLogin}>
      <div>
        username
        <input
          type="text"
          value={username}
          name="Username"
          onChange={({ target }) => setUsername(target.value)}
          data-testid="username"
        />
      </div>
      <div>
        password
        <input
          type="password"
          value={password}
          name="Password"
          onChange={({ target }) => setPassword(target.value)}
          data-testid="password"
        />
      </div>
      <button type="submit">Login</button>
    </form>

  )
}

Login.propTypes = {
  loginUser: PropTypes.func.isRequired,
}

export default Login
