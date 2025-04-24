import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

const AudioPlayer = ({ audioData }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState((audioData?.duration || 0) * 1000);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playSound = async () => {
    try {
      setIsLoading(true);
      if (sound) {
        await sound.unloadAsync();
      }

      let uri = audioData?.uri;
      
      if (!uri && audioData?.data) {
        try {
          const fileUri = `${FileSystem.cacheDirectory}${audioData.fileName || `audio_${Date.now()}.m4a`}`;
          
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          if (!fileInfo.exists) {
            await FileSystem.writeAsStringAsync(fileUri, audioData.data, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }
          
          uri = fileUri;
        } catch (fileError) {
          console.error('Error creating audio file:', fileError);
          throw new Error('Failed to create audio file');
        }
      }

      if (!uri) {
        throw new Error('No audio URI available');
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || (audioData?.duration || 0) * 1000);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPosition(0);
            }
          }
        }
      );
      
      setSound(newSound);
      setIsPlaying(true);
      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing sound:', error);
      Alert.alert('Error', 'Failed to play audio message');
    } finally {
      setIsLoading(false);
    }
  };

  const pauseSound = async () => {
    try {
      if (sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error pausing sound:', error);
    }
  };

  const formatTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={isPlaying ? pauseSound : playSound}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <MaterialIcons 
            name={isPlaying ? "pause" : "play-arrow"} 
            size={36} 
            color="#007AFF" 
          />
        )}
      </TouchableOpacity>
      
      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>
          {formatTime(position)} / {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    minWidth: 150,
  },
  progressContainer: {
    marginLeft: 10,
  },
  timeText: {
    fontSize: 14,
    color: '#333',
  },
});

export default AudioPlayer;