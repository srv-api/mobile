import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../../../styles/signupStyles';

const BirthdayStep = ({ 
  formatBirthDate, 
  openDatePicker, 
  showDatePicker 
}) => {
  return (
    <>
      <Text style={styles.title}>When's your birthday?</Text>
      <Text style={styles.subtitle}>We need your age to verify eligibility</Text>
      
      <View style={styles.inputGroup}>
        <TouchableOpacity
          style={[
            styles.datePickerButton,
            showDatePicker && styles.datePickerButtonFocused
          ]}
          onPress={openDatePicker}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.dateText,
            !formatBirthDate() && styles.placeholderText
          ]}>
            {formatBirthDate() || 'Select your birth date'}
          </Text>
          <Text style={styles.chevronIcon}>▼</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.ageNote}>
        You must be at least 13 years old to join Yuhuu!
      </Text>
    </>
  );
};

export default BirthdayStep;