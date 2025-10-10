'use client';

import { useState, useCallback, useEffect } from 'react';
import { authApi, chatApi, uploadApi, default as apiClient } from '@/lib/api';
import { LoginCredentials, SignupData, ApiResponse, MedicalReport } from '@/types';

// Authentication hook
export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authApi.login(credentials);
      if (!response.success) {
        setError(response.error || 'Login failed');
      }
      return response;
    } catch (err) {
      setError('Network error occurred');
      return { success: false, error: 'Network error', statusCode: 500 };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (userData: SignupData & { age: number }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authApi.signup(userData);
      if (!response.success) {
        setError(response.error || 'Signup failed');
      }
      return response;
    } catch (err) {
      setError('Network error occurred');
      return { success: false, error: 'Network error', statusCode: 500 };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { login, signup, isLoading, error, clearError: () => setError(null) };
};

// Chat hook
export const useChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await chatApi.sendMessage(message);
      if (!response.success) {
        setError(response.error || 'Chat failed');
      }
      return response;
    } catch (err) {
      setError('Network error occurred');
      return { success: false, error: 'Network error', statusCode: 500 };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { sendMessage, isLoading, error, clearError: () => setError(null) };
};

// Upload hook
export const useUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadImage = useCallback(async (
    file: File,
    userId: string,
    skinCondition?: string,
    recommendations?: string
  ) => {
    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await uploadApi.uploadImage(file, userId, skinCondition, recommendations);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (!response.success) {
        setError(response.error || 'Upload failed');
      }
      
      return response;
    } catch (err) {
      setError('Network error occurred');
      return { success: false, error: 'Network error', statusCode: 500 };
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgress(0), 1000); // Reset progress after delay
    }
  }, []);

  return { 
    uploadImage, 
    isLoading, 
    error, 
    progress,
    clearError: () => setError(null) 
  };
};

// User Hook
export const useUserReports = () => {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response: ApiResponse<{ reports: MedicalReport[] }> = 
        await apiClient.getUserReports();

      if (response.success && response.data?.reports) {
        setReports(response.data.reports);
      } else {
        setError(response.error || 'Failed to fetch reports');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    isLoading,
    error,
    refetch: fetchReports,
    clearError: () => setError(null),
  };
};