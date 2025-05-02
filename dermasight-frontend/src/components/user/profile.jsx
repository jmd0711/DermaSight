import { Button, Container, Form, FloatingLabel, Row, Col, Card } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import './user.css'
const Profile = () => {
  return (
    <Container fluid className='main-page'>
      <div className='main-body h-100'>
        <h3 className="title text-dark mb-3">Profile</h3>
        <Row className='profile-content'>
          <Col xl={3} style={{borderRightStyle: 'dotted'}}>
            <div style={{display: 'flex', justifyContent: 'center'}}>Username</div>
            <div className='user-image'></div>
            <div>info</div>
          </Col>
          <Col>
            <Card>
              <Row>
                <Col xl={1}>img</Col>
                <Col>Skin Lesion #1</Col>
              </Row>
            </Card>
            <Card>
              <Row>
                <Col xl={1}>img</Col>
                <Col>Skin Lesion #2</Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </Container>
  )
}

export default Profile;