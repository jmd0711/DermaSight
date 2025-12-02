import { Nav, Navbar } from "react-bootstrap"

const NavBar = () => {
  const logOut = () => {
    localStorage.removeItem('token')
  }

  const userLink = (
    <Nav variant="underline">
      <Nav.Link href="/about">About</Nav.Link>
      <Nav.Link href="/upload">Upload</Nav.Link>
      <Nav.Link href="/profile">Profile</Nav.Link>
      <Nav.Link href="/" onClick={logOut}>Log Out</Nav.Link>
    </Nav>
  )
  
  const loginRegisterLink = (
    <Nav variant="underline">
        <Nav.Link href="/about">About</Nav.Link>
        <Nav.Link href="/login">Log In</Nav.Link>
        <Nav.Link href="/signup">Sign Up</Nav.Link>
    </Nav>
  )

  return (
    <Navbar bg="navbar-color" data-bs-theme="dark" className="px-3">
      <Navbar.Brand href="/">DermaSight</Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse className="justify-content-end">
        {typeof localStorage.token === "string" ? userLink : loginRegisterLink}
      </Navbar.Collapse>
    </Navbar>

  )
}

export default NavBar;