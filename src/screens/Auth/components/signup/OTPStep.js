// OTPStep.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { styles } from '../../../styles/signupStyles';

const OTPStep = ({
  email,
  otpCode,
  setOtpCode,
  onResendOTP,
  isLoading,
  otpFocused,
  setOtpFocused,
  otpTranslateY,
  timer,
  setTimer,
}) => {
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResendOTP = async () => {
    if (timer > 0) {
      Alert.alert('', `Please wait ${formatTime(timer)} before requesting a new code`);
      return;
    }

    setIsResending(true);
    try {
      await onResendOTP();
      setTimer(240); // Reset timer to 60 seconds
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (text, index) => {
    // Only allow single digit
    if (text.length > 1) {
      text = text[text.length - 1];
    }

    const newOtp = [...otpCode];
    newOtp[index] = text;
    setOtpCode(newOtp);

    // Auto focus next input
    if (text.length === 1 && index < 3) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace to go to previous input
    if (e.nativeEvent.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    <>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.subtitle}>
        We've sent a verification code to{'\n'}
        <Text style={styles.emailHighlight}>{email}</Text>
      </Text>

      <View style={styles.otpContainer}>
        <Animated.Text style={[
          styles.otpLabel,
          otpFocused && styles.otpLabelFocused,
          { transform: [{ translateY: otpTranslateY }] }
        ]}>
          Verification Code
        </Animated.Text>
        
        <View style={styles.otpInputContainer}>
          {otpCode.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => inputRefs.current[index] = ref}
              style={[
                styles.otpInput,
                otpFocused && styles.otpInputFocused,
                digit && styles.otpInputFilled
              ]}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => setOtpFocused(true)}
              onBlur={() => setOtpFocused(false)}
              keyboardType="number-pad"
              maxLength={1}
              placeholder="•"
              placeholderTextColor="rgba(255,255,255,0.3)"
              textAlign="center"
            />
          ))}
        </View>
      </View>

      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>
          Didn't receive the code?{' '}
        </Text>
        <TouchableOpacity
          onPress={handleResendOTP}
          disabled={timer > 0 || isResending}
          activeOpacity={0.6}
        >
          <Text style={[
            styles.resendLink,
            (timer > 0 || isResending) && styles.resendLinkDisabled
          ]}>
            {isResending ? 'Sending...' : timer > 0 ? `Resend in ${formatTime(timer)}` : 'Resend Code'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.otpNote}>
        Please check your email inbox and spam folder
      </Text>
    </>
  );
};

export default OTPStep;