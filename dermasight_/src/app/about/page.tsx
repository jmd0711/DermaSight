import { Container, Row, Col } from 'react-bootstrap';

export default function AboutPage() {
  return (
    <Container fluid className="main-container py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <div className="text-center mb-5 fade-in">
            <h1 className="display-4 fw-bold text-primary-custom mb-4">About DermaSight</h1>
            <p className="lead text-muted">
              Revolutionizing dermatology with AI-powered skin condition analysis and expert guidance.
            </p>
          </div>

          <Row className="g-4 mb-5">
            <Col md={6}>
              <div className="card h-100 border-0 shadow-sm card-hover">
                <div className="card-body p-4">
                  <div className="text-center mb-3">
                    <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                      <i className="fas fa-eye text-primary fs-4"></i>
                    </div>
                  </div>
                  <h5 className="fw-semibold text-center mb-3">Our Mission</h5>
                  <p className="text-muted">
                    To make dermatological care more accessible through advanced AI technology, 
                    helping people identify and understand skin conditions early for better health outcomes.
                  </p>
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div className="card h-100 border-0 shadow-sm card-hover">
                <div className="card-body p-4">
                  <div className="text-center mb-3">
                    <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                      <i className="fas fa-shield-alt text-primary fs-4"></i>
                    </div>
                  </div>
                  <h5 className="fw-semibold text-center mb-3">Privacy & Security</h5>
                  <p className="text-muted">
                    Your health data is encrypted and secure. We follow strict privacy protocols 
                    and never share personal information without explicit consent.
                  </p>
                </div>
              </div>
            </Col>
          </Row>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-5">
              <h3 className="fw-semibold mb-4">How DermaSight Works</h3>
              <Row className="g-4">
                <Col md={4}>
                  <div className="d-flex align-items-start">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px', minWidth: '40px'}}>
                      <span className="fw-bold">1</span>
                    </div>
                    <div>
                      <h6 className="fw-semibold">Upload Image</h6>
                      <p className="text-muted small mb-0">
                        Take or upload a clear photo of the skin area of concern.
                      </p>
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="d-flex align-items-start">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px', minWidth: '40px'}}>
                      <span className="fw-bold">2</span>
                    </div>
                    <div>
                      <h6 className="fw-semibold">AI Analysis</h6>
                      <p className="text-muted small mb-0">
                        Our advanced AI analyzes the image and provides insights.
                      </p>
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="d-flex align-items-start">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px', minWidth: '40px'}}>
                      <span className="fw-bold">3</span>
                    </div>
                    <div>
                      <h6 className="fw-semibold">Get Results</h6>
                      <p className="text-muted small mb-0">
                        Receive detailed analysis and recommendations for next steps.
                      </p>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>

          <div className="text-center mt-5 pt-4">
            <p className="text-muted">
              <strong>Disclaimer:</strong> DermaSight is not a substitute for professional medical advice. 
              Always consult with a qualified healthcare provider for medical concerns.
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
}