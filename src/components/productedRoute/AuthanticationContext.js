import React, { createContext, useState, useEffect } from 'react';
import Axios from '../axios/Axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  console.log(isLoggedIn)
  console.log(user)
  console.log(userId)

  const storeUserData = async (userData) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  };


  const logStoredUserData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('userData');
      // if(storeUserData){
      //   const parsedData = JSON.parse(storedData);
      //   setUserId(parsedData)
      // }
    } catch (error) {
      console.error('Error retrieving stored data:', error);
    }
  };
  logStoredUserData()


  const removeUserData = async () => {
    try {
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Error removing user data:', error);
    }
  };

  const login = async (userData) => {
    try {
      console.log('Setting user data:', userData);
      setIsLoggedIn(true);
      setUser(userData);
      setUserId(userData.id);
      await storeUserData(userData);
      setLoading(false);
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await Axios.post('/auth/logout');
      await removeUserData();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggedIn(false);
      setUser(null);
      setUserId(null);
    }
  };


  const verifyUser = async () => {
    try {
      setLoading(true);
      const response = await Axios.get('/auth/verify');
      if (response.data.status && response.data.user) {
        login(response.data.user);

      } else {
        setIsLoggedIn(false);
        setUser(null);
        setUserId(null);
      }
    } catch (error) {
      console.error('Verification errors:', error);
      setIsLoggedIn(false);
      setUser(null);
      setUserId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userId,
        isLoggedIn,
        user,
        loading,
        login,
        logout,
        verifyUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};