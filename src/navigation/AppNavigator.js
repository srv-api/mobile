// navigators/AppNavigator.js
import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/Auth/Login';
import RoomList from '../screens/Chat/RoomList';
import ChatRoom from '../screens/Chat/ChatRoom';
import Profile from '../screens/Profile/ProfileScreen';
import SignUp from '../screens/Auth/SignUp';
import ForgotPassword from '../screens/Auth/ForgotPassword';
import DebugScreen from '../screens/DebugScreen'; 
import NotificationSettings from '../screens/Profile/NotificationSettings';
import HelpSupport from '../screens/Profile/HelpSupport';
import SecurityPrivacy from '../screens/Profile/SecurityPrivacy';
import Update from '../screens/Update';
import Home from '../screens/Home/HomeScreen';
import Preferences from '../screens/Profile/Preferences';
import PremiumAccess from '../screens/Profile/PremiumAccess';
import GetStarLike from '../screens/Profile/GetStarLike';
import VisitProfile from '../screens/Profile/VisitProfile';
import LikedYou from '../screens/Friend/Like';  
import GetSee from '../screens/Friend/GetSee';
import GetBoost from '../screens/Home/GetBoost';
import GetGold from '../screens/Home/GetGold';


const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      console.log('Access token exists:', !!token); // Debugging
      setIsLoggedIn(!!token);
    } catch (error) {
      console.error('Error checking login status:', error);
      setIsLoggedIn(false);
    } finally {
      // Beri sedikit delay agar splash screen terlihat
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      initialRouteName={isLoggedIn ? "RoomList" : "Login"} // Langsung ke Login jika tidak login
      screenOptions={{
        headerShown: false,
      }}
    >
    
      {/* Auth Screens */}
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="HelpSupport" component={HelpSupport} />
      <Stack.Screen name="SecurityPrivacy" component={SecurityPrivacy} />
      <Stack.Screen name="Preferences" component={Preferences} />
      <Stack.Screen name="Update" component={Update} options={{ headerShown: false }} />
      <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
      {/* Main App Screens */}
      <Stack.Screen 
        name="RoomList" 
        component={RoomList}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="Debug" component={DebugScreen} />
      <Stack.Screen name="PremiumAccess" component={PremiumAccess} options={{ headerShown: true, title: 'Premium Access', headerStyle: { backgroundColor: '#f8f9fa' }, headerTintColor: '#000', headerTitleStyle: { fontWeight: 'bold', fontSize: 18 } }} />
      <Stack.Screen name="GetStarLike" component={GetStarLike} options={{ headerShown: true, title: 'Star', headerStyle: { backgroundColor: '#f8f9fa' }, headerTintColor: '#000', headerTitleStyle: { fontWeight: 'bold', fontSize: 18 } }} />
      <Stack.Screen name="GetSee" component={GetSee} options={{ headerShown: true, title: 'Premium Gold', headerStyle: { backgroundColor: '#f8f9fa' }, headerTintColor: '#000', headerTitleStyle: { fontWeight: 'bold', fontSize: 18 } }} />
      <Stack.Screen name="GetGold" component={GetGold} options={{ headerShown: true, title: 'Get Gold', headerStyle: { backgroundColor: '#f8f9fa' }, headerTintColor: '#000', headerTitleStyle: { fontWeight: 'bold', fontSize: 18 } }} />
      <Stack.Screen name="GetBoost" component={GetBoost} options={{ headerShown: true, title: 'Choose your boost', headerStyle: { backgroundColor: '#f8f9fa' }, headerTintColor: '#000', headerTitleStyle: { fontWeight: 'bold', fontSize: 18 } }} />
      <Stack.Screen name="VisitProfile" component={VisitProfile} />
      <Stack.Screen name="LikedYou" component={LikedYou} options={{
          headerShown: true,
          title: 'People Who Liked You'
        }}/>
      <Stack.Screen 
        name="ChatRoom" 
        component={ChatRoom}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Profile" 
        component={Profile}
        options={{
          headerShown: true,
          title: 'Profile',
        }}
      />
      <Stack.Screen name="NotificationSettings" component={NotificationSettings} />
    </Stack.Navigator>
  );
}