import { useEffect, useState } from 'react'
import { Button, Container, Row, Col, Card } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import './user.css'

const Profile = () => {
  const [reports, setReports] = useState([])
  const [userInfo, setUserInfo] = useState({ username: "" })
  const navigate = useNavigate()

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('http://localhost:5000/user/reports', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`
          }
        })
        if (!res.ok) throw new Error("Failed to fetch reports")
        const data = await res.json()
        setUserInfo({ username: data.username })
        setReports(data.reports || [])
      } catch (err) {
        console.error(err)
      }
    }
    fetchReports()
  }, [])

  const viewReport = (report) => {
    navigate("/report", { state: report })
  }

  return (
    <Container fluid className='main-page'>
      <div className='main-body'>
        <h3 className="title text-dark mb-3">Profile</h3>
        <Row className='profile-content'>
          <Col xl={3} style={{ borderRightStyle: 'dotted' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <strong>{userInfo.username}</strong>
            </div>
            <div className='user-image'></div>
          </Col>

          <Col>
            {reports.length === 0 && <p>No reports yet.</p>}

            {reports.map((report, index) => (
              <Card key={index} className='mb-3 report-card'>
                <Row className='align-items-center'>
                  <Col xl={2}>
                    <img src={report.imageUrl} alt={`Report ${index + 1}`} className="report-thumbnail" />
                  </Col>
                  <Col>
                    <div>Skin Lesion #{index + 1}</div>
                    <div>Condition: {report.skinCondition}</div>
                    <div>Confidence: {report.confidence}%</div>
                  </Col>
                  <Col xl={2}>
                    <Button variant="primary" onClick={() => viewReport(report)}>
                      View
                    </Button>
                  </Col>
                </Row>
              </Card>
            ))}
          </Col>
        </Row>
      </div>
    </Container>
  )
}

export default Profile
