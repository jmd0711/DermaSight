// User Authentication Types
export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt?: Date;
}

export interface AuthToken {
  token: string;
  user?: User;
  expiresAt?: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  email: string;
  confirmPassword: string;
}

// Image Upload and Processing Types
export interface UploadedImage {
  file: File;
  url: string;
  name: string;
  size: number;
  type: string;
}

export interface CroppedImageData {
  croppedImageUrl: string;
  croppedAreaPixels: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  originalImage: UploadedImage;
}

export interface Point {
  x: number;
  y: number;
}

export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Medical/Dermatology Types
// export interface Symptom {
//   id: string;
//   name: string;
//   description?: string;
//   severity?: 'mild' | 'moderate' | 'severe';
// }

export interface QuestionnaireData {
  symptoms: string[];
  duration: string;
  location: string;
  size: string;
  additionalInfo?: string;
  // painLevel?: number; // 1-10 scale
  // itchiness?: number; // 1-10 scale
}

export interface AnalysisResult {
  // id: string;
  confidence: number;
  possibleConditions: string[];
  recommendations: string[];
  // severityLevel: 'low' | 'medium' | 'high';
  // requiresUrgentCare: boolean;
  // generatedAt: Date;
}

export interface MedicalReport {
  id: string;
//  userId: string;
  imageUrl: string;
  questionnaireData: QuestionnaireData;
  analysisResult: AnalysisResult;
  createdAt: Date;
}

// Chatbot Types
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  messageType?: 'text' | 'image' | 'analysis';
}

export interface ChatConversation {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastActivity: Date;
  topic?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Component Props Types
export interface AuthComponentProps {
  setToken: (token: AuthToken) => void;
  token?: string;
}

export interface ImageUploadProps {
  onImageSelect: (image: UploadedImage) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
}

export interface ImageCropProps {
  imageURL: string;
  setImageURL: (url: string | null) => void;
  setCroppedImage: (image: CroppedImageData) => void;
}

export interface QuestionnaireProps {
  croppedImage: CroppedImageData;
  setData: (data: QuestionnaireData) => void;
  onSubmit?: (data: QuestionnaireData) => void;
}

export interface ReportProps {
  report: MedicalReport;
  onDownload?: () => void;
  onShare?: () => void;
}

// Navigation and Routing Types
export type RouteParams = {
  id?: string;
  reportId?: string;
  conversationId?: string;
};

// Form Types
export interface FormErrors {
  [key: string]: string;
}

export interface FormState<T> {
  data: T;
  errors: FormErrors;
  isSubmitting: boolean;
  isValid: boolean;
}

// Hook Types
export interface UseTokenReturn {
  token: string | null;
  setToken: (token: AuthToken) => void;
  removeToken: () => void;
  isAuthenticated: boolean;
}

// Environment/Config Types
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  headers: Record<string, string>;
}