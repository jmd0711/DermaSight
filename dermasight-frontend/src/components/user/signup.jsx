import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button, Container, Form, FloatingLabel } from "react-bootstrap"

const SignUp = ({ setToken }) => {
  const [username, setUserName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Signup failed")
      }

      // After signup, auto-login to get tokens
      const loginResponse = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })

      const loginData = await loginResponse.json()
      if (!loginResponse.ok) throw new Error(loginData.error || "Login failed")

      // Store tokens
      localStorage.setItem("access", loginData.access)
      localStorage.setItem("refresh", loginData.refresh)
      localStorage.setItem("username", loginData.username)
      localStorage.setItem("userId", loginData.userId)

      setToken(loginData.access)
      navigate("/profile")

    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }

  return (
    <Container fluid className="main-page">
      <div className="main-body h-100">
        <h3 className="text-dark mb-3">Sign Up</h3>
        <Form onSubmit={handleSubmit}>
          <FloatingLabel controlId="floatingUsername" label="Username" className="mb-3">
            <Form.Control
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={e => setUserName(e.target.value)}
            />
          </FloatingLabel>
          <FloatingLabel controlId="floatingEmail" label="Email" className="mb-3">
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={e => setEmail(e.target.value)}
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

export default SignUp
