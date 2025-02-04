// src/screens/RecordScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import VideoRecorder from '../components/VideoRecorder';

export default function RecordScreen() {
  const [lastUploadedUrl, setLastUploadedUrl] = useState(null);

  const handleVideoUploaded = (url) => {
    setLastUploadedUrl(url);
    Alert.alert("Upload Successful", "Your video has been uploaded!");
    // Here, you could also add the video metadata to Firestore for display in the feed.
  };

  return (
    <View style={styles.container}>
      <VideoRecorder onVideoUploaded={handleVideoUploaded} />
      {lastUploadedUrl && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Last Uploaded Video:</Text>
          <Text style={styles.infoText}>{lastUploadedUrl}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  infoContainer: {
    padding: 10,
    backgroundColor: '#333',
  },
  infoText: {
    color: '#fff',
  },
});

