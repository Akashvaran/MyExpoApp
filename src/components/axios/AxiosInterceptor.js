import { useContext, useEffect } from 'react';

import { AuthContext } from '../productedRoute/AuthanticationContext';
import { Alert } from 'react-native';
import Axios from './Axios';

const AxiosInterceptor = () => {
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    const interceptor = Axios.interceptors.response.use(
      response => response,
      async error => {
        if (error.response.status === 401) {
          Alert.alert('Session Expired', 'Please log in again.');
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      Axios.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  return null;
};

export default AxiosInterceptor;
