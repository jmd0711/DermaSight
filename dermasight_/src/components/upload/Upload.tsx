'use client';

import { useState, useCallback } from 'react';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { UploadedImage } from '@/types';
import ImageCrop from './ImageCrop';
import Questionnaire from './Questionnaire';

const Upload = () => {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = () => {
      const uploadedImageData: UploadedImage = {
        file,
        url: reader.result as string,
        name: file.name,
        size: file.size,
        type: file.type,
      };
      setUploadedImage(uploadedImageData);
      setIsUploading(false);
    };
    reader.onerror = () => {
      setUploadError('Error reading file. Please try again.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.bmp']
    },
    multiple: false,
    disabled: isUploading
  });

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setCroppedImage(null);
    setShowQuestionnaire(false);
    setUploadError(null);
  };

  const handleAnalyze = () => {
    setShowQuestionnaire(true);
  };

  // Show questionnaire if user clicked "Continue to Questionnaire"
  if (showQuestionnaire && croppedImage) {
    return <Questionnaire croppedImage={croppedImage} setData={() => {}} />;
  }

  return (
    <Container fluid className="main-container py-5">
      <Row className="justify-content-center">
        <Col lg={8} xl={6}>
          <div className="text-center mb-5 fade-in">
            <h1 className="display-5 fw-bold text-primary-custom mb-3">
              📸 Upload Image
            </h1>
            <p className="lead text-muted">
              Upload a clear photo of your skin condition for AI-powered analysis
            </p>
          </div>

          <div className="card shadow-lg border-0 content-card slide-up">
            <div className="card-body p-5">
              {uploadError && (
                <Alert variant="danger" dismissible onClose={() => setUploadError(null)}>
                  {uploadError}
                </Alert>
              )}

              {!uploadedImage ? (
                <div
                  {...getRootProps()}
                  className={`upload-dropzone text-center p-5 cursor-pointer ${
                    isDragActive ? 'active' : ''
                  }`}
                  style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}
                >
                  <input {...getInputProps()} />
                  <div className="mb-4">
                    {isUploading ? (
                      <div className="spinner-border text-primary-custom" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="1.5"
                        className="mb-3"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17,8 12,3 7,8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    )}
                  </div>
                  
                  {isUploading ? (
                    <p className="h5 text-muted">Processing image...</p>
                  ) : isDragActive ? (
                    <div>
                      <h5 className="text-primary-custom fw-semibold">Drop your image here</h5>
                      <p className="text-muted">Release to upload</p>
                    </div>
                  ) : (
                    <div>
                      <h5 className="text-primary-custom fw-semibold mb-3">
                        Drag & drop your image here
                      </h5>
                      <p className="text-muted mb-3">or</p>
                      <Button variant="outline-primary" size="lg">
                        Browse Files
                      </Button>
                      <div className="mt-4">
                        <small className="text-muted">
                          Supported formats: JPG, PNG, WebP • Max size: 10MB
                        </small>
                      </div>
                    </div>
                  )}
                </div>
              ) : !croppedImage ? (
                <ImageCrop
                  imageURL={uploadedImage.url}
                  setImageURL={(url) => {
                    if (!url) {
                      setUploadedImage(null);
                    }
                  }}
                  setCroppedImage={setCroppedImage}
                />
              ) : (
                <div className="text-center fade-in">
                  <div className="position-relative d-inline-block mb-4">
                    <Image
                      src={croppedImage}
                      alt="Cropped skin condition"
                      className="img-fluid rounded-3 shadow-sm"
                      style={{ maxHeight: '400px', maxWidth: '100%' }}
                      width={400}
                      height={400}
                      unoptimized
                    />
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="fw-semibold text-primary-custom mb-2">
                      Cropped Image Ready for Analysis
                    </h5>
                    <p className="text-muted">
                      Image has been cropped and is ready for medical questionnaire
                    </p>
                  </div>
                  
                  <div className="d-flex gap-3 justify-content-center">
                    <Button
                      variant="outline-secondary"
                      onClick={handleRemoveImage}
                      className="px-4"
                    >
                      Start Over
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleAnalyze}
                      size="lg"
                      className="px-5"
                    >
                      📝 Continue to Questionnaire
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tips Card */}
          <div className="card mt-4 border-0 shadow-sm">
            <div className="card-body p-4">
              <h6 className="fw-semibold text-primary-custom mb-3">📋 Tips for Best Results</h6>
              <Row className="g-3">
                <Col md={6}>
                  <div className="d-flex align-items-start">
                    <span className="badge bg-primary-custom me-2 mt-1">1</span>
                    <small className="text-muted">
                      Ensure good lighting and focus on the affected area
                    </small>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-start">
                    <span className="badge bg-primary-custom me-2 mt-1">2</span>
                    <small className="text-muted">
                      Take the photo from a comfortable distance
                    </small>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-start">
                    <span className="badge bg-primary-custom me-2 mt-1">3</span>
                    <small className="text-muted">
                      Avoid blurry or heavily filtered images
                    </small>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-start">
                    <span className="badge bg-primary-custom me-2 mt-1">4</span>
                    <small className="text-muted">
                      Include surrounding healthy skin for context
                    </small>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Upload;