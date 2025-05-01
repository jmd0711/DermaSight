import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Button, Container, Form, FloatingLabel } from 'react-bootstrap'

const Login = ({ setToken }) => {
  const [username, setUserName] = useState()
  const [password, setPassword] = useState()
  const navigate=useNavigate()

  const handleSubmit = () => {
    //TODO: login using API
    setToken(username)
    navigate('/')
  }
  return (
    <Container fluid className='main-page'>
        <div className='auth-body h-100 py-3 px-5'>
          <h3 className="text-dark mb-3">Log In</h3>
          <Form onSubmit={handleSubmit}>
            <FloatingLabel
              controlId="floatingInput"
              label="Username"
              className="mb-3">
              <Form.Control
                type="text"
                name="username"
                placeholder="Enter username"
                value={username}
                onChange={e => setUserName(e.target.value)}
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="floatingInput"
              label="Password"
              className="mb-3">
              <Form.Control
                type="password"
                name="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </FloatingLabel>
            <div className="d-flex justify-content-end flex-grow-1">
              <Button variant="primary" type="submit">
                Submit
              </Button>
            </div>
          </Form>
        </div>
      </Container>
  )
}

export default Login;

Login.propTypes = {
  setToken: PropTypes.func.isRequired
}