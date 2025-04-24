import React, { useContext, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { AuthContext } from './AuthanticationContext';

const ProtectedRoute = ({ children }) => {
  const { loading, isLoggedIn } = useContext(AuthContext);
  const navigation = useNavigation();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      navigation.navigate('Auth', { screen: 'Login' });
    }
  }, [loading, isLoggedIn, navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return isLoggedIn ? children : null;
};

export default ProtectedRoute;