import { useState } from 'react'
import { Button } from 'react-bootstrap'
import Cropper from 'react-easy-crop'
import getCroppedImg from './cropImage'

const ImageCrop = ({ setImageURL, imageURL, setCroppedImage }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropComplete = (_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const onDelete = () => {
    setImageURL(null)
    setCroppedImage(null)
  }

  const onConfirm = async () => {
    try {
      const blob = await getCroppedImg(imageURL, croppedAreaPixels)
      // convert blob to File for FormData
      const file = new File([blob], 'lesion.jpg', { type: 'image/jpeg' })
      setCroppedImage(file)  // store the File object instead of URL
    } catch (err) {
      console.error(err)
      alert("Failed to crop image")
    }
  }

  return (
    <div>
      <div className='image-container'>
        <div className="crop-container">
          <Cropper
            image={imageURL}
            crop={crop}
            zoom={zoom}
            aspect={1 / 1}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
      </div>
      <div className='upload-buttons'>
        <Button variant='danger' onClick={onDelete} style={{marginRight: 10}}>Delete</Button>
        <Button variant='primary' onClick={onConfirm}>Confirm</Button>
      </div>
    </div>
  )
}

export default ImageCrop
