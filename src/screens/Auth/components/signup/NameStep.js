import React from 'react';
import { View, Text, TextInput, Animated } from 'react-native';
import { styles } from '../../../styles/signupStyles';

const NameStep = ({ 
  fullName, 
  setFullName, 
  nameFocused, 
  setNameFocused,
  nameTranslateY 
}) => {
  return (
    <>
      <Text style={styles.title}>What's your name?</Text>
      <Text style={styles.subtitle}>We'll use this to personalize your experience</Text>
      
      <View style={styles.inputGroup}>
        <Animated.Text style={[
          styles.label,
          nameFocused && styles.labelFocused,
          { transform: [{ translateY: nameTranslateY }] }
        ]}>
          Full Name
        </Animated.Text>
        <View style={[
          styles.inputWrapper,
          nameFocused && styles.inputWrapperFocused
        ]}>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={fullName}
            onChangeText={setFullName}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            autoFocus={true}
          />
          {fullName.length > 0 && (
            <View style={styles.validIcon}>
              <Text style={styles.validIconText}>✓</Text>
            </View>
          )}
        </View>
      </View>
    </>
  );
};

export default NameStep;