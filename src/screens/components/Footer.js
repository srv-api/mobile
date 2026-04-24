import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const Footer = ({ navigation, active }) => {
  const menus = [
    { name: 'chat', label: 'Chats', icon: 'chatbubble-outline', activeIcon: 'chatbubbles-outline', route: 'RoomList' },
    { name: 'match', label: 'Match', icon: 'people-outline', activeIcon: 'people-outline', route: 'Match' },
    { name: 'home', label: 'Explore', icon: 'planet', activeIcon: 'planet-outline', route: 'Home' },
    { name: 'update', label: 'updates', icon: 'footsteps-outline', activeIcon: 'footsteps-outline', route: 'Update' },
    { name: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person-outline', route: 'Profile' },
  ];

  const renderMenuItem = (item, isActive) => {
    // Special styling for home button
    if (item.name === 'home') {
      return (
        <TouchableOpacity
          style={styles.homeButtonWrapper}
          activeOpacity={0.8}
          onPress={() => navigation.navigate(item.route)}
        >
          <View style={[
            styles.homeButton,
            isActive && styles.homeButtonActive
          ]}>
            <Icon
              name={isActive ? item.activeIcon : item.icon}
              size={28}
              color={isActive ? '#000' : '#000'} // 🔥 warna merah untuk heart
            />
          </View>
          <Text style={[styles.text, isActive && styles.activeText, styles.homeText]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    }

    // Normal styling for other buttons
    return (
      <TouchableOpacity
        style={styles.menuItem}
        activeOpacity={0.8}
        onPress={() => navigation.navigate(item.route)}
      >
        {isActive && <View style={styles.activeLine} />}
        <Icon
          name={isActive ? item.activeIcon : item.icon}
          size={22}
          color={isActive ? '#111' : '#999'}
        />
        <Text style={[styles.text, isActive && styles.activeText]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {menus.map((item, index) => {
          const isActive = active === item.name;
          return (
            <View key={index} style={styles.menuItemWrapper}>
              {renderMenuItem(item, isActive)}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    padding: 12,
    backgroundColor: '#fff',
  },
  container: {
    flexDirection: 'row',
    height: 70,
    borderRadius: 25,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
  },
  menuItemWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  homeButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -25,
  },
  homeButton: {
    width: 55,
    height: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  homeButtonActive: {
    backgroundColor: '#fff', // 🔥 background putih saat active
    shadowColor: '#ff0000',
    shadowOpacity: 0.3,
    elevation: 10,
  },
  homeText: {
    marginTop: 2,
  },
  activeLine: {
    position: 'absolute',
    top: 6,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#075E54',
  },
  text: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  activeText: {
    color: '#111',
    fontWeight: '600',
  },
});

export default Footer;