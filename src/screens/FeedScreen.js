// src/screens/FeedScreen.js
import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import VideoItem from '../components/VideoItem';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function FeedScreen() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch videos from Firestore (each document should contain a field like `videoUrl`)
  const fetchVideos = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'videos'));
      const videosData = [];
      querySnapshot.forEach((doc) => {
        videosData.push({ id: doc.id, ...doc.data() });
      });
      setVideos(videosData);
    } catch (error) {
      console.error("Error fetching videos: ", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#000" />;
  }

  return (
    <FlatList 
      data={videos}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <VideoItem videoUri={item.videoUrl} />}
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchVideos} />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

