import React, { useEffect, useState, useContext, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SocketContext } from './SocketContext';
import { AuthContext } from '../productedRoute/AuthanticationContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const UserDetails = () => {
  const navigation = useNavigation();
  const { 
    onlineUsers, 
    typingUsers, 
    notifications, 
    allUsers,
    inactiveUsers,
    groups,
    fetchUserGroups,
    fetchUserList,
    fetchUnreadMessages
  } = useContext(SocketContext);
  const { userId } = useContext(AuthContext);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        try {
          await Promise.all([
            fetchUserList(),
            fetchUnreadMessages(),
            fetchUserGroups()
          ]);
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchUserList(),
        fetchUnreadMessages(),
        fetchUserGroups()
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getUnreadCount = (userId) => {
    return notifications.filter(n => n.senderId === userId).length;
  };

  const getUserStatus = (userId) => {
    if (inactiveUsers.includes(userId)) return 'inactive';
    if (onlineUsers.includes(userId)) return 'online';
    return 'offline';
  };

  const renderUserItem = ({ item }) => {
    const unreadCount = getUnreadCount(item._id);
    const status = getUserStatus(item._id);
    const isTyping = typingUsers.includes(item._id);
    const isCurrentUser = item._id === userId;

    return (
      <TouchableOpacity
        style={[
          styles.item,
          unreadCount > 0 && styles.unreadItem
        ]}
        onPress={() => navigation.navigate('Chat', { 
          user: item,
          status 
        })}
        activeOpacity={0.8}
      >
        <View style={styles.leftSection}>
          <View style={styles.userIconContainer}>
            <Icon name="person" size={28} color="#555" />
            {status === 'online' && <View style={styles.onlineBadge} />}
            {status === 'inactive' && <View style={styles.inactiveBadge} />}
          </View>

          <View style={styles.userInfo}>
            <Text style={[
              styles.name,
              unreadCount > 0 && styles.unreadName
            ]}>
              {item.name} {isCurrentUser && '(You)'}
            </Text>
            {isTyping ? (
              <Text style={styles.typingText}>Typing...</Text>
            ) : (
              <Text style={styles.statusText}>
                {status === 'online' ? 'Online' : status === 'inactive' ? 'Inactive' : 'Offline'}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.rightSection}>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
          <Icon name="chevron-right" size={24} color="#999" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroupItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('GroupChat', { 
          group: item 
        })}
        activeOpacity={0.8}
      >
        <View style={styles.leftSection}>
          <View style={styles.groupIconContainer}>
            <Icon name="group" size={28} color="#555" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.statusText}>
              {item.members?.length } members
            </Text>
          </View>
        </View>
        <Icon name="chevron-right" size={24} color="#999" />
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (title) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[
          { type: 'header', title: 'Groups' },
          ...(groups).map(group => ({ type: 'group', ...group })),
          { type: 'header', title: 'Users' },
          ...allUsers.map(user => ({ type: 'user', ...user }))
        ]}
        keyExtractor={(item, index) => 
          item.type === 'header' ? `header-${item.title}` : item._id || `item-${index}`
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return renderSectionHeader(item.title);
          }
          return item.type === 'group' ? 
            renderGroupItem({ item }) : 
            renderUserItem({ item });
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    marginTop: 70
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContent: {
    paddingBottom: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  unreadItem: {
    backgroundColor: '#e8f5e9',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  groupIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  inactiveBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFC107',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  unreadName: {
    fontWeight: '700',
    color: '#000',
  },
  statusText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  typingText: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionHeader: {
    padding: 12,
    paddingBottom: 4,
    backgroundColor: '#f9f9f9',
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
});

export default UserDetails;