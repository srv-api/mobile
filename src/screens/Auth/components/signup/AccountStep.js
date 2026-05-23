import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated } from 'react-native';
import { styles } from '../../../styles/signupStyles';

const AccountStep = ({ 
  email, 
  setEmail, 
  password, 
  setPassword, 
  showPassword, 
  setShowPassword,
  emailFocused, 
  setEmailFocused,
  passwordFocused, 
  setPasswordFocused,
  emailTranslateY,
  passwordTranslateY,
  validateEmail 
}) => {
  return (
    <>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Enter your email and password</Text>
      
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
          <TextInput
            style={styles.input}
            placeholder="hello@Yuhuu!.com"
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
          {email.length > 0 && validateEmail(email) && (
            <View style={styles.validIcon}>
              <Text style={styles.validIconText}>✓</Text>
            </View>
          )}
        </View>
      </View>

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
          >
            <Text style={styles.eyeIcon}>
              {showPassword ? '👁' : '👁‍🗨'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.passwordNote}>
        Password must be at least 6 characters
      </Text>
    </>
  );
};

export default AccountStep;