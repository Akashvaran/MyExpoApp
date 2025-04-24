import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';
import { SocketContext } from './SocketContext';
import AddGroupMember from './AddGroupMember';

const GroupInfoModal = ({
  visible,
  onClose,
  group: initialGroup,
  userId,
  navigation,
}) => {
  const [showMembers, setShowMembers] = useState(false);
  const [showMemberActions, setShowMemberActions] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState(null);
  const [group, setGroup] = useState(initialGroup);
  
  const { 
    promoteToAdmin, 
    removeGroupMember, 
    leaveGroup, 
    addGroupMember,
    transferOwnership,
    deleteGroup
  } = useContext(SocketContext);

  useEffect(() => {
    setGroup(initialGroup);
  }, [initialGroup]);

  const members = group?.members || [];
  const currentUser = members.find(m => m.user?._id === userId);
  const currentUserRole = currentUser?.role;
  const isOwner = currentUserRole === 'owner';
  const isAdmin = currentUserRole === 'admin' || isOwner;

  const getRandomColor = (id) => {
    const colors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#E91E63'];
    const index = id?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  const handleLeaveGroup = () => {
    if (isOwner) {
      Alert.alert(
        'Cannot Leave Group',
        'You are the owner. Please transfer ownership before leaving.',
        [{ text: 'OK' }]
      );
      return;
    }
  
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          onPress: () => {
            leaveGroup(group._id, userId); 
            onClose();
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleTransferOwnership = () => {
    if (!selectedNewOwner) return;
    
    Alert.alert(
      'Transfer Ownership',
      `Are you sure you want to transfer ownership to ${selectedNewOwner.user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Transfer', 
          onPress: () => {
            transferOwnership(group._id, selectedNewOwner.user._id);
            setShowTransferModal(false);
            setSelectedNewOwner(null);
          }
        }
      ]
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to permanently delete this group? All messages will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteGroup(group._id);
            onClose();
            navigation.goBack();
          }
        }
      ]
    );
  };

  const showMemberActionModal = (member) => {
    setSelectedMember(member);
    setShowMemberActions(true);
  };

  const handlePromoteToAdmin = () => {
    if (!selectedMember) return;
    
    if (!isOwner) {
      Alert.alert('Permission Denied', 'Only the group owner can manage admin roles');
      return;
    }

    const action = selectedMember.role === 'admin' ? 'Demote from Admin' : 'Make Admin';
    
    Alert.alert(
      action,
      `Are you sure you want to ${action.toLowerCase()} ${selectedMember.user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: action, onPress: () => {
          promoteToAdmin(group._id, selectedMember.user._id);
          setShowMemberActions(false);
        }}
      ]
    );
  };

  const handleRemoveMember = () => {
    if (!selectedMember) return;
    
    if (!isOwner && !(isAdmin && selectedMember.role === 'member')) {
      Alert.alert('Permission Denied', 'You cannot remove this member');
      return;
    }

    if (selectedMember.user._id === userId) {
      Alert.alert('Cannot remove yourself', 'Use "Leave Group" instead');
      return;
    }

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${selectedMember.user.name} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', onPress: () => {
          removeGroupMember(group._id, selectedMember.user._id);
          setShowMemberActions(false);
        }}
      ]
    );
  };

  const handleAddMember = () => {
    setShowAddMemberModal(true);
  };

  const handleMemberAdded = (newMemberId) => {
    addGroupMember(group._id, newMemberId);
    setShowAddMemberModal(false);
  };

  const renderMemberItem = ({ item }) => {
    const user = item.user || {};
    const displayName = user.name || 'Unknown';
    const roleColor = item.role === 'owner' ? '#FF9800' : 
                     item.role === 'admin' ? '#4CAF50' : '#2196F3';

    const showActions = (isOwner || (isAdmin && item.role === 'member')) &&  user._id !== userId;

    return (
      <View style={styles.memberItem}>
        <View style={[styles.memberAvatar, { backgroundColor: getRandomColor(user._id) }]}>
          <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{displayName}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
            <Text style={styles.roleText}>
              {item.role === 'owner' ? 'Owner' : 
               item.role === 'admin' ? 'Admin' : 'Member'}
            </Text>
          </View>
        </View>
        {showActions && (
          <TouchableOpacity onPress={() => showMemberActionModal(item)}>
            <Icon name="more-vert" size={20} color="#9E9E9E" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
      <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
        <View style={styles.fullscreenModal}>
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>

          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Icon name="close" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Group Info</Text>
              <View style={styles.closeButton} />
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.groupHeader}>
                <View style={[styles.groupAvatar, { backgroundColor: getRandomColor(group._id) }]}>
                  <Text style={styles.groupAvatarText}>{group.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupMembersCount}>{members.length} members</Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Icon name="info" size={20} color="#4CAF50" style={styles.infoIcon} />
                  <View>
                    <Text style={styles.infoLabel}>Description</Text>
                    <Text style={styles.infoValue}>{group.description || 'No description'}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Icon name="event" size={20} color="#4CAF50" style={styles.infoIcon} />
                  <View>
                    <Text style={styles.infoLabel}>Created on</Text>
                    <Text style={styles.infoValue}>
                      {moment(group.createdAt).format('MMMM D, YYYY')}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Icon name="person" size={20} color="#4CAF50" style={styles.infoIcon} />
                  <View>
                    <Text style={styles.infoLabel}>Created by</Text>
                    <Text style={styles.infoValue}>{group.createdBy?.name || 'Unknown'}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setShowMembers(!showMembers)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitle}>Members</Text>
                <Icon
                  name={showMembers ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                  size={24}
                  color="#4CAF50"
                />
              </TouchableOpacity>

              {showMembers && (
                <View style={styles.membersCard}>
                  <FlatList
                    data={members}
                    keyExtractor={(item) => item._id || item.user?._id}
                    renderItem={renderMemberItem}
                    scrollEnabled={false}
                  />
                </View>
              )}

              {isAdmin && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#2196F3', marginBottom: 10 }]}
                  onPress={handleAddMember}
                >
                  <Text style={styles.buttonText}>Add Member</Text>
                </TouchableOpacity>
              )}

              {isOwner && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#FF9800', marginBottom: 10 }]}
                    onPress={() => setShowTransferModal(true)}
                  >
                    <Text style={styles.buttonText}>Transfer Ownership</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#F44336', marginBottom: 10 }]}
                    onPress={() => setShowDeleteGroupModal(true)}
                  >
                    <Text style={styles.buttonText}>Delete Group</Text>
                  </TouchableOpacity>
                </>
              )}

              {!isOwner && (
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#F44336' }]} 
                  onPress={handleLeaveGroup}
                >
                  <Text style={styles.buttonText}>Leave Group</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTransferModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTransferModal(false)}
      >
        <View style={styles.centeredModal}>
          <View style={styles.memberActionsModal}>
            <Text style={styles.memberActionsTitle}>Select New Owner</Text>
            
            <FlatList
              data={members.filter(m => m.user._id !== userId)}
              keyExtractor={(item) => item._id || item.user?._id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.memberItem, 
                    selectedNewOwner?.user._id === item.user._id && styles.selectedItem
                  ]}
                  onPress={() => setSelectedNewOwner(item)}
                >
                  <View style={[styles.memberAvatar, { backgroundColor: getRandomColor(item.user._id) }]}>
                    <Text style={styles.avatarText}>{item.user.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.memberName}>{item.user.name}</Text>
                  {selectedNewOwner?.user._id === item.user._id && (
                    <Icon name="check" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              )}
              style={styles.memberList}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#9E9E9E' }]}
                onPress={() => setShowTransferModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
                onPress={handleTransferOwnership}
                disabled={!selectedNewOwner}
              >
                <Text style={styles.buttonText}>Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteGroupModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteGroupModal(false)}
      >
        <View style={styles.centeredModal}>
          <View style={styles.confirmContainer}>
            <Text style={styles.confirmTitle}>Delete Group?</Text>
            <Text style={styles.confirmText}>
              This will permanently delete the group and all its messages. 
              This action cannot be undone.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => setShowDeleteGroupModal(false)}
              >
                <Text style={styles.confirmButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.deleteButton]}
                onPress={handleDeleteGroup}
              >
                <Text style={[styles.confirmButtonText, { color: 'white' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showMemberActions}
        onRequestClose={() => setShowMemberActions(false)}
      >
        <View style={styles.centeredModal}>
          <View style={styles.memberActionsModal}>
            <Text style={styles.memberActionsTitle}>
              {selectedMember?.user?.name || 'Member'} Actions
            </Text>
            
            {isOwner && selectedMember?.role !== 'owner' && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handlePromoteToAdmin}
              >
                <Text style={styles.buttonText}>
                  {selectedMember?.role === 'admin' ? 'Demote to Member' : 'Promote to Admin'}
                </Text>
              </TouchableOpacity>
            )}
            
            {(isOwner || (isAdmin && selectedMember?.role === 'member')) && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                onPress={handleRemoveMember}
              >
                <Text style={styles.buttonText}>Remove from Group</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#9E9E9E' }]}
              onPress={() => setShowMemberActions(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddMemberModal}
        animationType="slide"
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <AddGroupMember
          groupId={group._id}
          onMemberAdded={handleMemberAdded}
          navigation={navigation}
          groupMembers={members}
          onClose={() => setShowAddMemberModal(false)}
        />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fullscreenModal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#4CAF50',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    width: 24,
  },
  modalContent: {
    padding: 20,
  },
  groupHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  groupAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupAvatarText: {
    fontSize: 36,
    color: '#FFF',
    fontWeight: 'bold',
  },
  groupName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  groupMembersCount: {
    fontSize: 16,
    color: '#757575',
  },
  infoCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  membersCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  roleText: {
    fontSize: 12,
    color: '#FFF',
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  centeredModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  memberActionsModal: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  memberActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  confirmContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    width: '80%',
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
    color: '#616161',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  confirmButtonText: {
    fontWeight: 'bold',
  },
  selectedItem: {
    backgroundColor: '#E3F2FD',
  },
  memberList: {
    maxHeight: 300,
    width: '100%',
    marginVertical: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
});

export default GroupInfoModal;