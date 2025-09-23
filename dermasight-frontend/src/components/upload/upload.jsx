import '../components.css'
import './upload.css'

import { useCallback, useState } from 'react'
import { Container } from 'react-bootstrap'
import { useDropzone } from 'react-dropzone'
import ImageCrop from './imagecrop'
import Questionnaire from './questionnaire'

const Upload = () => {
  const [imageURL, setImageURL] = useState(null)
  const [croppedImage, setCroppedImage] = useState(null)
  const [data, setData] = useState(null)

  const onDrop = useCallback(acceptedFiles => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = () => setImageURL(reader.result)
      reader.readAsDataURL(file)
    })
  }, [])

  const {
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({ onDrop })

  const renderContent = () => {
    if (!imageURL) {
      return (
        <div className="image-container">
          <div className="drop-zone" {...getRootProps()}>
            <input {...getInputProps()} />
            {isDragActive
              ? <p>Drop your image here...</p>
              : <p>Drag & drop image or click to browse</p>}
          </div>
        </div>
      )
    } else if (!croppedImage) {
      return (
        <ImageCrop
          imageURL={imageURL}
          setImageURL={setImageURL}
          setCroppedImage={setCroppedImage}
        />
      )
    } else {
      return <Questionnaire croppedImage={croppedImage} setData={setData} />
    }
  }

  return (
    <Container fluid className='main-page'>
      <div className='main-body'>
        <h3 className="title text-dark mb-3">Upload Image</h3>
        <div className='upload-content'>
          {renderContent()}
        </div>
      </div>
    </Container>
  )
}

export default Upload
