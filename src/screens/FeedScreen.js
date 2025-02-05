// src/screens/FeedScreen.js
import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Text } from 'react-native';
import VideoItem from '../components/VideoItem';
import { db, storage } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function FeedScreen() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch videos from Firestore and get their download URLs
  const fetchVideos = async () => {
    try {
      console.log('Fetching videos...');
      const videosCollection = collection(db, 'videos');
      
      // Log the collection reference to verify it's correct
      console.log('Videos collection ref:', videosCollection.path);
      
      const querySnapshot = await getDocs(videosCollection);
      console.log('Query snapshot:', querySnapshot.size, 'documents found');
      
      const videosData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Document ID:', doc.id);
        console.log('Document data:', JSON.stringify(data, null, 2));
        
        // Add video regardless of timestamp
        videosData.push({
          id: doc.id,
          videoUrl: data.videoUrl,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
          description: data.description || 'No description',
          userId: data.userId || 'anonymous',
        });
      });
      
      console.log('Processed videos:', JSON.stringify(videosData, null, 2));
      
      if (videosData.length === 0) {
        console.log('No videos found in Firestore');
      }
      
      setVideos(videosData);
      setError(null);
    } catch (error) {
      console.error("Error fetching videos: ", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchVideos();
  }, []);

  useEffect(() => {
    fetchVideos();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.retryText} onPress={fetchVideos}>Tap to retry</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {videos.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No videos yet</Text>
          <Text style={styles.instructionText}>Pull down ↓ to refresh</Text>
        </View>
      ) : (
        <FlatList 
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VideoItem 
              videoUri={item.videoUrl}
              timestamp={item.timestamp}
              description={item.description}
              userId={item.userId}
            />
          )}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
              title="Pull to refresh..."
              titleColor="#fff"
            />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={3}
          windowSize={5}
          initialNumToRender={2}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    flexGrow: 1,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  instructionText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  retryText: {
    color: '#4a9eff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});

