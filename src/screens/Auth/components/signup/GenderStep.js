import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { styles } from '../../../styles/signupStyles';

const GenderStep = ({ 
  gender, 
  setGender, 
  genderFocused, 
  setGenderFocused,
  genderTranslateY 
}) => {
  return (
    <>
      <Text style={styles.title}>Select your gender</Text>
      <Text style={styles.subtitle}>This helps us personalize your experience</Text>
      
      <View style={styles.inputGroup}>
        <Animated.Text style={[
          styles.label,
          genderFocused && styles.labelFocused,
          { transform: [{ translateY: genderTranslateY }] }
        ]}>
          Gender
        </Animated.Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderOption,
              gender === 'man' && styles.genderOptionSelected
            ]}
            onPress={() => setGender('man')}
            onFocus={() => setGenderFocused(true)}
            onBlur={() => setGenderFocused(false)}
          >
            <Text style={[
              styles.genderText,
              gender === 'man' && styles.genderTextSelected
            ]}>
              Man
            </Text>
            {gender === 'man' && (
              <View style={styles.genderCheck}>
                <Text style={styles.genderCheckText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.genderOption,
              gender === 'woman' && styles.genderOptionSelected
            ]}
            onPress={() => setGender('woman')}
            onFocus={() => setGenderFocused(true)}
            onBlur={() => setGenderFocused(false)}
          >
            <Text style={[
              styles.genderText,
              gender === 'woman' && styles.genderTextSelected
            ]}>
              Woman
            </Text>
            {gender === 'woman' && (
              <View style={styles.genderCheck}>
                <Text style={styles.genderCheckText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default GenderStep;