'use client';

import { useState, FormEvent } from 'react';
import { Button, Form, Container, Row, Col } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface QuestionnaireProps {
  croppedImage: string;
  setData: (data: QuestionnaireData) => void;
}

interface QuestionnaireData {
  image: string;
  location: string;
  size: string;
  duration: string;
  symptoms: string[];
  additional: string;
}

const Questionnaire = ({ croppedImage, setData }: QuestionnaireProps) => {
  const LOCATIONS_A = ["Face", "Back", "Leg", "Arm", "Chest", "Other"];
  const SIZES_A = ["<3mm", "3–5mm", "6–10mm", "1–2cm", ">2cm", "Not sure"];
  const DURATIONS_A = ["couple days", "couple weeks", "1 month", "2-3 month", "1 year or more", "Not sure"];
  const SYMPTOMS_A = ["Itching", "Pain", "Bleeding", "Peeling"];

  const [location, setLocation] = useState("Face");
  const [size, setSize] = useState("<3mm");
  const [duration, setDuration] = useState("couple days");
  const [symptoms, setSymptoms] = useState(new Array(SYMPTOMS_A.length).fill(false));
  const [additional, setAdditional] = useState("");
  
  const router = useRouter();

  const handleSymptomsChange = (position: number) => {
    const updatedSymptoms = symptoms.map((item, index) => 
      index === position ? !item : item
    );
    setSymptoms(updatedSymptoms);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const dataSymptoms: string[] = [];
    symptoms.forEach((item, index) => {
      if (item) {
        dataSymptoms.push(SYMPTOMS_A[index]);
      }
    });

    const questionnaireData: QuestionnaireData = {
      image: croppedImage,
      location,
      size,
      duration,
      symptoms: dataSymptoms,
      additional,
    };

    setData(questionnaireData);
    
    // Navigate to report page
    localStorage.setItem('reportData', JSON.stringify(questionnaireData));
    router.push('/report');
  };

  return (
    <Container fluid className="main-container py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <div className="text-center mb-5 fade-in">
            <h1 className="display-5 fw-bold text-primary-custom mb-3">
              📋 Medical Questionnaire
            </h1>
            <p className="lead text-muted">
              Please provide details about your skin condition for accurate analysis
            </p>
          </div>

          <div className="card shadow-lg border-0 content-card slide-up">
            <div className="card-body p-5">
              <Row>
                <Col md={4} className="text-center mb-4">
                  <h6 className="fw-semibold text-primary-custom mb-3">Cropped Image</h6>
                  <Image
                    src={croppedImage}
                    alt="Cropped skin condition"
                    width={200}
                    height={200}
                    className="img-fluid rounded-3 shadow-sm"
                    unoptimized
                  />
                </Col>
                
                <Col md={8}>
                  <Form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <Form.Label className="fw-semibold text-primary-custom mb-3">
                        Where is the lesion located on your body?
                      </Form.Label>
                      <Row className="g-2">
                        {LOCATIONS_A.map((answer) => (
                          <Col sm={4} key={answer}>
                            <Form.Check 
                              label={answer}
                              name="location"
                              type="radio"
                              id={`location-${answer}`}
                              onChange={() => setLocation(answer)}
                              checked={location === answer}
                            />
                          </Col>
                        ))}
                      </Row>
                    </div>

                    <div className="mb-4">
                      <Form.Label className="fw-semibold text-primary-custom mb-3">
                        How big is the lesion?
                      </Form.Label>
                      <Row className="g-2">
                        {SIZES_A.map((answer) => (
                          <Col sm={4} key={answer}>
                            <Form.Check 
                              label={answer}
                              name="size"
                              type="radio"
                              id={`size-${answer}`}
                              onChange={() => setSize(answer)}
                              checked={size === answer}
                            />
                          </Col>
                        ))}
                      </Row>
                    </div>

                    <div className="mb-4">
                      <Form.Label className="fw-semibold text-primary-custom mb-3">
                        How long have you had this lesion?
                      </Form.Label>
                      <Row className="g-2">
                        {DURATIONS_A.map((answer) => (
                          <Col sm={4} key={answer}>
                            <Form.Check 
                              label={answer}
                              name="duration"
                              type="radio"
                              id={`duration-${answer}`}
                              onChange={() => setDuration(answer)}
                              checked={duration === answer}
                            />
                          </Col>
                        ))}
                      </Row>
                    </div>

                    <div className="mb-4">
                      <Form.Label className="fw-semibold text-primary-custom mb-3">
                        Are you experiencing any of the following symptoms?
                      </Form.Label>
                      <Row className="g-2">
                        {SYMPTOMS_A.map((answer, index) => (
                          <Col sm={3} key={answer}>
                            <Form.Check 
                              label={answer}
                              name="symptoms"
                              type="checkbox"
                              id={`symptoms-${answer}`}
                              checked={symptoms[index]}
                              onChange={() => handleSymptomsChange(index)}
                            />
                          </Col>
                        ))}
                      </Row>
                    </div>

                    <div className="mb-4">
                      <Form.Label className="fw-semibold text-primary-custom mb-3">
                        Anything else you&apos;d like to share?
                      </Form.Label>
                      <Form.Control 
                        as="textarea"
                        rows={4}
                        placeholder="Additional information about your condition, symptoms, or concerns..."
                        value={additional}
                        onChange={(e) => setAdditional(e.target.value)}
                      />
                    </div>

                    <div className="d-flex justify-content-end">
                      <Button variant="primary" type="submit" size="lg" className="px-5">
                        📊 Generate Report
                      </Button>
                    </div>
                  </Form>
                </Col>
              </Row>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Questionnaire;