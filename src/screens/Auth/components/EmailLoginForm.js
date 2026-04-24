// src/screens/Auth/components/EmailLoginForm.js
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

const EmailLoginForm = ({ 
  visible, 
  onBack, 
  onLoginSuccess,
  fadeAnim,
  translateY,
  isLoading: parentLoading 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  // Animations
  const emailTranslateY = useRef(new Animated.Value(0)).current;
  const passwordTranslateY = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(emailTranslateY, {
      toValue: emailFocused ? -8 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [emailFocused]);

  useEffect(() => {
    Animated.timing(passwordTranslateY, {
      toValue: passwordFocused ? -8 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [passwordFocused]);

  const handleLogin = async () => {
    if (!email || !password) {
      animateError();
      Alert.alert('', 'Please fill in all fields');
      return;
    }

    if (!isValidEmail(email)) {
      animateError();
      Alert.alert('', 'Please enter a valid email address');
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
    
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Login successful!', [
        {
          text: 'OK',
          onPress: () => {
            if (onLoginSuccess) {
              onLoginSuccess(email);
            }
          }
        }
      ]);
    }, 1500);
  };

  const animateError = () => {
    Animated.sequence([
      Animated.timing(emailTranslateY, {
        toValue: -5,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(emailTranslateY, {
        toValue: 5,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(emailTranslateY, {
        toValue: -3,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(emailTranslateY, {
        toValue: 3,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(emailTranslateY, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
      <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Sign in with Email</Text>

      {/* Email Field */}
      <View style={styles.inputGroup}>
        <Animated.Text style={[
          styles.label,
          emailFocused && styles.labelFocused,
          { transform: [{ translateY: emailTranslateY }] }
        ]}>
          Email Address
        </Animated.Text>
        <View style={[
          styles.inputWrapper,
          emailFocused && styles.inputWrapperFocused
        ]}>
          <Text style={styles.inputIcon}>✉️</Text>
          <TextInput
            style={styles.input}
            placeholder="hello@MiSee.com"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={true}
          />
          {email.length > 0 && (
            <View style={styles.validIcon}>
              <Text style={styles.validIconText}>✓</Text>
            </View>
          )}
        </View>
      </View>

      {/* Password Field */}
      <View style={styles.inputGroup}>
        <Animated.Text style={[
          styles.label,
          passwordFocused && styles.labelFocused,
          { transform: [{ translateY: passwordTranslateY }] }
        ]}>
          Password
        </Animated.Text>
        <View style={[
          styles.inputWrapper,
          passwordFocused && styles.inputWrapperFocused
        ]}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="••••••••"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            secureTextEntry={!showPassword}
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

      {/* Forgot Password */}
      <TouchableOpacity style={styles.forgotButton} activeOpacity={0.6}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      {/* Login Button */}
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
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  labelFocused: {
    color: '#FF8E53',
  },
  inputWrapper: {
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#FF8E53',
    fontSize: 13,
    fontWeight: '500',
  },
  loginButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 20,
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

export default EmailLoginForm;