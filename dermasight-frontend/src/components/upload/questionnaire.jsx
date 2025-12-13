import { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

const dataURLtoFile = (dataurl, filename) => {
  if (!dataurl) return null
  const arr = dataurl.split(',')
  if (arr.length < 2) return null
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

const Questionnaire = ({ croppedImage, setData }) => {
  const LOCATIONS_A = ["Face", "Back", "Leg", "Arm", "Chest", "Other"]
  const SIZES_A = ["<3mm", "3–5mm", "6–10mm", "1–2cm", ">2cm", "Not sure"]
  const DURATIONS_A = ["couple days", "couple weeks", "1 month", "2-3 month", "1 year or more", "Not sure"]
  const SYMPTOMS_A = ["Itching", "Pain", "Bleeding", "Peeling"]

  const [location, setLocation] = useState("Face")
  const [size, setSize] = useState("<3mm")
  const [duration, setDuration] = useState("couple days")
  const [symptoms, setSymptoms] = useState(new Array(SYMPTOMS_A.length).fill(false))
  const [additional, setAdditional] = useState("")
  const navigate = useNavigate()

  const handleSymptomsChange = (position) => {
    const updatedSymptoms = symptoms.map((item, index) =>
      index === position ? !item : item
    )
    setSymptoms(updatedSymptoms)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!croppedImage) {
      alert("Please crop your image before submitting")
      return
    }

    const selectedSymptoms = symptoms.reduce((acc, checked, idx) => {
      if (checked) acc.push(SYMPTOMS_A[idx])
      return acc
    }, [])

    const data = {
      image: croppedImage,
      location,
      size,
      duration,
      symptoms: selectedSymptoms,
      additional
    }

    setData(data)

    // Convert base64 to File
    const file = dataURLtoFile(croppedImage, "lesion.png")
    if (!file) {
      alert("Invalid image data")
      return
    }

    const formData = new FormData()
    formData.append("image", file)
    formData.append("location", location)
    formData.append("size", size)
    formData.append("duration", duration)
    selectedSymptoms.forEach(s => formData.append("symptoms", s))
    formData.append("additional", additional)

    fetch("http://localhost:5002/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: formData
    })
      .then(res => res.json())
      .then(res => {
        console.log(res)
        if (res.error) alert(res.error)
        else navigate("/report", { state: res.report })
      })
      .catch(err => console.error(err))
  }

  return (
    <div className='questionnaire-container'>
      <img src={croppedImage} alt="Lesion" />
      <Form onSubmit={handleSubmit}>
        <label>Where is the lesion located on your body?</label>
        <div>
          {LOCATIONS_A.map(answer => (
            <Form.Check
              inline
              label={answer}
              name="location"
              type="radio"
              key={answer}
              onChange={() => setLocation(answer)}
              checked={location === answer}
            />
          ))}
        </div>
        <label>How big is the lesion?</label>
        <div>
          {SIZES_A.map(answer => (
            <Form.Check
              inline
              label={answer}
              name="size"
              type="radio"
              key={answer}
              onChange={() => setSize(answer)}
              checked={size === answer}
            />
          ))}
        </div>
        <label>How long have you had this lesion?</label>
        <div>
          {DURATIONS_A.map(answer => (
            <Form.Check
              inline
              label={answer}
              name="duration"
              type="radio"
              key={answer}
              onChange={() => setDuration(answer)}
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
              key={answer}
              checked={symptoms[index]}
              onChange={() => handleSymptomsChange(index)}
            />
          ))}
        </div>
        <label>Anything else you'd like to share?</label>
        <Form.Control
          as="textarea"
          placeholder="Additional Information"
          value={additional}
          onChange={e => setAdditional(e.target.value)}
        />
        <Button variant="primary" type="submit" disabled={!croppedImage}>
          Submit
        </Button>
      </Form>
    </div>
  )
}

export default Questionnaire
