'use client';

import Login from './Login';
import useToken from '@/hooks/useToken';

const LoginWrapper = () => {
  const { setToken } = useToken();
  
  return <Login setToken={setToken} />;
};

export default LoginWrapper;