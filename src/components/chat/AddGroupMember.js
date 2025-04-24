import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SocketContext } from './SocketContext';

const AddGroupMember = ({ groupId, onMemberAdded, onClose, groupMembers }) => {
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { allUsers } = useContext(SocketContext);

  useEffect(() => {
    if (allUsers && groupMembers) {
      const filteredUsers = allUsers.filter(user => {
        const isAlreadyInGroup = groupMembers.some(member =>member.user?._id === user._id);
        return !isAlreadyInGroup;
      });
      
      setAvailableUsers(filteredUsers);
      setLoading(false);
    }
  }, [allUsers, groupMembers, groupId]);

  const handleAddUser = (userId) => {
    onMemberAdded(userId);
    setAvailableUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
  };

  const getRandomColor = (userId) => {
    const colors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#E91E63'];
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleAddUser(item._id)}
    >
      <View style={[styles.avatar, { backgroundColor: getRandomColor(item._id) }]}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.userName}>{item.name}</Text>
      <Icon name="person-add" size={20} color="#4CAF50" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={onClose}>
          <Icon name="arrow-back" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.header}>Add Members</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
      ) : availableUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="group" size={50} color="#9E9E9E" />
          <Text style={styles.noUsersText}>No users available to add</Text>
        </View>
      ) : (
        <FlatList
          data={availableUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userName: {
    fontSize: 16,
    flex: 1,
    color: '#333',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noUsersText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default AddGroupMember; 