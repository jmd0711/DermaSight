import { useState } from "react"
import { useNavigate } from "react-router-dom"
import PropTypes from "prop-types"
import { Button, Container, Form, FloatingLabel } from "react-bootstrap"

const Login = ({ setToken }) => {
  const [username, setUserName] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch("http://localhost:5002/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      // Store tokens in localStorage
      localStorage.setItem("access", data.access)
      localStorage.setItem("refresh", data.refresh)
      localStorage.setItem("username", data.username)
      localStorage.setItem("userId", data.userId)

      setToken(data.access)
      navigate("/profile")

    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }

  return (
    <Container fluid className="main-page">
      <div className="main-body">
        <h3 className="text-dark mb-3">Log In</h3>
        <Form onSubmit={handleSubmit}>
          <FloatingLabel controlId="floatingUsername" label="Username" className="mb-3">
            <Form.Control
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={e => setUserName(e.target.value)}
            />
          </FloatingLabel>
          <FloatingLabel controlId="floatingPassword" label="Password" className="mb-3">
            <Form.Control
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </FloatingLabel>
          <div className="d-flex justify-content-end flex-grow-1">
            <Button variant="primary" type="submit">Submit</Button>
          </div>
        </Form>
      </div>
    </Container>
  )
}

Login.propTypes = { setToken: PropTypes.func.isRequired }
export default Login
