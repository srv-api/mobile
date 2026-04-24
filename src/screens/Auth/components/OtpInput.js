import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';

const OtpInput = ({ 
  otp, 
  setOtp, 
  onComplete, 
  onResend,
  countdown,
  resendEnabled,
  autoFocus = true,
  isLoading = false,
  length = 4, // Tambahkan prop untuk mengatur panjang OTP
}) => {
  const otpInputs = useRef([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (autoFocus && otpInputs.current[0]) {
      otpInputs.current[0].focus();
    }
  }, [autoFocus]);

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    
    // Auto focus ke input berikutnya
    if (text && index < length - 1) {
      otpInputs.current[index + 1]?.focus();
    }
    
    // Jika semua input terisi, panggil onComplete
    if (newOtp.every(digit => digit !== '') && onComplete) {
      onComplete(newOtp.join(''));
    }
  };

  const handleOtpKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -5,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 5,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleResendPress = () => {
    if (resendEnabled && !isLoading) {
      shakeError();
      onResend && onResend();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Verification Code</Text>
      
      <Animated.View 
        style={[
          styles.otpInputContainer,
          { transform: [{ translateX: shakeAnim }] }
        ]}
      >
        {[...Array(length)].map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => otpInputs.current[index] = ref}
            style={[
              styles.otpInput,
              otp[index] && styles.otpInputFilled
            ]}
            value={otp[index]}
            onChangeText={(text) => handleOtpChange(text, index)}
            onKeyPress={(e) => handleOtpKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            editable={!isLoading}
            selectTextOnFocus
          />
        ))}
      </Animated.View>

      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>
          {countdown > 0 ? `Resend code in ${countdown}s` : "Didn't receive code?"}
        </Text>
        {resendEnabled && (
          <TouchableOpacity 
            onPress={handleResendPress}
            activeOpacity={0.6}
            disabled={isLoading}
          >
            <Text style={[styles.resendLink, isLoading && styles.resendLinkDisabled]}>
              {' '}Resend
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginBottom: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  otpInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    height: 56,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  otpInputFilled: {
    borderColor: '#FF8E53',
    backgroundColor: 'rgba(255,142,83,0.1)',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  resendLink: {
    color: '#FF8E53',
    fontSize: 14,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
});

export default OtpInput;