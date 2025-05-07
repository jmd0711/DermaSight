import { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'



const Questionnaire = ({croppedImage, setData}) => {
  const LOCATIONS_A = ["Face", "Back", "Leg", "Arm", "Chest", "Other"]
  const SIZES_A = ["<3mm", "3–5mm", "6–10mm", "1–2cm", ">2cm", "Not sure"]
  const DURATIONS_A = ["couple days", "couple weeks", "1 month", "2-3 month",  "1 year or more", "Not sure"]
  const SYMPTOMS_A = ["Itching", "Pain", "Bleeding", "Peeling"]

  const [location, setLocation] = useState("Face")
  const [size, setSize] = useState("<3mm")
  const [duration, setDuration] = useState("couple days")
  const [symptoms, setSymptoms] = useState(
    new Array(SYMPTOMS_A.length).fill(false)
  )
  const [additional, setAdditional] = useState("a")
  const navigate=useNavigate()


  const handleSymptomsChange = (position) => {
    const updatedSymptoms = symptoms.map((item, index) => 
      index === position ? !item : item
    )
    setSymptoms(updatedSymptoms)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const dataSymptoms = []
    symptoms.map((item, index) => {
      if (item) {
        dataSymptoms.push(SYMPTOMS_A[index])
      }
  })
    const data = {
      image: croppedImage,
      location: location,
      size: size,
      duration: duration,
      symptoms: dataSymptoms,
      additional: additional,
    }
    setData(data)
    console.log(data)
    navigate("/report", {state: data})
  }

  return (
    <div className='questionnaire-container'>
      <img src={croppedImage}></img>
      <Form onSubmit={handleSubmit}>
        <label>Where is the lesion located on your body?</label>
        <div>
          {LOCATIONS_A.map((answer) => (
            <Form.Check 
              inline
              label={answer}
              name="location"
              type="radio"
              id={`location-${answer}`}
              onChange={e => setLocation(answer)}
              checked={location === answer}
            />
          ))}
        </div>
        <label>How big is the lesion?</label>
        <div>
          {SIZES_A.map((answer) => (
            <Form.Check 
              inline
              label={answer}
              name="size"
              type="radio"
              id={`size-${answer}`}
              onChange={e => setSize(answer)}
              checked={size === answer}
            />
          ))}
        </div>
        <label>How long have you had this lesion?</label>
        <div>
          {DURATIONS_A.map((answer) => (
            <Form.Check 
              inline
              label={answer}
              name="duration"
              type="radio"
              id={`duration-${answer}`}
              onChange={e => setDuration(answer)}
              checked={duration === answer}
            />
          ))}
        </div>
        <label>Are you experiencing any of the following symptoms?</label>
        <div>
          {SYMPTOMS_A.map((answer, index) => (
            <Form.Check 
              inline
              label={answer}
              name="symptoms"
              type="checkbox"
              id={`symptoms-${answer}`}
              checked={symptoms[index]}
              onChange={() => handleSymptomsChange(index)}
            />
          ))}
        </div>
        <label>Anything else you'd like to share?</label>
        <Form.Control 
          type="textarea"
          name="additional"
          placeholder="Additional Information"
          value={additional}
          onChange={e => setAdditional(e.target.value)}
        />
        <Button variant="primary" type="submit">
          Submit
        </Button>
      </Form>
    </div>
  )
}

export default Questionnaire;