import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext, AuthProvider} from './productedRoute/AuthanticationContext';
import { SocketProvider } from '../components/chat/SocketContext';
import UserDetails from '../components/chat/UserDetails';
import ChatScreen from '../components/chat/ChatScreen';
import Navbar from './navbar/Navbar';
import Login from '../components/authentication/Login';
import AuthSignUp from '../components/authentication/AuthSignUp';
import Logo from '../components/Logo';
import { View, ActivityIndicator } from 'react-native';
import NewGroup from './chat/NewGroup';
import GroupChat from './chat/GroupChat ';
import ProtectedRoute from './productedRoute/ProtectedRoute';
import AxiosInterceptor from './axios/AxiosInterceptor';

const AuthStack = createStackNavigator();
const MainStack = createStackNavigator();
const RootStack = createStackNavigator();

const AuthStackScreen = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={Login} />
    <AuthStack.Screen name="SignUp" component={AuthSignUp} />
  </AuthStack.Navigator>
);

const MainStackScreen = () => (
  <MainStack.Navigator>
    <MainStack.Screen
      name="Users"
      options={{
        header: () => <Navbar />,
        headerShown: true,
      }}
    >
      {() => (
        <ProtectedRoute>
          <UserDetails />
        </ProtectedRoute>
      )}
    </MainStack.Screen>

    <MainStack.Screen
      name="Chat"
      options={{ headerShown: false }}
    >
      {() => (
        <ProtectedRoute>
          <ChatScreen />
        </ProtectedRoute>
      )}
    </MainStack.Screen>

    <MainStack.Screen
      name="NewGroup"
      component={NewGroup}
      options={{ headerShown: false }}
    />

    <MainStack.Screen
      name="GroupChat"
      component={GroupChat}
      options={{ headerShown: false }}
    />
  </MainStack.Navigator>
);

const AppContent = () => {
  const { loading, isLoggedIn } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <>
            <RootStack.Screen name="Splash" component={Logo} />
            <RootStack.Screen name="Main" component={MainStackScreen} />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthStackScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const AppNavigator = () => (
  <AuthProvider>
    <SocketProvider>
      <AxiosInterceptor/>
      <AppContent />
    </SocketProvider>
  </AuthProvider>
);

export default AppNavigator;
