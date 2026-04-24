// src/screens/Auth/Login.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import WhatsAppLoginForm from './components/WhatsAppLoginForm';
import EmailLoginForm from './components/EmailLoginForm';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const Login = ({ navigation }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for scrolling
  const scrollViewRef = useRef(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(20)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  const googleButtonScale = useRef(new Animated.Value(1)).current;
  const whatsappButtonScale = useRef(new Animated.Value(1)).current;

  // Quotes
  const quotes = [
    { text: "Connect with the world around you", author: "MiSee" },
    { text: "Where conversations come to life", author: "MiSee" },
    { text: "Your story begins here", author: "MiSee" },
    { text: "Share moments that matter", author: "MiSee" },
  ];
  const [currentQuote, setCurrentQuote] = useState(0);

  // Configure Google SignIn
  useEffect(() => {
    const configureGoogleSignIn = async () => {
      await GoogleSignin.configure({
        scopes: ['email', 'profile'],
        webClientId: '424973742981-7g8kjb308peguc13kebh526f2nii37c5.apps.googleusercontent.com',
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });
    };
    
    configureGoogleSignIn();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(0.8)),
      }),
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedMethod === 'whatsapp' || selectedMethod === 'email') {
      setShowForm(true);
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(formTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start(() => {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: 100,
            animated: true,
          });
        }, 100);
      });
    } else if (selectedMethod === 'google') {
      handleGoogleLogin();
    }
  }, [selectedMethod]);

  const handleGoogleLogin = async () => {
    Animated.sequence([
      Animated.timing(googleButtonScale, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.quad),
      }),
      Animated.spring(googleButtonScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    setIsLoading(true);
    
    try {
      // Check Google Play Services
      await GoogleSignin.hasPlayServices();
      
      // Sign out first to ensure fresh login
      await GoogleSignin.signOut();
      
      // Sign in with Google
      const result = await GoogleSignin.signIn();
      const idToken = result.idToken || result.data?.idToken;

      if (!idToken) {
        Alert.alert('Error', 'No ID token received from Google');
        setIsLoading(false);
        return;
      }

      // Send to backend
      const res = await fetch("https://api.cashpay.co.id/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const json = await res.json();

      if (json.status && json.code === 200) {
        const { access_token, refresh_token, whatsapp } = json.data;

        // Save tokens
        await AsyncStorage.setItem('access_token', token);
        await AsyncStorage.setItem('refresh_token', refresh_token);

        if (!whatsapp || whatsapp === "/bvTmYgHVZjVt85fktdsXA==") {
          // Need to input WhatsApp number
          await AsyncStorage.setItem('google_id_token', idToken);
          navigation.navigate('InputWhatsappGoogle');
        } else {
          // Already have WhatsApp, go to main screen
          navigation.replace('PosScreen');
        }
      } else {
        Alert.alert('Login Failed', json.data?.message || 'Google login failed');
      }
    } catch (error) {
      console.error("Google Sign-In Error", error);
      Alert.alert('Error', error.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToOptions = () => {
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(formTranslateY, {
        toValue: 20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowForm(false);
      setSelectedMethod(null);
      scrollViewRef.current?.scrollTo({
        y: 0,
        animated: true,
      });
    });
  };

  const handleLoginSuccess = (userData) => {
    console.log('Login success:', userData);
    navigation.replace('RoomList');
  };

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B', '#0F172A']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Decorative Elements */}
            <Animated.View style={[styles.floatingCircle1, { transform: [{ translateY: floatY }] }]} />
            <Animated.View style={[styles.floatingCircle2, { transform: [{ translateY: floatY }] }]} />
            <Animated.View style={[styles.floatingCircle3, { transform: [{ translateY: floatY }] }]} />

            {/* Hero Section */}
            <Animated.View style={[styles.heroContainer, { opacity: heroOpacity }]}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53']}
                  style={styles.iconGradient}
                >
                  <Text style={styles.iconText}>✨</Text>
                </LinearGradient>
              </View>
              
              <Text style={styles.titleText}>MiSee</Text>
              
              <Animated.Text style={styles.quoteText}>
                {quotes[currentQuote].text}
              </Animated.Text>
              
              <View style={styles.dotContainer}>
                {quotes.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      currentQuote === index && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            </Animated.View>

            <View style={styles.flexibleSpacer} />

            {/* Login Options */}
            {!showForm ? (
              <View style={styles.buttonContainer}>
                <Animated.View style={{ transform: [{ scale: googleButtonScale }] }}>
                  <TouchableOpacity
                    style={styles.googleButton}
                    onPress={() => setSelectedMethod('google')}
                    activeOpacity={0.8}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                      style={styles.googleGradient}
                    >
                      <Text style={styles.googleIcon}>G</Text>
                      <Text style={styles.googleButtonText}>
                        {isLoading ? 'Loading...' : 'Continue with Google'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: whatsappButtonScale }] }}>
                  <TouchableOpacity
                    style={styles.whatsappButton}
                    onPress={() => setSelectedMethod('whatsapp')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.whatsappIcon}>💬</Text>
                    <Text style={styles.whatsappButtonText}>Continue with WhatsApp</Text>
                  </TouchableOpacity>
                </Animated.View>

                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>New to MiSee? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('SignUp')} activeOpacity={0.6}>
                    <Text style={styles.signupLink}>Create account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Form Components
              <View style={styles.formWrapper}>
                {selectedMethod === 'whatsapp' && (
                  <WhatsAppLoginForm
                    visible={showForm}
                    onBack={handleBackToOptions}
                    onLoginSuccess={handleLoginSuccess}
                    fadeAnim={formOpacity}
                    translateY={formTranslateY}
                    isLoading={isLoading}
                  />
                )}
                
                {selectedMethod === 'email' && (
                  <EmailLoginForm
                    visible={showForm}
                    onBack={handleBackToOptions}
                    onLoginSuccess={handleLoginSuccess}
                    fadeAnim={formOpacity}
                    translateY={formTranslateY}
                    isLoading={isLoading}
                  />
                )}
              </View>
            )}
            
            <View style={styles.bottomSpacer} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
  },
  contentContainer: {
    paddingHorizontal: 24,
    flex: 1,
    position: 'relative',
  },
  flexibleSpacer: {
    flex: 0.8,
  },
  bottomSpacer: {
    height: Platform.OS === 'ios' ? 34 : 20,
  },
  formWrapper: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  floatingCircle1: {
    position: 'absolute',
    top: 30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,107,107,0.08)',
    zIndex: -1,
  },
  floatingCircle2: {
    position: 'absolute',
    top: 150,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,142,83,0.08)',
    zIndex: -1,
  },
  floatingCircle3: {
    position: 'absolute',
    bottom: 200,
    right: -15,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,107,107,0.06)',
    zIndex: -1,
  },
  heroContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 32,
  },
  titleText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
    letterSpacing: 1,
  },
  quoteText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  activeDot: {
    width: 20,
    backgroundColor: '#FF8E53',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  googleButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
  },
  googleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  googleIcon: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '600',
  },
  googleButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 12,
    marginBottom: 20,
  },
  whatsappIcon: {
    fontSize: 20,
  },
  whatsappButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signupText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  signupLink: {
    color: '#FF8E53',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Login;