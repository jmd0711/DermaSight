'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useApi';
import useToken from '@/hooks/useToken';

interface SignupFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: number;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  age?: string;
}

const Signup = () => {
  const [formData, setFormData] = useState<SignupFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: 18,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const { signup, isLoading, error, clearError } = useAuth();
  const { setToken } = useToken();
  const router = useRouter();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Age validation
    if (!formData.age || formData.age < 13) {
      newErrors.age = 'You must be at least 13 years old';
    } else if (formData.age > 120) {
      newErrors.age = 'Please enter a valid age';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof SignupFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'age' ? parseInt(e.target.value) || 0 : e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    const signupData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      age: formData.age,
    };

    const response = await signup(signupData);

    if (response.success && response.data) {
      // Auto-login after successful signup
      const authToken = {
        token: response.data.userId,
        user: {
          id: response.data.userId,
          username: formData.username,
          email: formData.email,
        },
      };
      
      setToken(authToken);
      router.push('/profile');
      router.refresh();
    }
  };

  return (
    <div className="main-container min-h-screen flex items-center justify-center py-8">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-custom mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">
            Join DermaSight for AI-powered skin analysis
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={handleInputChange('username')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-custom focus:border-transparent transition-colors ${
                errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Choose a username"
              disabled={isLoading}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-custom focus:border-transparent transition-colors ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Age */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
              Age
            </label>
            <input
              type="number"
              id="age"
              value={formData.age || ''}
              onChange={handleInputChange('age')}
              min="13"
              max="120"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-custom focus:border-transparent transition-colors ${
                errors.age ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Your age"
              disabled={isLoading}
            />
            {errors.age && (
              <p className="mt-1 text-sm text-red-600">{errors.age}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-custom focus:border-transparent transition-colors ${
                errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Create a password"
              disabled={isLoading}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-custom focus:border-transparent transition-colors ${
                errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Confirm your password"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-4 bg-primary-custom hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-primary-custom hover:text-opacity-80 font-medium"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;