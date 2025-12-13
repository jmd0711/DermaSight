'use client';

import { useState } from 'react';
import { Button } from 'react-bootstrap';
import Cropper, { type Area } from 'react-easy-crop';
import getCroppedImg from './cropImage';

interface ImageCropProps {
  imageURL: string;
  setImageURL: (url: string | null) => void;
  setCroppedImage: (image: string) => void;
}

const ImageCrop = ({ setImageURL, imageURL, setCroppedImage }: ImageCropProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = (_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const onDelete = () => {
    setImageURL(null);
  };

  const onConfirm = async () => {
    try {
      if (!croppedAreaPixels) return;
      const croppedImage = await getCroppedImg(imageURL, croppedAreaPixels);
      if (croppedImage) {
        setCroppedImage(croppedImage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fade-in">
      <div className="position-relative mb-4" style={{ height: '400px' }}>
        <Cropper
          image={imageURL}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          style={{
            containerStyle: {
              borderRadius: '20px',
              overflow: 'hidden',
            },
          }}
        />
      </div>
      
      <div className="d-flex justify-content-end gap-3">
        <Button 
          variant="outline-danger" 
          onClick={onDelete}
          className="px-4"
        >
          Delete
        </Button>
        <Button 
          variant="primary" 
          onClick={onConfirm}
          className="px-4"
        >
          Confirm Crop
        </Button>
      </div>
    </div>
  );
};

export default ImageCrop;