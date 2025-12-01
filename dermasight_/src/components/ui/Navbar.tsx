'use client';

import { Nav, Navbar } from 'react-bootstrap';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useToken from '@/hooks/useToken';

const NavBar = () => {
  const { token, removeToken, isAuthenticated } = useToken();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("reportData")
    localStorage.removeItem("reports")
    removeToken();
    router.push('/');
    router.refresh();
  };

  const UserLinks = () => (
    <Nav variant="underline">
      <Nav.Link href="/about">
        About
      </Nav.Link>
      <Nav.Link href="/upload">
        Upload
      </Nav.Link>
      <Nav.Link href="/chatbot">
        Chatbot
      </Nav.Link>
      <Nav.Link href="/profile">
        Profile
      </Nav.Link>
      <Nav.Link onClick={handleLogout} style={{ cursor: 'pointer' }}>
        Log Out
      </Nav.Link>
    </Nav>
  );

  const GuestLinks = () => (
    <Nav variant="underline">
      <Nav.Link href="/about">
        About
      </Nav.Link>
      <Nav.Link href="/login">
        Log In
      </Nav.Link>
      <Nav.Link href="/signup">
        Sign Up
      </Nav.Link>
    </Nav>
  );

  return (
    <Navbar 
      expand="lg"
      className="px-4 shadow-sm navbar-custom"
      style={{ backgroundColor: 'var(--color-primary)' }}
      variant="dark"
    >
      <Link href="/">
        <Navbar.Brand className="fw-bold fs-3 text-white">
          🔬 DermaSight
        </Navbar.Brand>
      </Link>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse className="justify-content-end">
        {isAuthenticated ? <UserLinks /> : <GuestLinks />}
      </Navbar.Collapse>
    </Navbar>
  );
};

export default NavBar;