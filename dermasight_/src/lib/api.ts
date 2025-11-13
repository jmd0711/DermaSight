import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  LoginCredentials, 
  SignupData, 
  User,
  MedicalReport,
  ChatMessage 
} from '@/types';

// API Configuration
const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000',
  CHATBOT_URL: process.env.NEXT_PUBLIC_CHATBOT_URL || 'http://localhost:8080',
  TIMEOUT: 10000,
};

class ApiClient {
  private client: AxiosInstance;
  private chatbotClient: AxiosInstance;

  constructor() {
    // Main API client for user management and uploads
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Separate client for chatbot
    this.chatbotClient = axios.create({
      // baseURL: API_CONFIG.CHATBOT_URL,
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    this.setupInterceptors();
  }

  private async refreshAccessToken(): Promise<string | null> {
  try {
    const tokenString = localStorage.getItem('token');
    if (!tokenString) return null;

    const tokenData = JSON.parse(tokenString);
    const refreshToken = tokenData.refresh;
    if (!refreshToken) return null;

    const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, null, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    });

    const newAccess = response.data.access;
    tokenData.access = newAccess;
    localStorage.setItem('token', JSON.stringify(tokenData));
    return newAccess;
  } catch (error) {
    console.error('Failed to refresh token', error);
    this.removeTokenFromStorage();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }
}

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getTokenFromStorage();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const newAccessToken = await this.refreshAccessToken();
          if (newAccessToken) {
            originalRequest.headers['Authorization'] = 'Bearer ${newAccessToken}';
            return this.client(originalRequest)
          }
          this.removeTokenFromStorage();
          // Redirect to login if needed
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getTokenFromStorage(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const tokenString = localStorage.getItem('token');
      if (!tokenString) return null;
      
      const tokenData = JSON.parse(tokenString);
      return tokenData.user?.access || null;
    } catch {
      return null;
    }
  }

  private removeTokenFromStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  // Authentication APIs
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ userId: string; username: string; access: string; refresh: string }>> {
    try {
      const response: AxiosResponse<{ message: string; userId: string; username: string; access: string; refresh: string }> = 
        await this.client.post('/login', credentials);
      
      return {
        success: true,
        data: {
          userId: response.data.userId,
          username: response.data.username,
          access: response.data.access,
          refresh: response.data.refresh
        },
        message: response.data.message,
        statusCode: response.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
        statusCode: error.response?.status || 500,
      };
    }
  }

  async signup(userData: SignupData & { age: number }): Promise<ApiResponse<{ userId: string }>> {
    try {
      const response: AxiosResponse<{ userId: string }> = 
        await this.client.post('/signup', userData);
      
      return {
        success: true,
        data: { userId: response.data.userId },
        message: 'User created successfully',
        statusCode: response.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Signup failed',
        statusCode: error.response?.status || 500,
      };
    }
  }

  // Image Upload API
  async uploadImage(
    imageFile: File,
    formDataPayload: {
      location: string;
      size: string;
      duration: string;
      symptoms: string[];
      additional?: string;
    }
  ): Promise<ApiResponse<{ report: MedicalReport; }>> {
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("location", formDataPayload.location);
      formData.append("size", formDataPayload.size);
      formData.append("duration", formDataPayload.duration);
      formDataPayload.symptoms.forEach((s) => formData.append("symptoms", s));
      if (formDataPayload.additional) {
        formData.append("additional", formDataPayload.additional);
      }

      const response: AxiosResponse<{ message: string; 
        report_id: string;
        imageUrl: string;
        dateGenerated: any;
        location: string;
        size: string;
        duration: string;
        symptoms: string[];
        additional?: string;
        skinCondition: string;
        confidence: string;
        treatment: string;
       }> = 
        await this.client.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

      return {
        success: true,
        data: {
          //imageUrl: response.imageUrl,
          report: {
            id: response.data.report_id,
            //userId: userId,
            imageUrl: response.data.imageUrl,
            questionnaireData: {
              symptoms: response.data.symptoms,
              size: response.data.size,
              duration: response.data.duration,
              location: response.data.location,
              additionalInfo: response.data.additional,
            },
            analysisResult: {
              // id: 'N/A',
              confidence: Number(response.data.confidence) || 0,
              possibleConditions: response.data.skinCondition ? [response.data.skinCondition.replace(/^"|"$/g, '')] : [],
              recommendations: response.data.treatment ? [response.data.treatment] : [],
              //generatedAt: new Date(response.data.dateGenerated?.$date || new Date().toISOString())
            },
            createdAt: new Date(response.data.dateGenerated?.$date || new Date().toISOString()),
          }
        },
        message: response.data.message,
        statusCode: response.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Upload failed',
        statusCode: error.response?.status || 500,
      };
    }
  }

  // // User API
async getUserReports(): Promise<ApiResponse<{ reports: MedicalReport[] }>> {
  try {
    const response: AxiosResponse<{ reports: any[] }> = 
      await this.client.get('/user/reports');
    const tokenData = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('token') || '{}')
      : {};

    const userId = tokenData.user.id || null;
    const normalizedReports: MedicalReport[] = response.data.reports.map((report) => ({
      id: report.report_id,
      userId: userId,
      imageUrl: report.imageUrl,
      questionnaireData: {
        symptoms: report.symptoms,
        size: report.size,
        duration: report.duration,
        location: report.location,
        additionalInfo: report.additional,
      },
      analysisResult: {
        id: 'N/A',
        confidence: report.confidence || 0,
        possibleConditions: report.skinCondition ? [report.skinCondition.replace(/^"|"$/g, '')] : [],
        recommendations: report.treatment ? [report.treatment] : [],
        generatedAt: new Date(report.dateGenerated?.$date || new Date().toISOString())
      },
      createdAt: new Date(report.dateGenerated?.$date || new Date().toISOString()),
    }));
    //console.log(normalizedReports)
    localStorage.setItem('reports', JSON.stringify(normalizedReports));
    return {
      success: true,
      data: { reports: normalizedReports },
      message: 'Reports fetched successfully',
      statusCode: response.status,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch reports',
      statusCode: error.response?.status || 500,
    };
  }
}

async deleteUserReport(reportId: string): Promise<ApiResponse<null>> {
  try {
    const res = await this.client.delete(`/user/reports/${reportId}`);
    return {
      success: true,
      data: null,
      message: res.data.message || 'Report deleted successfully',
      statusCode: res.status,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete report',
      statusCode: error.response?.status || 500,
    };
  }
}

  // Chatbot API
  async sendChatMessage(message: string): Promise<ApiResponse<{ response: string }>> {
    try {
      // const formData = new URLSearchParams();
      // formData.append('msg', message);
      const formData = { "msg": message }

      const response: AxiosResponse<string> = 
        await this.client.post('/ask', formData);

      return {
        success: true,
        data: { response: response.data },
        statusCode: response.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Chat request failed',
        statusCode: error.response?.status || 500,
      };
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/');
      return true;
    } catch {
      return false;
    }
  }

  async chatbotHealthCheck(): Promise<boolean> {
    try {
      await this.chatbotClient.get('/');
      return true;
    } catch {
      return false;
    }
  }
}

// Create a singleton instance
const apiClient = new ApiClient();

// Named exports for specific API calls
export const authApi = {
  login: apiClient.login.bind(apiClient),
  signup: apiClient.signup.bind(apiClient),
};

export const uploadApi = {
  uploadImage: apiClient.uploadImage.bind(apiClient),
};

export const userApi = {
  getReports: apiClient.getUserReports.bind(apiClient),
  deleteReport: apiClient.deleteUserReport.bind(apiClient),
};

export const chatApi = {
  sendMessage: apiClient.sendChatMessage.bind(apiClient),
  healthCheck: apiClient.chatbotHealthCheck.bind(apiClient),
};

export const healthApi = {
  check: apiClient.healthCheck.bind(apiClient),
};

export default apiClient;