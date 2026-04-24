import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const dummyData = [
  { id: '1', name: 'Salsa', age: 24, photo: 'https://i.pravatar.cc/300?img=1' },
  { id: '2', name: 'Dina', age: 22, photo: 'https://i.pravatar.cc/300?img=2' },
  { id: '3', name: 'Rani', age: 26, photo: 'https://i.pravatar.cc/300?img=3' },
  { id: '4', name: 'Putri', age: 23, photo: 'https://i.pravatar.cc/300?img=4' },
];

const LikedYou = () => {
  const renderItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <Image
          source={{ uri: item.photo }}
          style={styles.image}
          blurRadius={15} // 🔥 ini efek blur
        />

        <View style={styles.overlay}>
          <Text style={styles.name}>Someone liked you</Text>
        </View>
      </View>
    );
  };

  return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={dummyData}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderItem}
      />

      {/* CTA Upgrade */}
      <View style={styles.bottomBox}>
        <Text style={styles.unlockText}>
          Unlock to see who liked you
        </Text>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Upgrade</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>

  );
};

export default LikedYou;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
        marginBottom: 10,

  },
  card: {
    flex: 1,
    margin: 10,
    height: 200,
    borderRadius: 15,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
  name: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bottomBox: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  unlockText: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#555',
  },
  button: {
    backgroundColor: '#ff4458',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});