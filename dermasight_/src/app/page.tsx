'use client';

import { Container, Row, Col, Button } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import useToken from '@/hooks/useToken';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useToken();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/upload');
    } else {
      router.push('/login');
    }
  };

  return (
    <Container fluid className="main-container">
      <div className="d-flex align-items-center justify-content-center min-vh-100 px-4">
        <Row className="w-100">
          <Col lg={10} xl={8} className="mx-auto text-center">
            <div className="py-5 fade-in">
              <h1 className="display-2 fw-bold text-primary-custom mb-4 slide-up">
                DermaSight
              </h1>
              <h2 className="h2 text-dark mb-4 slide-up" style={{ animationDelay: '0.2s' }}>
                Spot The Signs,
              </h2>
              <h2 className="h2 text-dark mb-5 slide-up" style={{ animationDelay: '0.4s' }}>
                Protect Your Skin.
              </h2>
              <p className="lead text-muted mb-5">
                Get AI-powered dermatology insights and professional consultations. 
                Upload images of skin conditions and receive instant analysis from our advanced AI system.
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={handleGetStarted}
                  className="px-5 py-3"
                >
                  Get Started
                </Button>
                <Button 
                  variant="outline-primary" 
                  size="lg"
                  onClick={() => router.push('/about')}
                  className="px-5 py-3"
                >
                  Learn More
                </Button>
              </div>
              
              <div className="mt-5 pt-5">
                <Row className="g-4">
                  <Col md={4}>
                    <div className="text-center">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                        <i className="fas fa-camera text-primary fs-4"></i>
                      </div>
                      <h5 className="fw-semibold">Upload Images</h5>
                      <p className="text-muted small">Easily upload photos of skin conditions for analysis</p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                        <i className="fas fa-brain text-primary fs-4"></i>
                      </div>
                      <h5 className="fw-semibold">AI Analysis</h5>
                      <p className="text-muted small">Get instant AI-powered insights and recommendations</p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                        <i className="fas fa-comments text-primary fs-4"></i>
                      </div>
                      <h5 className="fw-semibold">Expert Chat</h5>
                      <p className="text-muted small">Chat with our AI dermatology assistant for guidance</p>
                    </div>
                  </Col>
                </Row>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </Container>
  );
}
