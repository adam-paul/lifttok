// src/screens/ProfileScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  // For MVP, static user info
  const user = {
    name: 'John Doe',
    bio: 'Fitness enthusiast & weightlifter.',
  };

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.bio}>{user.bio}</Text>
      {/* Additional profile details/settings can be added here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold'
  },
  bio: {
    fontSize: 16,
    marginTop: 10
  }
});

