import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { styles } from '../../../styles/signupStyles';

const CustomDatePicker = ({ 
  visible, 
  onClose, 
  onConfirm, 
  tempDate, 
  setTempDate,
  months,
  years,
  getAvailableDays,
  getDaysInMonth
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Birth Date</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.pickerContainer}>
            {/* Day Picker */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Day</Text>
              <ScrollView 
                showsVerticalScrollIndicator={false}
                style={styles.pickerScrollView}
              >
                {getAvailableDays().map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.pickerItem,
                      tempDate.day === day && styles.pickerItemSelected
                    ]}
                    onPress={() => setTempDate({ ...tempDate, day })}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      tempDate.day === day && styles.pickerItemTextSelected
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Month Picker */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Month</Text>
              <ScrollView 
                showsVerticalScrollIndicator={false}
                style={styles.pickerScrollView}
              >
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.pickerItem,
                      months[parseInt(tempDate.month) - 1] === month && styles.pickerItemSelected
                    ]}
                    onPress={() => {
                      const monthIndex = index + 1;
                      const maxDays = getDaysInMonth(monthIndex.toString(), tempDate.year);
                      let newDay = tempDate.day;
                      if (parseInt(newDay) > maxDays) {
                        newDay = maxDays.toString();
                      }
                      setTempDate({ ...tempDate, month: monthIndex.toString(), day: newDay });
                    }}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      months[parseInt(tempDate.month) - 1] === month && styles.pickerItemTextSelected
                    ]}>
                      {month.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Year Picker */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Year</Text>
              <ScrollView 
                showsVerticalScrollIndicator={false}
                style={styles.pickerScrollView}
              >
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.pickerItem,
                      tempDate.year === year && styles.pickerItemSelected
                    ]}
                    onPress={() => {
                      const maxDays = getDaysInMonth(tempDate.month, year);
                      let newDay = tempDate.day;
                      if (parseInt(newDay) > maxDays) {
                        newDay = maxDays.toString();
                      }
                      setTempDate({ ...tempDate, year, day: newDay });
                    }}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      tempDate.year === year && styles.pickerItemTextSelected
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          
          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              style={styles.confirmGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CustomDatePicker;