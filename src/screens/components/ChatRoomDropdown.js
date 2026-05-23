import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const ChatRoomDropdown = ({ visible, onClose, onBlock, onReport, receiverName }) => {
  const handleBlock = () => {
    onClose();
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${receiverName}? You will no longer receive messages from this user.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => onBlock(),
        },
      ]
    );
  };

  const handleReport = () => {
    onClose();
    Alert.alert(
      'Report User',
      `Are you sure you want to report ${receiverName}? Our team will review this report.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => onReport(),
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dropdownContainer}>
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={handleBlock}
                >
                  <Icon name="ban-outline" size={20} color="#F44336" />
                  <Text style={[styles.dropdownItemText, styles.blockText]}>
                    Block User
                  </Text>
                </TouchableOpacity>

                <View style={styles.dropdownDivider} />

                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={handleReport}
                >
                  <Icon name="flag-outline" size={20} color="#FF9800" />
                  <Text style={[styles.dropdownItemText, styles.reportText]}>
                    Report User
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 1000,
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 160,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
  blockText: {
    color: '#F44336',
  },
  reportText: {
    color: '#FF9800',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
});

export default ChatRoomDropdown;