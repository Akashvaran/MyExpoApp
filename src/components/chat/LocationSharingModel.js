import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Linking,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as IntentLauncher from 'expo-intent-launcher';

const LocationSharingModal = ({ 
  visible, 
  onClose, 
  onSend, 
  isSending 
}) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionInfo, requestPermission] = Location.useForegroundPermissions();
  const [backgroundPermissionInfo, requestBackgroundPermission] = Location.useBackgroundPermissions();

  const enableLocationServices = async () => {
    try {
      if (Platform.OS === 'android') {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS
        );
      } else {
        await Linking.openURL('app-settings:');
      }
    } catch (err) {
      // console.error('Failed to open location settings:', err);
      Alert.alert('Error', 'Could not open settings');
    }
  };

  const verifyPermissions = async () => {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      // throw new Error('Location services are disabled');
    }

    if (permissionInfo.status !== Location.PermissionStatus.GRANTED) {
      const { status, canAskAgain } = await requestPermission();
      if (status !== Location.PermissionStatus.GRANTED) {
        if (!canAskAgain) {
          throw new Error('Location permission denied permanently');
        }
        throw new Error('Location permission denied');
      }
    }

    if (Platform.OS === 'android' && Platform.Version >= 30) {
      if (backgroundPermissionInfo.status !== Location.PermissionStatus.GRANTED) {
        const { status: backgroundStatus, canAskAgain } = await requestBackgroundPermission();
        if (backgroundStatus !== Location.PermissionStatus.GRANTED) {
          if (!canAskAgain) {
            throw new Error('Background location permission denied permanently');
          }
          throw new Error('Background location permission denied');
        }
      }
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentLocation(null);

      await verifyPermissions();

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeout: 15000,
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

    } catch (err) {
      // console.error('Location error:', err);
      let errorMsg = 'Failed to get location';
      
      switch (err.message) {
        case 'Location services are disabled':
          Alert.alert(
            'Location Required',
            'Please enable location services to share your location',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Enable Location', onPress: enableLocationServices },
            ]
          );
          break;
        case 'Location permission denied permanently':
        case 'Background location permission denied permanently':
          Alert.alert(
            'Permission Required',
            'Location permission was denied. Please enable it in app settings',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          break;
        case 'Location permission denied':
        case 'Background location permission denied':
          errorMsg = 'Location permission denied';
          break;
        default:
          if (err.code === 'E_LOCATION_TIMEOUT') {
            errorMsg = 'Location request timed out. Please try again in an open area.';
          }
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      getCurrentLocation();
    } else {
      setCurrentLocation(null);
      setError(null);
      setLoading(false);
    }
  }, [visible]);

  const handleSend = () => {
    if (!currentLocation) return;
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${currentLocation.latitude},${currentLocation.longitude}`;
    onSend(` My location: ${mapUrl}`);
  };

  const handleOpenMaps = () => {
    if (!currentLocation) return;
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${currentLocation.latitude},${currentLocation.longitude}`;
    Linking.openURL(mapUrl).catch(() => {
      Alert.alert('Error', 'Could not open maps app');
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Share Location</Text>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!currentLocation || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={[styles.sendText, !currentLocation && styles.disabledText]}>
                Send
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="location-off" size={48} color="red" style={styles.errorIcon} />
            <Text style={styles.errorText}>{error}</Text>
            
            <TouchableOpacity
              style={error.includes('permanently') ? styles.settingsButton : styles.retryButton}
              onPress={error.includes('permanently') ? Linking.openSettings : getCurrentLocation}
            >
              <Text style={styles.buttonText}>
                {error.includes('permanently') ? 'Open Settings' : 'Try Again'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : currentLocation ? (
          <>
            <MapView
              style={styles.map}
              initialRegion={currentLocation}
              region={currentLocation}
              showsUserLocation={true}
              showsMyLocationButton={true}
              showsCompass={true}
              zoomEnabled={true}
              scrollEnabled={true}
              rotateEnabled={true}
            >
              <Marker
                coordinate={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }}
                title="Your Location"
                pinColor="#007AFF"
              />
            </MapView>
            <TouchableOpacity
              style={styles.openMapsButton}
              onPress={handleOpenMaps}
            >
              <Text style={styles.openMapsText}>Open in Maps</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  sendText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.5,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 150,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    marginBottom: 20,
    opacity: 0.7,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 24,
  },
  settingsButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  openMapsButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  openMapsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LocationSharingModal;