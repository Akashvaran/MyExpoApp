import React, { useEffect, useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../components/productedRoute/AuthanticationContext';

const Logo = () => {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const timer = setTimeout(() => {

      if (user) {
        navigation.replace('Main');
      } else {
        navigation.replace('Auth');
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigation, user]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Logo;