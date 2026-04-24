import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
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
    marginBottom: 30,
  },
  backButtonHeader: {
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stepDotActive: {
    backgroundColor: '#FF8E53',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 6,
  },
  stepLineActive: {
    backgroundColor: '#FF8E53',
  },
  stepText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
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
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginBottom: 32,
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
  validIcon: {
    marginLeft: 8,
  },
  validIconText: {
    fontSize: 16,
    color: '#4ADE80',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    height: 56,
  },
  datePickerButtonFocused: {
    borderColor: '#FF8E53',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dateText: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.3)',
  },
  chevronIcon: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    position: 'relative',
  },
  genderOptionSelected: {
    borderColor: '#FF8E53',
    backgroundColor: 'rgba(255,142,83,0.1)',
  },
  genderText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontWeight: '500',
  },
  genderTextSelected: {
    color: '#FF8E53',
  },
  genderCheck: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF8E53',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderCheckText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ageNote: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  loginLink: {
    color: '#FF8E53',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalClose: {
    color: '#FF8E53',
    fontSize: 20,
    fontWeight: '600',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginBottom: 12,
  },
  pickerScrollView: {
    width: '100%',
    maxHeight: 200,
  },
  pickerItem: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(255,142,83,0.2)',
  },
  pickerItemText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  pickerItemTextSelected: {
    color: '#FF8E53',
    fontWeight: '600',
  },
  confirmButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 10,
  },
  confirmGradient: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,142,83,0.1)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,142,83,0.3)',
    paddingVertical: 12,
    marginBottom: 20,
    gap: 8,
  },
  locationIcon: {
    fontSize: 18,
  },
  locationButtonText: {
    color: '#FF8E53',
    fontSize: 14,
    fontWeight: '500',
  },
  countryCodeContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  countryCodeText: {
    color: '#FF8E53',
    fontSize: 16,
    fontWeight: '600',
  },
// src/screens/styles/signupStyles.js
// Tambahkan style berikut di dalam StyleSheet.create({ ... })

  // Style untuk tombol lokasi
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,142,83,0.1)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,142,83,0.3)',
    paddingVertical: 12,
    marginBottom: 20,
    gap: 8,
  },
  locationIcon: {
    fontSize: 18,
  },
  locationButtonText: {
    color: '#FF8E53',
    fontSize: 14,
    fontWeight: '500',
  }, 
  // Style untuk input nomor telepon
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryCodeContainer: {
    backgroundColor: 'rgba(255,142,83,0.2)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,142,83,0.5)',
  },
  countryCodeText: {
    color: '#FF8E53',
    fontSize: 16,
    fontWeight: '700',
  },
  inputWrapperWithCountryCode: {
    flex: 1,
  },
  
  // Preview nomor lengkap
  fullNumberPreview: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 8,
    marginLeft: 4,
  },
  
  // Info text
  infoText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
  },

  // src/screens/styles/signupStyles.js
// Tambahkan style berikut di dalam StyleSheet.create({ ... })

  // ========== OTP STYLES ==========
  otpContainer: {
    marginBottom: 32,
    marginTop: 8,
  },
  otpLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginBottom: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  otpLabelFocused: {
    color: '#FF8E53',
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  otpInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    height: 60,
  },
  otpInputFocused: {
    borderColor: '#FF8E53',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  otpInputFilled: {
    borderColor: '#4ADE80',
    backgroundColor: 'rgba(74,222,128,0.1)',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
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
    color: '#e83535',
  },
  otpNote: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  emailHighlight: {
    color: '#FF8E53',
    fontWeight: '600',
  },
});