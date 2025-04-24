import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '../productedRoute/AuthanticationContext';
import Axios from '../axios/Axios';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { userId } = useContext(AuthContext);
  const [socket, setSocket] = useState(null); 
  const [onlineUsers, setOnlineUsers] = useState([]); 
  const [typingUsers, setTypingUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupNotifications, setGroupNotifications] = useState([]);

  console.log(groups)
  


  useEffect(() => {
    if (!userId) return;

    const newSocket = io(process.env.EXPO_PUBLIC_API_URL, {
      transports: ['websocket'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const onConnect = () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      newSocket.emit('registerUser', userId);
      fetchInitialData();
    };

    const onDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    };

    const onConnectError = (err) => {
      console.error('Socket connection error:', err);
      setIsConnected(false);
    };

    newSocket.on('connect', onConnect);
    newSocket.on('disconnect', onDisconnect);
    newSocket.on('connect_error', onConnectError);

    setSocket(newSocket);

    return () => {
      newSocket.off('connect', onConnect);
      newSocket.off('disconnect', onDisconnect);
      newSocket.off('connect_error', onConnectError);
      newSocket.disconnect();
    };
  }, [userId]);

  const fetchInitialData = async () => {
    try {
      await Promise.all([
        fetchUserList(),
        fetchUnreadMessages(),
        fetchUserGroups(),
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleUserOnline = (users) => {
      setOnlineUsers(users);
    };

    const handleUserOffline = (offlineUserId) => {
      setOnlineUsers(prev => prev.filter(id => id !== offlineUserId));
    };

    const handleTyping = (senderId) => {
      setTypingUsers(prev => [...prev, senderId]);
    
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(id => id !== senderId));
      }, 2000);
    };

  
    const handleNewGroupMessage = (messageData) => {
      if (messageData.sender._id === userId) return;
      
      setGroupNotifications(prev => [...prev, {
        groupId: messageData.group._id,
        senderId: messageData.sender._id,
        message: messageData.message,
        createdAt: new Date()
      }]);
    };

    const handleNewMessage = (messageData) => {
      setNotifications(prev => [...prev, {
        senderId: messageData.sender,
        message: messageData.message,
        status: messageData.status || 'delivered',
        createdAt: new Date()
      }]);
    };
    const handleGroupMessagesRead = ({ groupId }) => {
      setGroupNotifications(prev => prev.filter(n => n.groupId !== groupId));
    };

    const handleUserListUpdate = (updatedUsers) => {
      setAllUsers(updatedUsers);
    };

    const handleUserStatusChange = (statusData) => {
      if (statusData.status === 'inactive') {
        setInactiveUsers(prev => [...prev, statusData.userId]);
      } else {
        setInactiveUsers(prev => prev.filter(id => id !== statusData.userId));
      }
    };

    const handleMessagesRead = ({ sender, receiver }) => {
      if (receiver === userId) {
        setNotifications(prev => prev.filter(n => n.senderId !== sender));
      }
    };

    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);
    socket.on('typing-server', handleTyping);
    socket.on('newMessage', handleNewMessage);
    socket.on('userListUpdate', handleUserListUpdate);
    socket.on('userStatusChange', handleUserStatusChange);
    socket.on('newGroupMessage', handleNewGroupMessage);
    socket.on('groupMessagesRead', handleGroupMessagesRead);

    return () => {
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
      socket.off('typing-server', handleTyping);
      socket.off('newMessage', handleNewMessage);
      socket.off('userListUpdate', handleUserListUpdate);
      socket.off('userStatusChange', handleUserStatusChange);
      socket.off('messagesRead', handleMessagesRead);
      socket.on('newGroupMessage', handleNewGroupMessage);
      socket.on('groupMessagesRead', handleGroupMessagesRead);
    };
  }, [socket, userId]);

  const fetchUserList = async () => {
    try {
      const response = await Axios.get('/auth/getuser');
      setAllUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch user list:', error);
    }
  };

  const fetchUserGroups = async () => {
    try {
      const response = await Axios.get(`/groups/${userId}`);
      const groupsData = response.data.data?.groups;
      setGroups(groupsData);

    } catch (error) {
      console.error('Failed to fetch groups and members:', error);
      setGroups([]);
      setGroupMembers([]);
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      const response = await Axios.get(`/chat/unread/${userId}`);
      const formattedNotifications = response.data.map(msg => ({
        senderId: msg.sender,
        message: msg.message,
        status: 'delivered',
        createdAt: msg.createdAt
      }));
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };


  const sendMessage = (receiverId, message, audioData) => {
    if (socket && message.trim()) {
      socket.emit('sendMessage', {
        sender: userId,
        receiver: receiverId,
        message,
        audioData: audioData,
        timestamp: new Date().toISOString()
      });
    }
  };

  const editMessage = (messageId, newText) => {
    if (socket) {
      socket.emit('editMessage', { 
        messageId,
        newText,
        sender: userId,
      });
    }
  };

  const deleteMessage = (messageId) => {
    if (socket) {
      socket.emit('deleteMessage', { 
        messageId,
        sender: userId,
      });
      return true;
    }
    return false;
  };
  
  const startTyping = (receiverId) => {
    if (socket) {
      socket.emit('typing', { sender: userId, receiver: receiverId });
    }
  };

  const stopTyping = (receiverId) => {
    if (socket) {
      socket.emit('stopTyping', { sender: userId, receiver: receiverId });
    }
  };
  

  
  const markAsRead = (senderId) => {
    if (socket) {
      socket.emit('markAsRead', {
        sender: senderId,
        receiver: userId
      });
      setNotifications(prev => prev.filter(n => n.senderId !== senderId));
    }
  };
  const fetchGroupMessages = async () => {
      try {
        setLoading(true);
        const response = await Axios.get(`/groups/${group._id}/messages`);
        setMessages(response.data.messages);
      } catch (error) {
        Alert.alert('Error', 'Failed to load group messages');
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };
  

  const addGroupMember = (groupId, newMemberId) => {  
    if (socket) {
      socket.emit('addGroupMember', {
        groupId,
        newMemberId,
        requestingUserId: userId
      });
    }
  };

  const promoteToAdmin = (groupId, memberId) => { 
    if (socket) {
      const group = groups.find(g => g._id === groupId); 
      if (group) {
        const member = group.members.find(m => m.user?._id === memberId);
        if (member) {
          member.role = 'admin';
          console.log('Updated member:', member);
        }
      }      
      
      socket.emit('promoteToAdmin', {
        groupId,
        memberId,
        requestingUserId: userId
      });
    }
  };

  const removeGroupMember = (groupId, memberId) => {
    if (socket) {
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group._id === groupId 
            ? {
                ...group,
                members: group.members.filter(m => m.user._id !== memberId)
              }
            : group
        )
      );    
      
      socket.emit('removeGroupMember', {
        groupId,
        memberId,
        requestingUserId: userId
      });
    }
  };
  const leaveGroup = (groupId, userId) => {
    if (socket) {
      socket.emit("leaveGroup", { 
        groupId,
        userId 
      });
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group._id === groupId
            ? {
                ...group,
                members: group.members.filter(m => m.user._id !== userId)
              }
            : group
        )
      );
    }
  };

  const transferOwnership = (groupId, newOwnerId) => {
    if (socket) {
      socket.emit('transferOwnership', {
        groupId,
        newOwnerId,
        requestingUserId: userId
      });
      
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group._id === groupId
            ? {
                ...group,
                createdBy: newOwnerId,
                members: group.members.map(member => {
                  if (member.user._id === newOwnerId) {
                    return { ...member, role: 'owner' };
                  }
                  if (member.user._id === userId) {
                    return { ...member, role: 'admin' };
                  }
                  return member;
                })
              }
            : group
        )
      );
    }
  };
  
  const deleteGroup = (groupId) => {
    if (socket) {
      socket.emit('deleteGroup', {
        groupId,
        requestingUserId: userId
      });
      
      setGroups(prevGroups => prevGroups.filter(g => g._id !== groupId));
    }
  };
  

  return (
    <SocketContext.Provider value={{ 
      socket,
      groups,
      fetchUserGroups,
      onlineUsers,
      typingUsers,
      notifications,
      allUsers,
      inactiveUsers,
      isConnected,
      fetchUserList,
      fetchUnreadMessages,
      sendMessage,
      editMessage,
      deleteMessage,
      startTyping,
      stopTyping,
      markAsRead,
      fetchGroupMessages,
      addGroupMember,
      promoteToAdmin,
      removeGroupMember,
      leaveGroup,
      groupNotifications,
      transferOwnership,
      deleteGroup
    }}>
      {children}
    </SocketContext.Provider>
  );
};