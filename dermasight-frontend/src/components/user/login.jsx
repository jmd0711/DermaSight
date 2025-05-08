import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Button, Container, Form, FloatingLabel } from 'react-bootstrap'

const Login = ({ setToken }) => {
  const [username, setUsername] = useState()
  const [password, setPassword] = useState()
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState("");
  const navigate=useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (res.ok) {
      setUserId(data.userId);
      setUsername(data.username);
      setError("");
      // e.preventDefault()
      setToken(data.username)
      navigate('/profile')
      // navigate(0)
    } else {
      setError(data.error || "Login failed");
    }
  }
  return (
    <Container fluid className='main-page'>
        <div className='main-body'>
          <h3 className="text-dark mb-3">Log In</h3>
          <Form onSubmit={handleSubmit}>
            <FloatingLabel
              controlId="username"
              label="Username"
              className="mb-3">
              <Form.Control
                type="text"
                name="username"
                placeholder="Enter username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="password"
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