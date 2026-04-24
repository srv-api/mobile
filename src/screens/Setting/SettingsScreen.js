// src/screens/SettingsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const SettingsScreen = () => {
  const [notifications, setNotifications] = React.useState(true);
  const [sound, setSound] = React.useState(true);
  const [vibrate, setVibrate] = React.useState(false);
  const [autoDownload, setAutoDownload] = React.useState(false);

  const settingsSections = [
    {
      title: 'Notifications',
      items: [
        { icon: 'notifications-outline', label: 'Push Notifications', type: 'switch', value: notifications, onChange: setNotifications },
        { icon: 'volume-high-outline', label: 'Sound', type: 'switch', value: sound, onChange: setSound },
        { icon: 'phone-portrait-outline', label: 'Vibrate', type: 'switch', value: vibrate, onChange: setVibrate },
      ],
    },
    {
      title: 'Chat Settings',
      items: [
        { icon: 'chatbubble-outline', label: 'Enter key to send', type: 'switch', value: true, onChange: () => {} },
        { icon: 'download-outline', label: 'Auto-download media', type: 'switch', value: autoDownload, onChange: setAutoDownload },
        { icon: 'text-outline', label: 'Font size', type: 'link', value: 'Medium' },
        { icon: 'color-palette-outline', label: 'Theme', type: 'link', value: 'Light' },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        { icon: 'lock-closed-outline', label: 'Screen lock', type: 'switch', value: false, onChange: () => {} },
        { icon: 'eye-off-outline', label: 'Last seen', type: 'link', value: 'Everyone' },
        { icon: 'image-outline', label: 'Profile photo', type: 'link', value: 'Everyone' },
        { icon: 'information-circle-outline', label: 'About', type: 'link', value: 'Available' },
      ],
    },
    {
      title: 'Data Usage',
      items: [
        { icon: 'wifi-outline', label: 'Use mobile data', type: 'switch', value: true, onChange: () => {} },
        { icon: 'cloud-upload-outline', label: 'Backup', type: 'link', value: 'Last backup: Yesterday' },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {settingsSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[
                  styles.settingItem,
                  itemIndex === section.items.length - 1 && styles.lastItem
                ]}
                onPress={() => {
                  if (item.type === 'link') {
                    console.log('Navigate to', item.label);
                  }
                }}
              >
                <View style={styles.settingLeft}>
                  <Icon name={item.icon} size={24} color="#075E54" />
                  <Text style={styles.settingLabel}>{item.label}</Text>
                </View>
                {item.type === 'switch' ? (
                  <Switch
                    value={item.value}
                    onValueChange={item.onChange}
                    trackColor={{ false: '#767577', true: '#075E54' }}
                    thumbColor={item.value ? '#fff' : '#f4f3f4'}
                  />
                ) : (
                  <View style={styles.settingRight}>
                    <Text style={styles.settingValue}>{item.value}</Text>
                    <Icon name="chevron-forward-outline" size={20} color="#999" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Storage Info */}
      <View style={styles.storageInfo}>
        <Icon name="server-outline" size={20} color="#999" />
        <Text style={styles.storageText}>Storage used: 245 MB</Text>
      </View>

      {/* Clear Cache Button */}
      <TouchableOpacity style={styles.clearCacheButton}>
        <Text style={styles.clearCacheText}>Clear Cache</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 15,
    color: '#000',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: '#999',
    marginRight: 8,
  },
  storageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    paddingVertical: 10,
  },
  storageText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  clearCacheButton: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  clearCacheText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;