import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
  Linking,
  TouchableOpacity
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Axios from '../axios/Axios';
import moment from 'moment';
import { AuthContext } from '../productedRoute/AuthanticationContext';
import { SocketContext } from './SocketContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import MessageInput from './MessageInput';
import AudioPlayer from './AudioPlayer';

const ChatScreen = () => {
  const route = useRoute();
  const { user } = route.params ;
  const { userId } = useContext(AuthContext) || {};
  const { 
    socket, 
    onlineUsers = [], 
    typingUsers = [], 
    sendMessage, 
    startTyping, 
    markAsRead, 
    editMessage, 
    deleteMessage 
  } = useContext(SocketContext) || {};
 

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const flatListRef = useRef(null);
  const navigation = useNavigation();
  const maxWord = 100;
console.log(messages)
  useEffect(() => {
    console.log('Route params:', route.params);
    console.log('User:', user);
  }, [route.params]);

  if (!user?._id || !userId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load chat. Missing</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }



  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await Axios.get(`/chat/messages/${userId}/${user._id}`);
        setMessages((response.data).map(msg => ({
          _id: msg._id,
          text: msg.content?.text || '',
          sender: msg.sender,
          receiver: msg.receiver,
          createdAt: msg.createdAt,
          status: msg.read ? 'viewed' : 'delivered',
          isEdited: msg.isEdited,
          audio: msg.type === 'audio' ? msg.content : null,
          type: msg.type,
          location: msg.type === 'location' ? msg.content : null
        })));
        if (markAsRead) markAsRead(user._id);
      } catch (error) {
        console.error('Error fetching messages:', error);
        Alert.alert('Error', 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [user._id, userId]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (!message?._id) return;
      
      setMessages(prev => {
        const messageExists = prev.some(msg => msg._id === message._id);
        if (messageExists) return prev;
        
        return [...prev, {
          _id: message._id,
          text: message.content?.text || '',
          sender: message.sender,
          receiver: message.receiver,
          createdAt: message.createdAt || new Date(),
          status: message.read ? 'viewed' : 'delivered',
          isEdited: message.isEdited || false,
          audio: message.type === 'audio' ? message.content : null,
          type: message.type || 'text',
          location: message.type === 'location' ? message.content : null
        }];
      });
    
      if (message.sender === user._id && markAsRead) {
        markAsRead(user._id);
      }
    };

    const handleMessageEdited = (editedMessage) => {
      if (!editedMessage?._id) return;
      
      setMessages(prev => prev.map(msg => 
        msg._id === editedMessage._id ? {
          ...msg,
          text: editedMessage.content?.text || '',
          isEdited: true
        } : msg
      ));
    };
  
    const handleMessageDeleted = (deletedMessageId) => {
      if (!deletedMessageId) return;
      
      setMessages(prev => prev.filter(msg => msg._id !== deletedMessageId));
    };

    socket.on('receiveMessage', handleNewMessage);
    socket.on('messageEdited', handleMessageEdited);
    socket.on('messageDeleted', handleMessageDeleted);

    return () => {
      socket.off('receiveMessage', handleNewMessage);
      socket.off('messageEdited', handleMessageEdited);
      socket.off('messageDeleted', handleMessageDeleted);
    };
  }, [socket, user._id, userId, markAsRead]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || newMessage.length > maxWord || isSending || !sendMessage) return;
    
    setIsSending(true);
    
    try {
      if (editingMessage) {
        if (editMessage) await editMessage(editingMessage._id, { text: newMessage });
        setEditingMessage(null);
        setNewMessage('');
        return;
      }
      
      const tempMessage = {
        _id: Date.now().toString(),
        text: newMessage,
        sender: userId,
        receiver: user._id,
        createdAt: new Date(),
        status: 'sending',
        isEdited: false,
        type: 'text'
      };
      
      setMessages(prev => [...prev, tempMessage]);
      
      const response = await sendMessage(
        user._id,
        'text',
        { text: newMessage }
      );
      
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.status === 'sending' ? { ...msg, status: 'failed' } : msg
      ));
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendAudio = async (audioData) => {
    if (!sendMessage) return;
    
    try {
      setIsSending(true);
      
      const tempMessage = {
        _id: Date.now().toString(),
        text: '[Audio message]',
        audio: {
          ...audioData,
          AudioData: base64Audio 
        },
        sender: userId,
        receiver: user._id,
        createdAt: new Date(),
        status: 'sending',
        type: 'audio'
      };
      
      setMessages(prev => [...prev, tempMessage]);
      
      const response = await sendMessage(
        user._id,
        'audio',
        {
          AudioData:audioData.audio,
          fileUrl: audioData.uri,
          duration: audioData.duration,
          mimeType: audioData.mimeType,
          size: audioData.size,
          fileName: audioData.fileName
        }
      );
      
     
    } catch (error) {
      console.error('Error sending audio:', error);
      setMessages(prev => prev.map(msg => 
        msg.status === 'sending' ? { ...msg, status: 'failed' } : msg
      ));
      Alert.alert('Error', 'Failed to send audio message');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendLocation = async (locationData) => {
    if (!sendMessage) return;
    
    try {
      setIsSending(true);
      
      const locationUrl = `https://www.google.com/maps/search/?api=1&query=${locationData.latitude},${locationData.longitude}`;
      
      const tempMessage = {
        _id: Date.now().toString(),
        text: 'My location',
        location: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          url: locationUrl
        },
        sender: userId,
        receiver: user._id,
        createdAt: new Date(),
        status: 'sending',
        type: 'location'
      };
      
      setMessages(prev => [...prev, tempMessage]);
      
      const response = await sendMessage(
        user._id,
        'location',
        {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          url: locationUrl
        }
      );
      
    } catch (error) {
      console.error('Error sending location:', error);
      setMessages(prev => prev.map(msg => 
        msg.status === 'sending' ? { ...msg, status: 'failed' } : msg
      ));
      Alert.alert('Error', 'Failed to send location');
    } finally {
      setIsSending(false);
    }
  };

  const handleEditMessage = (message) => {
    setSelectedMessage(message);
    setShowOptions(true);
  };

  const handleEdit = () => {
    setEditingMessage(selectedMessage);
    setNewMessage(selectedMessage?.text || '');
    setShowOptions(false);
  };

  const handleDelete = () => {
    setShowOptions(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteMessage && selectedMessage?._id) {
        await deleteMessage(selectedMessage._id);
      }
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.message,
      item.sender === userId ? styles.sentMessage : styles.receivedMessage,
      item.status === 'failed' && styles.failedMessage
    ]}>
      {item.type === 'location' ? (
        <TouchableOpacity 
          onPress={() => {
            const url = item.location?.url || 
              `https://www.google.com/maps/search/?api=1&query=${item.location?.latitude},${item.location?.longitude}`;
            Linking.openURL(url).catch(err => {
              console.error('Failed to open URL:', err);
              Alert.alert('Error', 'Could not open map');
            });
          }}
        >
          <Text style={[
            item.sender === userId ? styles.sentMessageText : styles.messageText,
            { color: '#007AFF', textDecorationLine: 'underline' }
          ]}>
            View Location on Map
          </Text>
        </TouchableOpacity>
      ) : item.type === 'audio' ? (
        <View style={styles.audioMessageContainer}>

          <AudioPlayer 
            audioData={item.audio}
          />
        </View>
      ) : (
        <Text style={item.sender === userId ? styles.sentMessageText : styles.messageText}>
          {item.text}
        </Text>
      )}
      <View style={styles.messageFooter}>
        <Text style={item.sender === userId ? styles.sentTimeText : styles.timeText}>
          {moment(item.createdAt).format('h:mm A')}
          {item.isEdited && ' • Edited'}
        </Text>
        {item.sender === userId && (
          <View style={styles.messageActions}>
            {item.status === 'failed' ? (
              <MaterialIcons name="error" size={16} color="red" />
            ) : (
              <>
                {item.status === 'viewed' || onlineUsers.includes(item.receiver) ? (
                  <MaterialIcons name="done-all" size={16} color={item.status === 'viewed' ? 'blue' : '#ccc'} />
                ) : (
                  <MaterialIcons name="done" size={16} color="#ccc" />
                )}
              </>
            )}
            {item.type === 'text' && (
              <TouchableOpacity 
                onPress={() => handleEditMessage(item)}
                style={styles.editButton}
              >
                <MaterialIcons name="more-vert" size={16} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View> 
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.select({ ios: 90, android: 50 })}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerText}>{user.name || 'Unknown User'}</Text>
            <Text style={styles.statusText}>
              {onlineUsers.includes(user._id) ? 'Online' : 'Offline'}
              {typingUsers.includes(user._id) && ' • typing...'}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item._id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        <MessageInput
          value={newMessage}
          onChangeText={setNewMessage}
          onSend={handleSend}
          onSendAudio={handleSendAudio}
          onSendLocation={handleSendLocation}
          isSending={isSending}
          placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
          isEditing={!!editingMessage}
          onCancelEdit={() => {
            setEditingMessage(null);
            setNewMessage('');
          }}
          maxLength={maxWord}
          buttonColor="#007AFF"
          style={{
            borderTopWidth: 1,
            borderTopColor: '#eee',
            backgroundColor: '#fff'
          }}
        />

        {newMessage.length > maxWord && (
          <Text style={styles.errorText}>Message limit is {maxWord} characters</Text>
        )}

        <Modal visible={showOptions} transparent animationType="fade" onRequestClose={() => setShowOptions(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowOptions(false)}>
            <View style={styles.optionsContainer}>
              <TouchableOpacity onPress={handleEdit} style={styles.optionButton}>
                <MaterialIcons name="edit" size={20} color="#007AFF" />
                <Text style={styles.optionText}>Edit Message</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.optionButton}>
                <MaterialIcons name="delete" size={20} color="red" />
                <Text style={[styles.optionText, { color: 'red' }]}>Delete Message</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity onPress={() => setShowOptions(false)} style={styles.optionButton}>
                <Text style={styles.cancelOptionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        <Modal visible={showDeleteConfirm} transparent animationType="fade">
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmContainer}>
              <Text style={styles.confirmTitle}>Delete Message?</Text>
              <Text style={styles.confirmText}>This message will be deleted for everyone.</Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity 
                  style={styles.confirmButton} 
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={styles.confirmButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.confirmButton, styles.deleteButton]} 
                  onPress={confirmDelete}
                >
                  <Text style={[styles.confirmButtonText, { color: 'white' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerInfo: {
    marginLeft: 15,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    padding: 15,
  },
  message: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    borderBottomRightRadius: 0,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 0,
  },
  failedMessage: {
    backgroundColor: '#ffebee',
  },
  sentMessageText: {
    color: 'black',
    fontSize: 16,
  },
  messageText: {
    color: 'black',
    fontSize: 16,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  sentTimeText: {
    color: 'black',
    fontSize: 12,
  },
  timeText: {
    color: 'black',
    fontSize: 12,
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  editButton: {
    marginLeft: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  optionsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 40,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  optionText: {
    marginLeft: 10,
    fontSize: 16,
  },
  cancelOptionText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
  },
  confirmOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  confirmContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 20,
    padding: 20,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  confirmText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  confirmButton: {
    padding: 10,
    marginLeft: 15,
  },
  deleteButton: {
    backgroundColor: 'red',
    borderRadius: 5,
    paddingHorizontal: 15,
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  audioMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
});

export default ChatScreen;