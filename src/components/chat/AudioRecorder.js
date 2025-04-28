import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { MaterialIcons } from '@expo/vector-icons';

const AudioRecorder = ({ visible, onRecordingComplete, onCancel }) => {
  const [recording, setRecording] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle'); 
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingInterval = useRef(null);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      cleanupRecording();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      startRecording();
    } else {
      cleanupRecording();
    }
  }, [visible]);

  const cleanupRecording = async () => {
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
    
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch (error) {
        // console.log('Error stopping recording during cleanup:', error);
      }
    }
    
    if (isMounted.current) {
      setRecording(null);
      setRecordingDuration(0);
      setRecordingStatus('idle');
    }
  };

  const startRecording = async () => {
    if (recordingStatus !== 'idle') return;
    
    try {
      setRecordingStatus('preparing');
      
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow microphone access to record audio.');
        onCancel();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      if (!isMounted.current) {
        await newRecording.stopAndUnloadAsync();
        return;
      }

      setRecording(newRecording);
      setRecordingStatus('recording');
      setRecordingDuration(0);

      recordingInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      // console.error('Failed to start recording', err);
      if (isMounted.current) {
        setRecordingStatus('idle');
      }
      Alert.alert('Error', 'Failed to start recording');
      onCancel();
    }
  };

  const stopRecording = async () => {
    if (recordingStatus !== 'recording' || !recording) return;
    
    try {
      setRecordingStatus('stopping');
      
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }

      await recording.stopAndUnloadAsync();

      if (recordingDuration < 1) {
        Alert.alert('Too short', 'Recording must be at least 1 second');
        onCancel();
        return;
      }

      const uri = recording.getURI();
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileInfo = await FileSystem.getInfoAsync(uri);

      onRecordingComplete({
        audio: base64Audio,
        duration: recordingDuration,
        uri: uri,
        size: fileInfo.size,
        mimeType: 'audio/m4a',
        fileName: `audio_${Date.now()}.m4a`
      });
    } catch (err) {
      // console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording');
      onCancel();
    } finally {
      if (isMounted.current) {
        setRecordingStatus('idle');
      }
    }
  };

  const handleCancel = async () => {
    await cleanupRecording();
    onCancel();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.recordingContainer}>
            <View style={styles.recordingIndicator}>
              {recordingStatus === 'recording' && (
                <>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>Recording</Text>
                </>
              )}
              {recordingStatus === 'preparing' && (
                <Text style={styles.recordingText}>Preparing...</Text>
              )}
              {recordingStatus === 'stopping' && (
                <Text style={styles.recordingText}>Processing...</Text>
              )}
            </View>

            <Text style={styles.durationText}>
              {formatTime(recordingDuration)}
            </Text>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={recordingStatus === 'stopping'}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.stopButton,
                recordingStatus !== 'recording' && styles.disabledButton
              ]}
              onPress={stopRecording}
              disabled={recordingStatus !== 'recording'}
            >
              <MaterialIcons name="stop" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  recordingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'red',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    color: 'red',
  },
  durationText: {
    fontSize: 16,
    color: '#333',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    padding: 15,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  stopButton: {
    backgroundColor: 'red',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default AudioRecorder;