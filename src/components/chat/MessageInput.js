import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Text,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import AudioRecorder from './AudioRecorder';
import LocationSharingModal from './LocationSharingModel';
import CameraScreen from './Camera';

const MessageInput = ({
  value,
  onChangeText,
  onSend,
  onSendAudio,
  onSendLocation,
  onSendImage,
  isSending = false,
  placeholder = "Type a message...",
  isEditing = false,
  onCancelEdit,
  maxLength = 500,
  style,
  buttonColor = '#4CAF50'
}) => {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const handleSendMessage = () => {
    if (value.trim() && !isSending) {
      onSend();
    }
  };

  const handleAudioRecordingComplete = (audioData) => {
    setShowAudioRecorder(false);
    onSendAudio(audioData);
  };

  const handleSendLocation = (locationData) => {
    setShowLocationModal(false);
    onSendLocation(locationData);
  };

  const handleSendImage = (imageUri) => {
    setShowCamera(false);
    onSendImage(imageUri);
  };

  return (
    <>
      <View style={[styles.inputContainer, style]}>
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => setShowLinkModal(true)}
        >
          <Ionicons name="add" size={24} color={buttonColor} />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline
          maxLength={maxLength}
        />
        
        {isEditing ? (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancelEdit}
          >
            <Text style={[styles.cancelButtonText, { color: buttonColor }]}>Cancel</Text>
          </TouchableOpacity>
        ) : value.trim() ? (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={buttonColor} />
            ) : (
              <Icon name="send" size={24} color={buttonColor} />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.audioButton}
            onPress={() => setShowAudioRecorder(true)}
            disabled={isSending}
          >
            <Icon name="keyboard-voice" size={24} color={buttonColor} />
          </TouchableOpacity>
        )}
      </View>

      <Modal 
        visible={showLinkModal} 
        transparent 
        animationType="fade" 
        onRequestClose={() => setShowLinkModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLinkModal(false)}>
          <View style={styles.linkOptionsContainer}>
            <TouchableOpacity 
              onPress={() => {
                setShowLinkModal(false);
                setShowLocationModal(true);
              }} 
              style={styles.linkOptionButton}
            >
              <Icon name="location-on" size={24} color={buttonColor} />
              <Text style={styles.linkOptionText}>Share Location</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => {
                setShowLinkModal(false);
                setShowCamera(true);
              }}
              style={styles.linkOptionButton}
            >
              <Icon name="photo-camera" size={24} color={buttonColor} />
              <Text style={styles.linkOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => {
                setShowLinkModal(false);
                setShowAudioRecorder(true);
              }}
              style={styles.linkOptionButton}
            >
              <Icon name="keyboard-voice" size={24} color={buttonColor} />
              <Text style={styles.linkOptionText}>Send Audio</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity 
              onPress={() => setShowLinkModal(false)} 
              style={styles.linkOptionButton}
            >
              <Text style={[styles.cancelOptionText, { color: buttonColor }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <LocationSharingModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSend={handleSendLocation}
        isSending={isSending}
      />

      <CameraScreen
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onSendImage={handleSendImage}
      />

      <AudioRecorder 
        visible={showAudioRecorder}
        onRecordingComplete={handleAudioRecordingComplete}
        onCancel={() => setShowAudioRecorder(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#fff',
  },
  linkButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginHorizontal: 5,
    fontSize: 16,
  },
  sendButton: {
    padding: 8,
  },
  audioButton: {
    padding: 8,
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkOptionsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '80%',
    paddingVertical: 10,
  },
  linkOptionButton: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkOptionText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  cancelOptionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 5,
  },
});

export default MessageInput;