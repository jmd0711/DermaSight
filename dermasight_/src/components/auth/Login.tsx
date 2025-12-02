'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Container, Form, FloatingLabel, Alert } from 'react-bootstrap';
import { AuthComponentProps, LoginCredentials } from '@/types';
import { useAuth } from '@/hooks/useApi';

const Login = ({ setToken }: AuthComponentProps) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();

  const handleInputChange = (field: keyof LoginCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    const response = await login(credentials);

    if (response.success && response.data) {
      const authToken = {
        token: response.data.userId,
        user: {
          id: response.data.userId,
          username: response.data.username,
          access: response.data.access,
          refresh: response.data.refresh,
        },
      };
      
      setToken(authToken);
      router.push('/profile');
      router.refresh();
      window.location.href = ('/profile')
    }
  };

  return (
    <Container fluid className="main-container flex items-center justify-center py-5">
      <div className="w-full max-w-md content-card slide-up">
        <h3 className="text-3xl font-bold text-primary-custom mb-6 text-center">
          Welcome Back
        </h3>
        <p className="text-center text-muted mb-4">
          Sign in to your DermaSight account
        </p>
        {error && (
          <Alert variant="danger" dismissible onClose={clearError}>
            {error}
          </Alert>
        )}
        <Form onSubmit={handleSubmit}>
          <FloatingLabel
            controlId="username"
            label="Username"
            className="mb-4"
          >
            <Form.Control
              type="text"
              name="username"
              placeholder="Enter username"
              value={credentials.username}
              onChange={handleInputChange('username')}
              required
              disabled={isLoading}
            />
          </FloatingLabel>
          
          <FloatingLabel
            controlId="password"
            label="Password"
            className="mb-6"
          >
            <Form.Control
              type="password"
              name="password"
              placeholder="Enter password"
              value={credentials.password}
              onChange={handleInputChange('password')}
              required
              disabled={isLoading}
            />
          </FloatingLabel>
          
          <div className="flex justify-end">
            <Button 
              variant="primary" 
              type="submit" 
              size="lg"
              disabled={isLoading || !credentials.username || !credentials.password}
              className="w-100 py-3 fw-semibold"
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </div>
        </Form>
      </div>
    </Container>
  );
};

export default Login;