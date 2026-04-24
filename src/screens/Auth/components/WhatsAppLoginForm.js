// src/screens/Auth/components/WhatsAppLoginForm.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signin } from '../../../service/auth/signin';
import { useNavigation } from '@react-navigation/native';
import NotificationService from '../../../service/NotificationService';
import { webSocketService } from '../../../service/WebSocketServices';

// API Base URL
const API_BASE_URL = 'http://103.150.227.223:2356';

const WhatsAppLoginForm = ({ 
  visible, 
  onBack, 
  onLoginSuccess,
  fadeAnim,
  translateY,
  isLoading: parentLoading,
  navigation,
}) => {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [countryCode, setCountryCode] = useState('62');
  const [countryName, setCountryName] = useState('Indonesia');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
const nav = navigation || useNavigation();
  // Animations
  const phoneTranslateY = useRef(new Animated.Value(0)).current;
  const passwordTranslateY = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const formOpacity = useRef(new Animated.Value(1)).current;
  const formTranslateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      resetForm();
      detectUserCountryFromAPI();
    }
  }, [visible]);

  // Focus animations
  useEffect(() => {
    Animated.timing(phoneTranslateY, {
      toValue: phoneFocused ? -8 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [phoneFocused]);

  useEffect(() => {
    Animated.timing(passwordTranslateY, {
      toValue: passwordFocused ? -8 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [passwordFocused]);

const handleForgotPassword = () => {
  nav.navigate('ForgotPassword');
};

  // Ambil data lokasi dari API
  const detectUserCountryFromAPI = async () => {
    try {
      setIsDetectingLocation(true);
      const response = await fetch(`${API_BASE_URL}/auth/get-data-location`);
      const data = await response.json();
      
      console.log('Location from API:', data);
      
      if (data && data.status === 'success') {
        // Set country code dari response API
        if (data.phoneCode) {
          setCountryCode(data.phoneCode);
        }
        
        // Set country name
        if (data.country) {
          setCountryName(data.country);
        }
        
        console.log(`✅ Detected: ${data.country} with phone code +${data.phoneCode}`);
      } else {
        // Fallback ke default
        setCountryCode('62');
        setCountryName('Indonesia');
      }
    } catch (error) {
      console.log('Error detecting country:', error);
      // Fallback ke default
      setCountryCode('62');
      setCountryName('Indonesia');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setPhoneNumber('');
    setPassword('');
    setShowPassword(false);
    setIsLoading(false);
  };

  const handleNext = async () => {
    if (!phoneNumber) {
      Alert.alert('', 'Please enter your phone number');
      return;
    }

    const cleanedPhone = phoneNumber.replace(/^0+/, '');
    if (!isValidPhoneNumber(phoneNumber)) {
      Alert.alert('', 'Please enter a valid phone number (8-15 digits)');
      return;
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    setIsLoading(true);
    
    // Simulate check
    setTimeout(() => {
      setIsLoading(false);
      
      // Animate to password step
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(formTranslateX, {
          toValue: -30,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setStep(2);
        formOpacity.setValue(0);
        formTranslateX.setValue(30);
        Animated.parallel([
          Animated.timing(formOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(formTranslateX, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 800);
  };

const handleLogin = async () => {
  if (!password) {
    Alert.alert('', 'Please enter your password');
    return;
  }

  if (password.length < 6) {
    Alert.alert('', 'Password must be at least 6 characters');
    return;
  }

  Animated.sequence([
    Animated.timing(buttonScale, {
      toValue: 0.92,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }),
  ]).start();

  setIsLoading(true);
  
  try {
    let cleanedPhone = phoneNumber.replace(/^0+/, '');
    const fullPhoneNumber = `+${countryCode}${cleanedPhone}`;
    
    console.log('=== LOGIN DEBUG ===');
    console.log('Country code from API:', countryCode);
    console.log('Country name:', countryName);
    console.log('Full number:', fullPhoneNumber);
    
    const response = await signin(fullPhoneNumber, password);
    
    console.log('Login response:', JSON.stringify(response, null, 2));
    
    if (response.status === true && response.data) {
      // ✅ Simpan data user
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('refresh_token', response.data.refresh_token);
      await AsyncStorage.setItem('user_id', response.data.id);
      await AsyncStorage.setItem('detail_id', response.data.detail_id);
      await AsyncStorage.setItem('user_data', JSON.stringify({
        id: response.data.id,
        detail_id: response.data.detail_id,
        full_name: response.data.full_name,
        email: response.data.email,
        whatsapp: fullPhoneNumber,
        country: countryName,
        countryCode: countryCode,
      }));
      
      // ✅ SETELAH LOGIN: Inisialisasi Notifikasi & WebSocket
      console.log('🔧 Initializing notifications and WebSocket...');
      
      // Setup notifikasi
      await NotificationService.setupChannels();
      const granted = await NotificationService.requestPermission();
      if (granted) {
        NotificationService.setupFCMListeners();
        await NotificationService.getFCMToken();
      }
      
      // Connect WebSocket
      await webSocketService.connect(response.data.id);
      
      Alert.alert(
        'Success',
        `Welcome back, ${response.data.full_name || 'User'}!`,
        [
          {
            text: 'Continue',
            onPress: () => {
              if (onLoginSuccess) {
                onLoginSuccess(response.data);
              }
            }
          }
        ]
      );
    } else {
      Alert.alert('Login Failed', response.meta.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    Alert.alert(
      'Login Failed', 
      error.response?.data?.message || error.message || 'An error occurred. Please try again.'
    );
  } finally {
    setIsLoading(false);
  }
};

  const isValidPhoneNumber = (phone) => {
    const phoneRegex = /^[0-9]{8,15}$/;
    return phoneRegex.test(phone.replace(/[^0-9]/g, ''));
  };

  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 15) {
      setPhoneNumber(cleaned);
    }
  };

  const handleBackToPhone = () => {
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(formTranslateX, {
        toValue: 30,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(1);
      setPassword('');
      setShowPassword(false);
      formOpacity.setValue(0);
      formTranslateX.setValue(-30);
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(formTranslateX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          opacity: fadeAnim,
          transform: [{ translateY: translateY }]
        }
      ]}
    >
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={step === 1 ? onBack : handleBackToPhone} 
        activeOpacity={0.7}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Animated.View 
        style={[
          styles.formContainer,
          {
            opacity: formOpacity,
            transform: [{ translateX: formTranslateX }]
          }
        ]}
      >
        {step === 1 ? (
          // Step 1: Phone Number Input
          <>
            <Text style={styles.title}>Sign in with WhatsApp</Text>
            <Text style={styles.subtitle}>Enter your WhatsApp number to continue</Text>

            <View style={styles.inputGroup}>
              <View style={styles.phoneInputContainer}>
                {/* Country Code Display - Langsung dari API */}
                <View style={styles.countryCodeButton}>
                  {isDetectingLocation ? (
                    <ActivityIndicator size="small" color="#FF8E53" />
                  ) : (
                    <Text style={styles.countryCodeText}>+{countryCode}</Text>
                  )}
                </View>
                
                <View style={[
                  styles.inputWrapper,
                  phoneFocused && styles.inputWrapperFocused
                ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="812 3456 7890"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={phoneNumber}
                    onChangeText={formatPhoneNumber}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                    keyboardType="phone-pad"
                    autoFocus={true}
                  />
                  {phoneNumber.length > 0 && (
                    <View style={styles.validIcon}>
                      <Text style={styles.validIconText}>✓</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <Text style={styles.infoText}>
              We'll sign you in with your WhatsApp account
            </Text>

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
                disabled={isLoading || parentLoading || isDetectingLocation}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53']}
                  style={styles.nextGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.nextButtonText}>Next</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          // Step 2: Password Input
          <>
            <Text style={styles.title}>Enter Password</Text>
            
            <View style={styles.phoneDisplayContainer}>
              <Text style={styles.phoneDisplayValue}>
                +{countryCode} {phoneNumber}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <View style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused
              ]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoFocus={true}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.6}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? '👁' : '👁‍🗨'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

           <TouchableOpacity 
              style={styles.forgotButton} 
              onPress={handleForgotPassword}
              activeOpacity={0.6}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading || parentLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53']}
                  style={styles.loginGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  backButtonText: {
    color: '#FF8E53',
    fontSize: 14,
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginBottom: 24,
  },
  phoneDisplayContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  phoneDisplayValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  phoneDisplayCountry: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  countryCodeButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: 80,
  },
  countryCodeText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    height: 54,
  },
  inputWrapperFocused: {
    borderColor: '#FF8E53',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
    opacity: 0.5,
  },
  input: {
    color: '#FFF',
    fontSize: 15,
    paddingVertical: 12,
    flex: 1,
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.5)',
  },
  validIcon: {
    marginLeft: 8,
  },
  validIconText: {
    fontSize: 16,
    color: '#4ADE80',
  },
  detectedCountryText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginBottom: 12,
    textAlign: 'center',
  },
  infoText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginBottom: 24,
    textAlign: 'center',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#FF8E53',
    fontSize: 13,
    fontWeight: '500',
  },
  nextButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#FF8E53',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  nextGradient: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loginButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#FF8E53',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  loginGradient: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default WhatsAppLoginForm;