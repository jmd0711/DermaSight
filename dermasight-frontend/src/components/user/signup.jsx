import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Container, Form, FloatingLabel } from "react-bootstrap"

const SignUp = ({ setToken }) => {
  const [username, setUserName] = useState()
  const [password, setPassword] = useState()
  const [email, setEmail] = useState()
  const navigate=useNavigate()
  const [age, setAge] = useState("");
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const res = await fetch("http://localhost:5000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password}),
    });

    const data = await res.json();
    if (res.ok) {
      setUserId(data.userId);
      setError("");
    } else {
      setError(data.error || "Failed to create user");
    }
    navigate('/login')
  }

  return (
    <Container fluid className='main-page'>
      <div className='main-body h-100'>
        <h3 className="text-dark mb-3">Sign Up</h3>
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
              onChange={e => setUserName(e.target.value)}
            />
          </FloatingLabel>
          <FloatingLabel
            controlId="email"
            label="Email"
            className="mb-3">
            <Form.Control
              type="email"
              name="email"
              placeholder="Enter email"
              value={email}
              onChange={e => setEmail(e.target.value)}
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

export default SignUp;