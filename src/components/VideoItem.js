// src/components/VideoItem.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import VideoPlayer from './VideoPlayer';

export default function VideoItem({ videoUri, timestamp, description, userId, isActive, onVideoPress }) {
  const formatTimestamp = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <View style={styles.container}>
      <VideoPlayer 
        uri={videoUri} 
        isActive={isActive}
        onPress={onVideoPress}
      />
      <View style={styles.metadata}>
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
        <View style={styles.details}>
          <Text style={styles.userId}>@{userId}</Text>
          {timestamp && (
            <Text style={styles.timestamp}>{formatTimestamp(timestamp)}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    backgroundColor: '#000',
  },
  metadata: {
    padding: 10,
  },
  description: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userId: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timestamp: {
    color: '#999',
    fontSize: 12,
  },
});

