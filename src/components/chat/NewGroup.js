import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Button, 
  Alert, 
  ScrollView 
} from 'react-native';
import Axios from '../axios/Axios';
import { SocketContext } from './SocketContext';
import { AuthContext } from '../productedRoute/AuthanticationContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const NewGroup = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { userId } = useContext(AuthContext);
  const { allUsers } = useContext(SocketContext);
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    const filtered = allUsers.filter(user => 
      user._id !== userId && !selectedUsers.some(selected => selected._id === user._id)
    );
    setFilteredUsers(filtered);
  }, [allUsers, selectedUsers, userId]);

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => 
      prev.some(u => u._id === user._id)
        ? prev.filter(u => u._id !== user._id)
        : [...prev, user]
    );
  };

  const removeSelectedUser = (userId) => {
    setSelectedUsers(prev => prev.filter(user => user._id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one member');
      return;
    }

    try {
      setLoading(true);
      const memberIds = selectedUsers.map(user => user._id);
      
      const response = await Axios.post('/groups/create', {
        name: groupName,
        description: groupDescription,
        members: memberIds,
        createdBy: userId
      });

      navigation.goBack();
      navigation.navigate('main');
    } catch (error) {
      console.error('Error creating group:', error);      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        selectedUsers.some(user => user._id === item._id) && styles.selectedUser
      ]}
      onPress={() => toggleUserSelection(item)}
    >
      <Text style={styles.userName}>{item.name}</Text>
      {selectedUsers.some(user => user._id === item._id) && (
        <Icon name="check" size={20} color="#4CAF50" />
      )}
    </TouchableOpacity>
  );

  const renderSelectedUser = ({ item }) => (
    <View style={styles.selectedUserTag}>
      <Text style={styles.selectedUserName}>{item.name}</Text>
      <TouchableOpacity onPress={() => removeSelectedUser(item._id)}>
        <Icon name="close" size={18} color="#666" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {step === 1 && (
        <>
          <Text style={styles.title}>Select Group Members</Text>
          {selectedUsers.length > 0 && (
            <View style={styles.selectedUsersContainer}>
              <Text style={styles.selectedUsersTitle}>Selected Members:</Text>
              <FlatList
                horizontal
                data={selectedUsers}
                keyExtractor={item => item._id}
                renderItem={renderSelectedUser}
                contentContainerStyle={styles.selectedUsersList}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          <FlatList
            data={filteredUsers}
            keyExtractor={item => item._id}
            renderItem={renderUserItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No users available to add</Text>
            }
          />

          <View style={styles.bottomButtonContainer}>
            <Button 
              title={`Next (${selectedUsers.length} selected)`} 
              onPress={() => setStep(2)} 
              disabled={selectedUsers.length === 0}
              color="#4CAF50"
            />
          </View>
        </>
      )}

      {step === 2 && (
        <ScrollView contentContainerStyle={styles.step2Container}>
          <Text style={styles.title}>Group Details</Text>

          <TextInput
            style={styles.input}
            placeholder="Group Name *"
            value={groupName}
            onChangeText={setGroupName}
          />
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Description (optional)"
            value={groupDescription}
            onChangeText={setGroupDescription}
            multiline
          />
          
          <View style={styles.buttonContainer}>
            <Button 
              title="Back" 
              onPress={() => setStep(1)} 
              color="#666"
            />
            <Button 
              title={loading ? "Creating..." : "Create Group"} 
              onPress={handleCreateGroup} 
              disabled={!groupName.trim() || loading}
              color="#4CAF50"
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginTop: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 80, 
  },
  userItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedUser: {
    backgroundColor: '#e8f5e9',
  },
  userName: {
    fontSize: 16,
  },
  selectedUsersContainer: {
    marginBottom: 16,
  },
  selectedUsersTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  selectedUsersList: {
    paddingBottom: 8,
  },
  selectedUserTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  selectedUserName: {
    marginRight: 4,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  step2Container: {
    paddingBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 16,
    borderRadius: 4,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  selectedPreview: {
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  previewMember: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    marginBottom: 4,
  },
  previewMemberName: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
});

export default NewGroup;