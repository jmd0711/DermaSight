import '../components.css'
import './upload.css'

import { useCallback, useState, useRef } from 'react'
import { Button, Container, Form, FloatingLabel } from 'react-bootstrap'
import { useDropzone } from 'react-dropzone'
import ImageCrop from './imagecrop'
import Questionnaire from './questionnaire'


const Upload = () => {


  const [imageURL, setImageURL] = useState(null)
  const [croppedImage, setCroppedImage] = useState(null)
  const [data, setData] = useState(null)

  

  const ImageUpload = () => {
    const onDrop = useCallback(acceptedFiles => {
      acceptedFiles.forEach(file => {
        const reader = new FileReader()
        reader.onabort = () => console.log("file reading aborted")
        reader.lonerror = () => console.log("file reading failed")
        reader.onload = () => {
          const binaryStr = reader.result
          setImageURL(binaryStr)
        }
        reader.readAsDataURL(file)
      })
    }, [])

    const {
      getRootProps,
      acceptedFiles,
      getInputProps,
      isDragActive,
    } = useDropzone({ onDrop })

    return (
      <div className='image-container'>
        <div className="drop-zone" {...getRootProps()}> 
              <input {...getInputProps()} />
              {isDragActive ? (
                <div className="drop-files">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    height="50"
                    width="50"
                    fill="currentColor"
                  >
                    <path d="M1 14.5C1 12.1716 2.22429 10.1291 4.06426 8.9812C4.56469 5.044 7.92686 2 12 2C16.0731 2 19.4353 5.044 19.9357 8.9812C21.7757 10.1291 23 12.1716 23 14.5C23 17.9216 20.3562 20.7257 17 20.9811L7 21C3.64378 20.7257 1 17.9216 1 14.5ZM16.8483 18.9868C19.1817 18.8093 21 16.8561 21 14.5C21 12.927 20.1884 11.4962 18.8771 10.6781L18.0714 10.1754L17.9517 9.23338C17.5735 6.25803 15.0288 4 12 4C8.97116 4 6.42647 6.25803 6.0483 9.23338L5.92856 10.1754L5.12288 10.6781C3.81156 11.4962 3 12.927 3 14.5C3 16.8561 4.81833 18.8093 7.1517 18.9868L7.325 19H16.675L16.8483 18.9868ZM13 13V17H11V13H8L12 8L16 13H13Z"></path>
                  </svg>
                </div>
              ) : (
                
                <div className="drag-files">
                  Drop your files here or click to browse
                </div>
              )}
        </div>
      </div>
    )
  }



  const renderContent = () => {
    if (!imageURL) { return <ImageUpload /> }
    else if (!croppedImage) {return <ImageCrop setImageURL={setImageURL} imageURL={imageURL} setCroppedImage={setCroppedImage} />}
    else { return <Questionnaire croppedImage={croppedImage} setData={setData}/> }
  }
  return (
    <Container fluid className='main-page'>
      <div className='main-body'>
        <h3 className="title text-dark mb-3">Upload Image</h3>
        <div className='upload-content'>
          {renderContent()}
          {/* {imageURL ? (<ImageCrop />) : (<ImageUpload />)} */}
        </div>
      </div>
    </Container>

  )
}

export default Upload;