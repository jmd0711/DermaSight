import { Container, Button } from 'react-bootstrap';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Container fluid className="min-h-screen d-flex align-items-center justify-content-center">
      <div className="text-center">
        <h1 className="display-1 fw-bold text-primary">404</h1>
        <h2 className="h4 mb-3">Page Not Found</h2>
        <p className="text-muted mb-4">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/">
          <Button variant="primary">
            Go Home
          </Button>
        </Link>
      </div>
    </Container>
  );
}