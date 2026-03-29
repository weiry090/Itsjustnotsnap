import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {
  Text,
  IconButton,
  ActivityIndicator,
  Snackbar,
  Chip,
} from 'react-native-paper';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { BASIC_FILTERS, FACE_FILTERS } from '../utils/filters';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CameraScreen = ({ navigation, route }) => {
  const { onCapture } = route.params || {};
  const camera = useRef(null);
  const devices = useCameraDevices();
  
  const [hasPermission, setHasPermission] = useState(false);
  const [cameraPosition, setCameraPosition] = useState('back');
  const [flash, setFlash] = useState('off');
  const [isRecording, setIsRecording] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [selectedBasicFilter, setSelectedBasicFilter] = useState('none');
  const [selectedFaceFilter, setSelectedFaceFilter] = useState('none');
  const [error, setError] = useState('');
  const [filterMode, setFilterMode] = useState('basic'); // 'basic' or 'face'

  const device = cameraPosition === 'back' ? devices.back : devices.front;

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const cameraGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        const audioGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        setHasPermission(
          cameraGranted === PermissionsAndroid.RESULTS.GRANTED &&
          audioGranted === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const cameraPermission = await Camera.requestCameraPermission();
        const microphonePermission = await Camera.requestMicrophonePermission();
        setHasPermission(
          cameraPermission === 'authorized' &&
          microphonePermission === 'authorized'
        );
      }
    } catch (err) {
      console.error('Permission error:', err);
      setError('Failed to get permissions');
    }
  };

  const handleCapturePhoto = async () => {
    if (!camera.current) return;
    
    setCapturing(true);
    try {
      const photo = await camera.current.takePhoto({
        flash: flash,
        enableAutoStabilization: true,
        enableShutterSound: true,
      });
      
      // Photo captured successfully
      const photoUri = `file://${photo.path}`;
      
      if (onCapture) {
        onCapture(photoUri, 'photo', selectedBasicFilter);
      }
      
      navigation.goBack();
    } catch (err) {
      console.error('Capture error:', err);
      setError('Failed to capture photo');
    } finally {
      setCapturing(false);
    }
  };

  const handleStartRecording = async () => {
    if (!camera.current) return;
    
    setIsRecording(true);
    try {
      await camera.current.startRecording({
        flash: flash,
        onRecordingFinished: (video) => {
          const videoUri = `file://${video.path}`;
          if (onCapture) {
            onCapture(videoUri, 'video', selectedBasicFilter);
          }
          navigation.goBack();
        },
        onRecordingError: (error) => {
          console.error('Recording error:', error);
          setError('Failed to record video');
          setIsRecording(false);
        },
      });
    } catch (err) {
      console.error('Start recording error:', err);
      setError('Failed to start recording');
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    if (!camera.current) return;
    
    try {
      await camera.current.stopRecording();
      setIsRecording(false);
    } catch (err) {
      console.error('Stop recording error:', err);
      setIsRecording(false);
    }
  };

  const toggleCamera = () => {
    setCameraPosition(prev => prev === 'back' ? 'front' : 'back');
  };

  const toggleFlash = () => {
    setFlash(prev => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
  };

  const renderFilterSelector = () => {
    const filters = filterMode === 'basic' ? BASIC_FILTERS : FACE_FILTERS;
    const selectedFilter = filterMode === 'basic' ? selectedBasicFilter : selectedFaceFilter;
    const setSelectedFilter = filterMode === 'basic' ? setSelectedBasicFilter : setSelectedFaceFilter;

    return (
      <View style={styles.filterContainer}>
        <View style={styles.filterModeToggle}>
          <Chip
            selected={filterMode === 'basic'}
            onPress={() => setFilterMode('basic')}
            style={styles.modeChip}
          >
            Basic
          </Chip>
          <Chip
            selected={filterMode === 'face'}
            onPress={() => setFilterMode('face')}
            style={styles.modeChip}
          >
            Face
          </Chip>
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                selectedFilter === filter.id && styles.filterButtonSelected,
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Icon
                name={filter.icon}
                size={30}
                color={selectedFilter === filter.id ? '#1976d2' : '#fff'}
              />
              <Text
                variant="bodySmall"
                style={[
                  styles.filterText,
                  selectedFilter === filter.id && styles.filterTextSelected,
                ]}
              >
                {filter.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Icon name="camera-off" size={64} color="#999" />
          <Text variant="headlineSmall" style={styles.permissionText}>
            Camera permission required
          </Text>
          <IconButton
            icon="refresh"
            mode="contained"
            onPress={checkPermissions}
          />
        </View>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
        video={true}
        audio={true}
      />

      {/* Face filter overlay (simplified) */}
      {selectedFaceFilter !== 'none' && (
        <View style={styles.faceFilterOverlay}>
          <Text style={styles.faceFilterEmoji}>
            {selectedFaceFilter === 'dog' && '🐶'}
            {selectedFaceFilter === 'cat' && '🐱'}
            {selectedFaceFilter === 'glasses' && '🕶️'}
            {selectedFaceFilter === 'beauty' && '✨'}
          </Text>
        </View>
      )}

      {/* Top controls */}
      <View style={styles.topControls}>
        <IconButton
          icon="close"
          iconColor="#fff"
          size={28}
          onPress={() => navigation.goBack()}
        />
        <View style={styles.topRightControls}>
          <IconButton
            icon={
              flash === 'off' ? 'flash-off' :
              flash === 'on' ? 'flash' : 'flash-auto'
            }
            iconColor="#fff"
            size={28}
            onPress={toggleFlash}
          />
          <IconButton
            icon="camera-flip"
            iconColor="#fff"
            size={28}
            onPress={toggleCamera}
          />
        </View>
      </View>

      {/* Filter selector */}
      {renderFilterSelector()}

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        <View style={styles.captureControls}>
          {/* Photo button */}
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapturePhoto}
            disabled={capturing || isRecording}
          >
            <View
              style={[
                styles.captureButtonInner,
                capturing && styles.captureButtonCapturing,
              ]}
            />
          </TouchableOpacity>

          {/* Video button */}
          <TouchableOpacity
            style={[styles.videoButton, isRecording && styles.videoButtonRecording]}
            onPress={isRecording ? handleStopRecording : handleStartRecording}
            disabled={capturing}
          >
            <Icon
              name={isRecording ? 'stop' : 'video'}
              size={30}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording...</Text>
          </View>
        )}
      </View>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={3000}
      >
        {error}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionText: {
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
    color: '#666',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 8,
  },
  topRightControls: {
    flexDirection: 'row',
  },
  filterContainer: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
  },
  filterModeToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8,
  },
  modeChip: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 80,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterButtonSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: '#1976d2',
  },
  filterText: {
    marginTop: 4,
    color: '#fff',
    fontSize: 11,
  },
  filterTextSelected: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  faceFilterOverlay: {
    position: 'absolute',
    top: '30%',
    left: '35%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceFilterEmoji: {
    fontSize: 100,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 32,
    alignItems: 'center',
  },
  captureControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fff',
  },
  captureButtonCapturing: {
    backgroundColor: '#ccc',
  },
  videoButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoButtonRecording: {
    backgroundColor: '#d32f2f',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    borderRadius: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  recordingText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CameraScreen;
