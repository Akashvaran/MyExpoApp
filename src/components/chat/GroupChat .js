import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Pressable,
  Alert,
  Linking,
  TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Axios from '../axios/Axios';
import { AuthContext } from '../productedRoute/AuthanticationContext';
import { SocketContext } from './SocketContext';
import moment from 'moment';
import GroupInfoModal from './GroupInfoModal';
import MessageInput from './MessageInput';
import AudioPlayer from './AudioPlayer';

const GroupChat = ({ route, navigation }) => {
  const { group } = route.params;
  const { userId } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteForEveryone, setDeleteForEveryone] = useState(false);
  const flatListRef = useRef(null);
  console.log(messages);

  const fetchGroupMessages = async () => {
    try {
      setLoading(true);
      const response = await Axios.get(`/groups/${group._id}/messages`);
      const formattedMessages = response.data.messages.map(msg => ({
        ...msg,
        isDeleted: msg.deletedFor?.includes(userId) || false
      }));
      setMessages(formattedMessages.reverse());
    } catch (error) {
      Alert.alert('Error', 'Failed to load group messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!group?._id) return;
    fetchGroupMessages();
  }, [group?._id]);

  useEffect(() => {
    if (!socket || !group?._id) return;

    socket.emit('joinGroup', { groupId: group._id, userId });

    const handleNewMessage = (message) => {
      setMessages(prev => {
        if (message.tempId) {
          return prev.map(m => m.tempId === message.tempId ? {
            ...message,
            isDeleted: message.deletedFor?.includes(userId) || false
          } : m);
        }
        if (!prev.some(m => m._id === message._id)) {
          return [...prev, {
            ...message,
            isDeleted: message.deletedFor?.includes(userId) || false
          }];
        }
        return prev;
      });
      
      if (message.sender._id !== userId) {
        markMessageAsRead(message._id);
      }
      scrollToBottom();
    };

    const handleMessageUpdate = (updatedMessage) => {
      setMessages(prev => prev.map(msg =>
        msg._id === updatedMessage._id ? {
          ...updatedMessage,
          isDeleted: updatedMessage.deletedFor?.includes(userId) || false
        } : msg
      ));
    };

    const handleMessageDelete = ({ messageId, deletedFor }) => {
      if (deletedFor === 'all') {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      } else {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, isDeleted: true }
            : msg
        ));
      }
    };

    const handleMemberRemoved = ({ memberId }) => {
      if (memberId === userId) {
        Alert.alert('Removed', 'You have been removed from the group', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    };

    const handleGroupUpdated = (updatedGroup) => {
      if (updatedGroup._id === group._id) {
        navigation.setParams({ group: updatedGroup });
      }
    };

    socket.on('newGroupMessage', handleNewMessage);
    socket.on('groupMessageUpdated', handleMessageUpdate);
    socket.on('groupMessageDeleted', handleMessageDelete);
    socket.on('memberRemoved', handleMemberRemoved);
    socket.on('groupUpdated', handleGroupUpdated);

    return () => {
      socket.emit('leaveGroup', { groupId: group._id, userId });
      socket.off('newGroupMessage', handleNewMessage);
      socket.off('groupMessageUpdated', handleMessageUpdate);
      socket.off('groupMessageDeleted', handleMessageDelete);
      socket.off('memberRemoved', handleMemberRemoved);
      socket.off('groupUpdated', handleGroupUpdated);
    };
  }, [socket, group?._id, userId, navigation]);

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const markMessageAsRead = (messageId) => {
    if (socket) {
      socket.emit('markGroupMessageAsRead', {
        messageId,
        groupId: group._id,
        userId
      });
    }
  };

  const createTempMessage = (content, type, additionalProps = {}) => {
    return {
      tempId: Date.now().toString(),
      content,
      type,
      sender: { _id: userId, name: 'You' },
      createdAt: new Date().toISOString(),
      isDeleted: false,
      isEdited: false,
      ...additionalProps
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      
      if (editingMessage) {
        setMessages(prev => prev.map(msg =>
          msg._id === editingMessage._id 
            ? { ...msg, content: newMessage.trim(), isEdited: true }
            : msg
        ));
        
        const messageData = {
          messageId: editingMessage._id,
          groupId: group._id,
          senderId: userId,
          content: newMessage.trim()
        };
        socket.emit('updateGroupMessage', messageData);
        setEditingMessage(null);
      } else {
        const tempMessage = createTempMessage(newMessage.trim(), 'text');
        setMessages(prev => [...prev, tempMessage]);
        scrollToBottom();

        const messageData = {
          groupId: group._id,
          senderId: userId,
          type: 'text',
          content: newMessage.trim(),
          tempId: tempMessage.tempId
        };
        socket.emit('sendGroupMessage', messageData);
      }
      setNewMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
  
      if (!editingMessage) {
        setMessages(prev => prev.filter(m => m.tempId !== tempMessage.tempId));
      }
    } finally {
      setSending(false);
    }
  };

  const handleSendAudio = async (audioData) => {
    console.log(audioData);
    
    try {
      setSending(true);
      
      const tempMessage = createTempMessage(null, 'audio', { audio: audioData });
      setMessages(prev => [...prev, tempMessage]);
      scrollToBottom();

      const messageData = {
        groupId: group._id,
        senderId: userId,
        type: 'audio',
        content: {
          AudioData:audioData.audio,
          fileUrl: audioData.uri,
          duration: audioData.duration,
          mimeType: audioData.mimeType,
          size: audioData.size,
          fileName: audioData.fileName
        },
        tempId: tempMessage.tempId
      };
      console.log(messageData)
      socket.emit('sendGroupMessage', messageData);
    } catch (error) {
      Alert.alert('Error', 'Failed to send audio message');

      setMessages(prev => prev.filter(m => m.tempId !== tempMessage.tempId));
    } finally {
      setSending(false);
    }
  };

  const handleSendLocation = (locationData) => {
  try {
    setSending(true);
    
    const tempMessage = createTempMessage({
      latitude: locationData.latitude,
      longitude: locationData.longitude
    }, 'location');
    
    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    const messageData = {
      groupId: group._id,
      senderId: userId,
      type: 'location',
      content: {
        latitude: locationData.latitude,
        longitude: locationData.longitude
      },
      tempId: tempMessage.tempId
    };
    
    socket.emit('sendGroupMessage', messageData);
  } catch (error) {
    Alert.alert('Error', 'Failed to send location');
    setMessages(prev => prev.filter(m => m.tempId !== tempMessage.tempId));
  } finally {
    setSending(false);
  }
};

  const handleMessageOptions = (message) => {
    setSelectedMessage(message);
    setShowMessageOptions(true);
  };

  const handleEdit = () => {
    if (!selectedMessage) return;
    setEditingMessage(selectedMessage);
    setNewMessage(
      typeof selectedMessage.content === 'string' 
        ? selectedMessage.content 
        : selectedMessage.content?.text || ''
    );
    setShowMessageOptions(false);
  };

  const handleDeleteOption = (forEveryone = false) => {
    setDeleteForEveryone(forEveryone);
    setShowMessageOptions(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedMessage) return;
    try {
      if (deleteForEveryone) {
        socket.emit('deleteGroupMessageForEveryone', { 
          messageId: selectedMessage._id,
          groupId: group._id,
          userId 
        });
      } else {
        socket.emit('deleteGroupMessageForMe', { 
          messageId: selectedMessage._id,
          groupId: group._id,
          userId 
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete message');
    } finally {
      setShowDeleteConfirm(false);
      setSelectedMessage(null);
    }
  };

  const getMessageContent = (message) => {
    if (message.isDeleted) return null;
    
    if (typeof message.content === 'string') {
      return message.content;
    }
    
    if (typeof message.content === 'object' && message.content !== null) {
      return message.content.text || '';
    }
    
    return message.message || '';
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.sender._id === userId;
    const isDeleted = item.isDeleted;
    const messageTime = moment(item.createdAt).format('h:mm A');
    const messageContent = getMessageContent(item);
    const isLocationMessage = typeof messageContent === 'string' && messageContent.startsWith('My location:');
    
    if (isDeleted) {
      return (
        <View style={[styles.messageContainer, styles.deletedMessage]}>
          <Text style={styles.deletedMessageText}>Message deleted</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity 
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
        ]}
        onLongPress={() => isCurrentUser && handleMessageOptions(item)}
        activeOpacity={0.7}
      >
        {!isCurrentUser && (
          <Text style={styles.senderName}>{item.sender.name}</Text>
        )}
        
        {isLocationMessage ? (
          <TouchableOpacity 
            onPress={() => {
              const url = messageContent.split('My location:')[1].trim();
              Linking.openURL(url).catch(err => {
                Alert.alert('Error', 'Could not open map');
              });
            }}
          >
            <Text style={[
              styles.messageText,
              { color: '#4CAF50', textDecorationLine: 'underline' }
            ]}>
              View Location on Map
            </Text>
          </TouchableOpacity>
        ) : item.type==='audio' ? (
          <View style={styles.audioMessageContainer}>
            <AudioPlayer audioData={item.audio} />
          </View>
        ) : (
          <Text style={styles.messageText}>{messageContent}</Text>
        )}
        
        <View style={styles.messageMeta}>
          <Text style={styles.timeText}>{messageTime}</Text>
          {item.isEdited && (
            <Text style={styles.editedText}>(edited)</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
          <Text style={styles.memberCount}>{group.members?.length} members</Text>
        </View>

        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setShowGroupInfo(true)}
        >
          <Icon name="more-vert" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id || item.tempId}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContainer}
        inverted={false}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputWrapper}
      >
        <MessageInput
          value={newMessage}
          onChangeText={setNewMessage}
          onSend={sendMessage}
          onSendAudio={handleSendAudio}
          onSendLocation={handleSendLocation}
          isSending={sending}
          placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
          isEditing={!!editingMessage}
          onCancelEdit={() => {
            setEditingMessage(null);
            setNewMessage('');
          }}
          buttonColor="#4CAF50"
          style={{ backgroundColor: '#FFF' }}
        />
      </KeyboardAvoidingView>

      <Modal 
        visible={showMessageOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMessageOptions(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowMessageOptions(false)}
        >
          <View style={styles.messageOptionsContainer}>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={handleEdit}
            >
              <MaterialIcons name="edit" size={20} color="#4CAF50" />
              <Text style={styles.optionText}>Edit Message</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => handleDeleteOption(false)}
            >
              <MaterialIcons name="delete" size={20} color="#FF5722" />
              <Text style={[styles.optionText, { color: '#FF5722' }]}>Delete for Me</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => handleDeleteOption(true)}
            >
              <MaterialIcons name="delete-forever" size={20} color="#F44336" />
              <Text style={[styles.optionText, { color: '#F44336' }]}>Delete for Everyone</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => setShowMessageOptions(false)}
            >
              <Text style={styles.cancelOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmContainer}>
            <Text style={styles.confirmTitle}>
              {deleteForEveryone ? 'Delete for Everyone?' : 'Delete for Me?'}
            </Text>
            <Text style={styles.confirmText}>
              {deleteForEveryone 
                ? 'This message will be deleted for all group members.' 
                : 'This message will only be deleted for you.'}
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.confirmButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Text style={[styles.confirmButtonText, { color: 'white' }]}>
                  {deleteForEveryone ? 'Delete for All' : 'Delete for Me'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
                
      <GroupInfoModal
        visible={showGroupInfo}
        onClose={() => setShowGroupInfo(false)}
        group={group}
        userId={userId}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 3,
  },
  backButton: {
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  memberCount: {
    fontSize: 12,
    color: '#E0E0E0',
  },
  infoButton: {
    marginLeft: 15,
  },
  messagesContainer: {
    padding: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  currentUserBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  otherUserBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
  },
  senderName: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  messageMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 5,
  },
  timeText: {
    fontSize: 12,
    color: '#757575',
    marginRight: 5,
  },
  editedText: {
    fontSize: 12,
    color: '#757575',
    fontStyle: 'italic',
  },
  deletedMessage: {
    backgroundColor: 'transparent',
    alignSelf: 'center',
    padding: 10,
  },
  deletedMessageText: {
    color: '#757575',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    padding: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageOptionsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    width: '80%',
    paddingVertical: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  cancelOptionText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 5,
  },
  confirmContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    width: '80%',
    padding: 20,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  audioMessageContainer: {
    width: 200,
  },
});

export default GroupChat;