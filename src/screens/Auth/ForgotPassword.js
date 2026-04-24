import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import OtpInput from './components/OtpInput'; // Import komponen OTP

const { width, height } = Dimensions.get('window');

const ForgotPassword = ({ navigation }) => {
  const [step, setStep] = useState(1); // 1: email/phone, 2: OTP, 3: new password
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendEnabled, setResendEnabled] = useState(false);
  
  // Focus states
  const [inputFocused, setInputFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const formOpacity = useRef(new Animated.Value(1)).current;
  const formTranslateX = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  // Input animations
  const emailTranslateY = useRef(new Animated.Value(0)).current;
  const passwordTranslateY = useRef(new Animated.Value(0)).current;
  const confirmTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(0.6)),
      }),
    ]).start();

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
  }, []);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && !resendEnabled) {
      setResendEnabled(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Focus animations
  useEffect(() => {
    Animated.timing(emailTranslateY, {
      toValue: inputFocused ? -8 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [inputFocused]);

  useEffect(() => {
    Animated.timing(passwordTranslateY, {
      toValue: passwordFocused ? -8 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [passwordFocused]);

  useEffect(() => {
    Animated.timing(confirmTranslateY, {
      toValue: confirmFocused ? -8 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [confirmFocused]);

  const handleSendOTP = () => {
    if (!emailOrPhone.trim()) {
      shakeError('email');
      Alert.alert('', 'Please enter your email or phone number');
      return;
    }

    // Basic validation
    const isEmail = emailOrPhone.includes('@') && emailOrPhone.includes('.');
    const isPhone = /^[0-9]{8,15}$/.test(emailOrPhone.replace(/[^0-9]/g, ''));
    
    if (!isEmail && !isPhone) {
      shakeError('email');
      Alert.alert('', 'Please enter a valid email or phone number');
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
    
    // Simulate sending OTP
    setTimeout(() => {
      setIsLoading(false);
      setCountdown(60);
      setResendEnabled(false);
      nextStep();
      Alert.alert(
        'Verification Code Sent',
        `We've sent a 6-digit code to ${emailOrPhone}`,
        [{ text: 'OK' }]
      );
    }, 1500);
  };

  const handleVerifyOTP = (otpCode) => {
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert('', 'Please enter the complete 6-digit verification code');
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
    
    // Simulate verifying OTP
    setTimeout(() => {
      setIsLoading(false);
      nextStep();
      Alert.alert('Success', 'Code verified! Please create a new password.');
    }, 1500);
  };

  const handleResendOTP = () => {
    if (!resendEnabled) return;
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCountdown(60);
      setResendEnabled(false);
      setOtp(['', '', '', '', '', '']); // Reset OTP
      Alert.alert('', 'Verification code resent successfully!');
    }, 1000);
  };

  const handleResetPassword = () => {
    if (!newPassword) {
      shakeError('password');
      Alert.alert('', 'Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      shakeError('password');
      Alert.alert('', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      shakeError('confirm');
      Alert.alert('', 'Passwords do not match');
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
    
    // Simulate resetting password
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Password Reset',
        'Your password has been successfully reset. Please login with your new password.',
        [
          {
            text: 'Login',
            onPress: () => navigation.goBack()
          }
        ]
      );
    }, 1500);
  };

  const shakeError = (field) => {
    let targetAnim;
    switch(field) {
      case 'email':
        targetAnim = emailTranslateY;
        break;
      case 'password':
        targetAnim = passwordTranslateY;
        break;
      case 'confirm':
        targetAnim = confirmTranslateY;
        break;
      default:
        return;
    }
    
    Animated.sequence([
      Animated.timing(targetAnim, {
        toValue: -5,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(targetAnim, {
        toValue: 5,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(targetAnim, {
        toValue: -3,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(targetAnim, {
        toValue: 3,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(targetAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const nextStep = () => {
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
      setStep(step + 1);
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
  };

  const prevStep = () => {
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
      setStep(step - 1);
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

            {/* Header */}
            <View style={styles.headerContainer}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back to Login</Text>
              </TouchableOpacity>
            </View>

            {/* Main Content */}
            <View style={styles.mainContainer}>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                {step === 1 && "Enter your email or phone number to receive a verification code"}
                {step === 2 && "Enter the 6-digit code sent to your email/phone"}
                {step === 3 && "Create a new password for your account"}
              </Text>

              {/* Form Container */}
              <View style={styles.formWrapper}>
                <Animated.View 
                  style={[
                    styles.formContainer,
                    {
                      opacity: formOpacity,
                      transform: [{ translateX: formTranslateX }]
                    }
                  ]}
                >
                  {step === 1 && (
                    // Step 1: Email/Phone Input
                    <>
                      <View style={styles.inputGroup}>
                        <Animated.Text style={[
                          styles.label,
                          inputFocused && styles.labelFocused,
                          { transform: [{ translateY: emailTranslateY }] }
                        ]}>
                          Email or Phone Number
                        </Animated.Text>
                        <View style={[
                          styles.inputWrapper,
                          inputFocused && styles.inputWrapperFocused
                        ]}>
                          <Text style={styles.inputIcon}>✉️</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="example@email.com"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={emailOrPhone}
                            onChangeText={setEmailOrPhone}
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                            keyboardType="default"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoFocus={true}
                          />
                        </View>
                      </View>
                    </>
                  )}

                  {step === 2 && (
                    // Step 2: OTP Verification
                    <OtpInput
                      otp={otp}
                      setOtp={setOtp}
                      onComplete={handleVerifyOTP}
                      onResend={handleResendOTP}
                      countdown={countdown}
                      resendEnabled={resendEnabled}
                      autoFocus={true}
                      isLoading={isLoading}
                    />
                  )}

                  {step === 3 && (
                    // Step 3: New Password
                    <>
                      <View style={styles.inputGroup}>
                        <Animated.Text style={[
                          styles.label,
                          passwordFocused && styles.labelFocused,
                          { transform: [{ translateY: passwordTranslateY }] }
                        ]}>
                          New Password
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
                            value={newPassword}
                            onChangeText={setNewPassword}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                            secureTextEntry={!showPassword}
                            autoFocus={true}
                          />
                          <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeButton}
                          >
                            <Text style={styles.eyeIcon}>
                              {showPassword ? '👁' : '👁‍🗨'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Animated.Text style={[
                          styles.label,
                          confirmFocused && styles.labelFocused,
                          { transform: [{ translateY: confirmTranslateY }] }
                        ]}>
                          Confirm New Password
                        </Animated.Text>
                        <View style={[
                          styles.inputWrapper,
                          confirmFocused && styles.inputWrapperFocused
                        ]}>
                          <Text style={styles.inputIcon}>🔒</Text>
                          <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Confirm your password"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            onFocus={() => setConfirmFocused(true)}
                            onBlur={() => setConfirmFocused(false)}
                            secureTextEntry={!showConfirmPassword}
                          />
                          <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.eyeButton}
                          >
                            <Text style={styles.eyeIcon}>
                              {showConfirmPassword ? '👁' : '👁‍🗨'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <Text style={styles.passwordNote}>
                        Password must be at least 6 characters
                      </Text>
                    </>
                  )}
                </Animated.View>

                {/* Navigation Buttons */}
                <View style={styles.buttonContainer}>
                  {step > 1 && (
                    <TouchableOpacity
                      style={styles.backButtonForm}
                      onPress={prevStep}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.backButtonFormText}>Back</Text>
                    </TouchableOpacity>
                  )}
                  
                  <Animated.View style={{ flex: 1, transform: [{ scale: buttonScale }] }}>
                    <TouchableOpacity
                      style={[styles.nextButton, step === 1 && styles.fullWidthButton]}
                      onPress={
                        step === 1 ? handleSendOTP :
                        step === 2 ? () => handleVerifyOTP(otp.join('')) :
                        handleResetPassword
                      }
                      disabled={isLoading}
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
                          <Text style={styles.nextButtonText}>
                            {step === 1 ? 'Send Code' : step === 2 ? 'Verify' : 'Reset Password'}
                          </Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </View>
            </View>
            
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
  bottomSpacer: {
    height: Platform.OS === 'ios' ? 34 : 20,
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
  headerContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
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
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginBottom: 32,
    lineHeight: 20,
  },
  formWrapper: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
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
    height: 56,
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
    fontSize: 16,
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
  passwordNote: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  backButtonForm: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonFormText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#FF8E53',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  fullWidthButton: {
    width: '100%',
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
});

export default ForgotPassword;