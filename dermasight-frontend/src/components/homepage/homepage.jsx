import { Button, Container, Form, FloatingLabel, Row, Col } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import './homepage.css'
const HomePage = () => {
  const navigate=useNavigate()
  const onStarted = () => {
    navigate('/upload')
  }

  return (
    <Container fluid className='main-page'>
      <div className='main-body'>
        <Row className='homepage-content'>
            <Col>
            <h3 className="title text-dark mb-3">DermaSight</h3>
            <h4>Spot The Signs,</h4>
            <h4>Protect Your Skin.</h4>
            <Button variant="primary" onClick={onStarted}>Get Started</Button>
          </Col>
        </Row>
      </div>

    </Container>
  )
}

export default HomePage;