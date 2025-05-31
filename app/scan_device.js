import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  PermissionsAndroid,
  Platform,
  Modal,
  SafeAreaView
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BLEContext } from './BLEContext';
import { sharedStyles } from './styles/shared';
import { scanDeviceStyles } from './styles/components/scanDeviceStyles';

// import manager from './lib/ble';

export default function ECGSetupPage() {
  const { manager } = useContext(BLEContext);
  const [devices, setDevices] = useState({});
  const [scanning, setScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [recordingTime, setRecordingTime] = useState(60);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);

  const router = useRouter();

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
    }
  };

  const startScan = () => {
    if (!manager) {
      setErrorMessage('BLE Manager not available');
      return;
    }

    // Stop any existing scan first
    manager.stopDeviceScan();

    setDevices({});
    setScanning(true);
    setErrorMessage(null);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setScanning(false);
        return;
      }
      if (device && device.name) {
        setDevices(prev => ({ ...prev, [device.id]: device }));
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      setScanning(false);
    }, 5000);
  };

  const connectToDevice = async (deviceId) => {
    setErrorMessage(null);
    try {
      const device = await manager.connectToDevice(deviceId, { autoConnect: true });
      await device.discoverAllServicesAndCharacteristics();
      setConnectedDevice(device);
      setShowDeviceModal(false);
    } catch (error) {
      setErrorMessage(`Connection failed: ${error.message}`);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let i = 30; i <= 300; i += 30) {
      options.push(i);
    }
    return options;
  };

  const startRecording = () => {
    router.push({
      pathname: 'plotplot',
      params: {
        deviceName: connectedDevice.name || 'Unknown Device',
        id: connectedDevice.id,
        recordingTime: recordingTime,
      },
    });
  };

  const reminders = [
    'Ensure your hands are clean and dry',
    'Wait at least 10 minutes after exercise',
    'Avoid caffeine 2 hours before recording',
    'Sit comfortably and remain still',
    'Hold device with both hands firmly'
  ];

  return (
    <SafeAreaView style={sharedStyles.safeArea}>
      <Text style={sharedStyles.pageTitle}>ECG Recording Setup</Text>

      <FlatList
        data={[1]}
        renderItem={() => (
          <View style={scanDeviceStyles.content}>
            {/* Reminders Section */}
            <View style={scanDeviceStyles.section}>
              <Text style={scanDeviceStyles.sectionTitle}>Before Recording:</Text>
              {reminders.map((reminder, index) => (
                <View key={index} style={scanDeviceStyles.reminderRow}>
                  <Text style={scanDeviceStyles.bullet}>•</Text>
                  <Text style={scanDeviceStyles.reminderText}>{reminder}</Text>
                </View>
              ))}
            </View>

            {/* Device Connection */}
            <TouchableOpacity
              style={sharedStyles.card}
              onPress={() => {
                setShowDeviceModal(true);
                startScan();
              }}
            >
              <View style={scanDeviceStyles.cardHeader}>
                <Ionicons name="bluetooth" size={24} color="#4A90E2" />
                <Text style={scanDeviceStyles.cardTitle}>Connect Device</Text>
              </View>

              {connectedDevice ? (
                <View style={scanDeviceStyles.connectedInfo}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={scanDeviceStyles.connectedText}>{connectedDevice.name}</Text>
                </View>
              ) : (
                <Text style={sharedStyles.textMuted}>Tap to scan and connect</Text>
              )}
            </TouchableOpacity>

            {/* Recording Time */}
            <TouchableOpacity
              style={[sharedStyles.card, !connectedDevice && scanDeviceStyles.disabledCard]}
              onPress={() => connectedDevice && setShowTimerModal(true)}
              disabled={!connectedDevice}
            >
              <View style={scanDeviceStyles.cardHeader}>
                <Ionicons
                  name="timer"
                  size={24}
                  color={connectedDevice ? "#4A90E2" : "#ccc"}
                />
                <Text style={[scanDeviceStyles.cardTitle, !connectedDevice && scanDeviceStyles.disabledText]}>
                  Recording Duration
                </Text>
              </View>

              <Text style={[scanDeviceStyles.timeDisplay, !connectedDevice && scanDeviceStyles.disabledText]}>
                {formatTime(recordingTime)}
              </Text>

              {!connectedDevice && (
                <Text style={scanDeviceStyles.disabledHint}>Connect device first</Text>
              )}
            </TouchableOpacity>

            {/* Start Button */}
            <TouchableOpacity
              style={[scanDeviceStyles.startButton, !connectedDevice && scanDeviceStyles.disabledButton]}
              onPress={startRecording}
              disabled={!connectedDevice}
            >
              <Ionicons name="play" size={20} color="white" />
              <Text style={scanDeviceStyles.buttonText}>Start ECG Recording</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={() => 'main'}
      />

      {/* Device Modal */}
      <Modal visible={showDeviceModal} transparent animationType="slide">
        <View style={scanDeviceStyles.modalBackdrop}>
          <TouchableOpacity
            style={scanDeviceStyles.modalOverlay}
            onPress={() => setShowDeviceModal(false)}
            activeOpacity={1}
          />
          <View style={scanDeviceStyles.modalContainer}>
            <View style={scanDeviceStyles.modalHeader}>
              <Text style={scanDeviceStyles.modalTitle}>Select Device</Text>
              <TouchableOpacity
                style={scanDeviceStyles.closeButton}
                onPress={() => setShowDeviceModal(false)}
              >
                <Text style={scanDeviceStyles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>

            {errorMessage && (
              <View style={scanDeviceStyles.errorBox}>
                <Text style={scanDeviceStyles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[scanDeviceStyles.scanButton, scanning && scanDeviceStyles.disabledButton]}
              onPress={startScan}
              disabled={scanning}
            >
              <Text style={scanDeviceStyles.buttonText}>
                {scanning ? 'Scanning...' : 'Scan Again'}
              </Text>
            </TouchableOpacity>

            <FlatList
              data={Object.values(devices)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={scanDeviceStyles.deviceItem}
                  onPress={() => connectToDevice(item.id)}
                >
                  <Text style={scanDeviceStyles.deviceName}>{item.name}</Text>
                  <Text style={scanDeviceStyles.deviceId}>{item.id}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id}
            />
          </View>
        </View>
      </Modal>

      {/* Timer Modal */}
      <Modal visible={showTimerModal} transparent animationType="slide">
        <View style={scanDeviceStyles.modalBackdrop}>
          <TouchableOpacity
            style={scanDeviceStyles.modalOverlay}
            onPress={() => setShowTimerModal(false)}
            activeOpacity={1}
          />
          <View style={scanDeviceStyles.modalContainer}>
            <View style={scanDeviceStyles.modalHeader}>
              <Text style={scanDeviceStyles.modalTitle}>Select Duration</Text>
              <TouchableOpacity
                style={scanDeviceStyles.closeButton}
                onPress={() => setShowTimerModal(false)}
              >
                <Text style={scanDeviceStyles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={generateTimeOptions()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[scanDeviceStyles.timeOption, recordingTime === item && scanDeviceStyles.selectedOption]}
                  onPress={() => {
                    setRecordingTime(item);
                    setShowTimerModal(false);
                  }}
                >
                  <Text style={[scanDeviceStyles.timeText, recordingTime === item && scanDeviceStyles.selectedText]}>
                    {formatTime(item)}
                  </Text>
                  {recordingTime === item && <Ionicons name="checkmark" size={20} color="#4A90E2" />}
                </TouchableOpacity>
              )}
              keyExtractor={item => item.toString()}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}