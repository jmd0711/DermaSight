'use client';

import { useState, useCallback } from 'react';
import { AuthToken, UseTokenReturn } from '@/types';

const useToken = (): UseTokenReturn => {
  const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    
    const tokenString = localStorage.getItem('token');
    if (!tokenString) return null;
    
    try {
      const userToken = JSON.parse(tokenString);
      return userToken?.token || null;
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  };

  const [token, setToken] = useState<string | null>(getToken);

  const saveToken = useCallback((userToken: AuthToken) => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('token', JSON.stringify(userToken));
    setToken(userToken.token);
  }, []);

  const removeToken = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('token');
    setToken(null);
  }, []);

  const isAuthenticated = Boolean(token);

  return {
    token,
    setToken: saveToken,
    removeToken,
    isAuthenticated,
  };
};

export default useToken;