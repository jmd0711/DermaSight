
import { useState } from 'react'
import { Button, Container, Form, FloatingLabel, Row, Col, Accordion } from 'react-bootstrap'
import { useNavigate, useLocation } from 'react-router-dom'
import './report.css'

const Report = () => {
  const location = useLocation()
  const data = location.state
  const navigate=useNavigate()

  const onDelete = () => {
    navigate('/upload')
  }

  const onSave = () => {
    navigate('/profile')
  }

  return (
    <Container fluid className='main-page'>
      <div className='main-body'>
        <h3 className="title text-dark mb-3">Report</h3>
        <Row className='report-content'>
          <Col xl={3} style={{borderRightStyle: 'dotted'}}>
            <div style={{display: 'flex', justifyContent: 'center'}}>Skin Lesion Name</div>
            <img className='skin-image' src={data.image}></img>
            <div>Location: {data.location}</div>
            <div>Size: {data.size}</div>
            <div>Duration: {data.duration}</div>
            <div>Symptoms: {data.symptoms.join(", ")}</div>
            <div>Additional Information: {data.additional}</div>
          </Col>
          <Col>
            <Accordion defaultActiveKey="0" flush>
              <Accordion.Item eventKey="0">
                <Accordion.Header>Characteristics</Accordion.Header>
                <Accordion.Body>
                  ...
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="1">
                <Accordion.Header>Common Causes</Accordion.Header>
                <Accordion.Body>
                  ...
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="2">
                <Accordion.Header>Known Treatments</Accordion.Header>
                <Accordion.Body>
                  ...
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="3">
                <Accordion.Header>Seek Care</Accordion.Header>
                <Accordion.Body>
                  ...
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
            <div className='report-buttons'>
              <Button variant='danger' onClick={onDelete} style={{marginRight: 10}}>Delete</Button>
              <Button variant='primary' style={{marginRight: 10}}>Share</Button>
              <Button variant='primary' onClick={onSave}>Save</Button>
            </div>
          </Col>
        </Row>
        
      </div>
    </Container>
  )
}

export default Report;