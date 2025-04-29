import { Link } from 'react-router-dom'
import { Container, Nav, Navbar } from "react-bootstrap"

const userLink = (
  <div>
    <Nav variant="underline">
      <Nav.Link href="/about">About</Nav.Link>
      <Nav.Link href="/upload">Upload</Nav.Link>
      <Nav.Link href="/profile">Profile</Nav.Link>
      <Nav.Link href="/">Log Out</Nav.Link>
    </Nav>
  </div>
)

const loginRegisterLink = (
  <Nav variant="underline">
      <Nav.Link href="/about">About</Nav.Link>
      <Nav.Link href="/login">Log In</Nav.Link>
      <Nav.Link href="/signup">Sign Up</Nav.Link>
  </Nav>
)

const NavBar = () => {
  return (
    <Navbar bg="dark" data-bs-theme="dark" className="px-3">
      <Navbar.Brand href="/">DermaSight</Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse className="justify-content-end">
        {typeof localStorage.userToken === "string" ? userLink : loginRegisterLink}
      </Navbar.Collapse>
    </Navbar>

  )
}

export default NavBar;