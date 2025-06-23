import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  PermissionsAndroid,
  Platform,
  Modal,
  SafeAreaView,
  Image,
  NativeModules,
  NativeEventEmitter
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BLEContext } from './BLEContext';
import { sharedStyles } from './styles/shared';
import { scanDeviceStyles } from './styles/components/scanDeviceStyles';

// import manager from './lib/ble';

const checklistItems = [
  {
    question: "Is your hand clean and dry?",
    description: "Clean your hands with tissue or wet wipes and ensure they are completely dry",
    key: "hands"
  },
  {
    question: "Have you rested for at least 10 minutes?",
    description: "Avoid any physical activity before recording for accurate results",
    key: "rested"
  },
  {
    question: "Have you avoided caffeine for the past 2 hours?",
    description: "Caffeine can affect your heart rate and ECG readings",
    key: "caffeine"
  },
  {
    question: "Are you sitting comfortably?",
    description: "Find a quiet place and sit in a comfortable position",
    key: "sitting"
  },
  {
    question: "Are you ready to hold the device firmly with both hands?",
    description: "Ensure you can maintain a steady grip throughout the recording",
    key: "holding"
  }
];

export default function ECGSetupPage() {
  const { manager } = useContext(BLEContext);
  const [currentScreen, setCurrentScreen] = useState('checklist'); // 'checklist' or 'device'
  const [devices, setDevices] = useState({});
  const [scanning, setScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [recordingTime, setRecordingTime] = useState(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [checklist, setChecklist] = useState(
    checklistItems.reduce((acc, item) => ({
      ...acc,
      [item.key]: false
    }), {})
  );
  const [isBluetoothOn, setIsBluetoothOn] = useState(false);

  const router = useRouter();

  useEffect(() => {
    requestPermissions();
    checkBluetoothStatus();

    // Set up Bluetooth state change listener
    const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);
    const subscription = bleManagerEmitter.addListener('BleManagerDidUpdateState', (args) => {
      setIsBluetoothOn(args.state === 'on' || args.state === 'PoweredOn');

      // If Bluetooth is turned off, disconnect any connected device
      if (args.state !== 'on' && args.state !== 'PoweredOn') {
        setConnectedDevice(null);
        setDevices({});
      }
    });

    // Check initial Bluetooth state
    manager.state().then((state) => {
      setIsBluetoothOn(state === 'PoweredOn');
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.remove();
    };
  }, []);

  const checkBluetoothStatus = async () => {
    if (Platform.OS === 'android') {
      manager.state().then((state) => {
        setIsBluetoothOn(state === 'PoweredOn');
      });
    }
  };

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

  const isItemEnabled = (index) => {
    if (index === 0) return true;

    // Check if all previous items are checked as "Yes"
    return checklistItems
      .slice(0, index)
      .every(item => checklist[item.key] === true);
  };

  const handleChecklistItem = (key, index) => {
    if (!isItemEnabled(index)) return;

    setChecklist(prev => {
      const newChecklist = { ...prev };

      // If setting an item to No, clear all subsequent items
      if (prev[key] === true) {
        const currentIndex = checklistItems.findIndex(item => item.key === key);
        checklistItems.forEach((item, idx) => {
          if (idx > currentIndex) {
            newChecklist[item.key] = false;
          }
        });
      }

      newChecklist[key] = !prev[key];
      return newChecklist;
    });
  };

  const allChecklistComplete = () => {
    return checklistItems.every(item => checklist[item.key]);
  };

  const renderChecklistScreen = () => (
    <View style={scanDeviceStyles.content}>
      <Text style={scanDeviceStyles.screenTitle}>Pre-Recording Checklist</Text>
      <Text style={scanDeviceStyles.screenDescription}>
        Please complete all items before proceeding to device setup
      </Text>

      {checklistItems.map((item, index) => (
        <View
          key={item.key}
          style={[
            scanDeviceStyles.checklistItem,
            !isItemEnabled(index) && scanDeviceStyles.disabledChecklistItem
          ]}
        >
          <View style={scanDeviceStyles.questionContainer}>
            <Text style={[
              scanDeviceStyles.question,
              !isItemEnabled(index) && scanDeviceStyles.disabledText
            ]}>
              {index + 1}. {item.question}
            </Text>
            <Text style={[
              scanDeviceStyles.description,
              !isItemEnabled(index) && scanDeviceStyles.disabledText
            ]}>
              {item.description}
            </Text>
          </View>
          <View style={scanDeviceStyles.checkboxContainer}>
            <TouchableOpacity
              style={[
                scanDeviceStyles.checkboxButton,
                checklist[item.key] && scanDeviceStyles.activeYesButton,
                !isItemEnabled(index) && scanDeviceStyles.disabledButton
              ]}
              onPress={() => handleChecklistItem(item.key, index)}
              disabled={!isItemEnabled(index)}
            >
              <Text style={[
                scanDeviceStyles.checkboxText,
                checklist[item.key] && scanDeviceStyles.activeCheckboxText,
                !isItemEnabled(index) && scanDeviceStyles.disabledText
              ]}>
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                scanDeviceStyles.checkboxButton,
                !checklist[item.key] && isItemEnabled(index) && scanDeviceStyles.activeNoButton,
                !isItemEnabled(index) && scanDeviceStyles.disabledButton
              ]}
              onPress={() => handleChecklistItem(item.key, index)}
              disabled={!isItemEnabled(index)}
            >
              <Text style={[
                scanDeviceStyles.checkboxText,
                !checklist[item.key] && isItemEnabled(index) && scanDeviceStyles.activeCheckboxText,
                !isItemEnabled(index) && scanDeviceStyles.disabledText
              ]}>
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={[
          scanDeviceStyles.nextButton,
          !allChecklistComplete() && scanDeviceStyles.disabledButton
        ]}
        onPress={() => setCurrentScreen('device')}
        disabled={!allChecklistComplete()}
      >
        <Text style={scanDeviceStyles.buttonText}>Continue to Device Setup</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderDeviceScreen = () => (
    <View style={scanDeviceStyles.content}>
      <TouchableOpacity
        style={scanDeviceStyles.backButton}
        onPress={() => setCurrentScreen('checklist')}
      >
        <Ionicons name="arrow-back" size={24} color="#4A90E2" />
        <Text style={scanDeviceStyles.backButtonText}>Back to Checklist</Text>
      </TouchableOpacity>

      <Text style={scanDeviceStyles.screenTitle}>Device Setup</Text>
      <Text style={scanDeviceStyles.screenDescription}>
        Connect your device and set recording duration
      </Text>

      {/* Bluetooth Status with Refresh Button */}
      <View style={scanDeviceStyles.bluetoothContainer}>
        <View style={[
          scanDeviceStyles.bluetoothStatus,
          isBluetoothOn ? scanDeviceStyles.bluetoothOn : scanDeviceStyles.bluetoothOff
        ]}>
          <Ionicons
            name={isBluetoothOn ? "bluetooth" : "bluetooth-off"}
            size={24}
            color={isBluetoothOn ? "#4CAF50" : "#F44336"}
          />
          <Text style={[
            scanDeviceStyles.bluetoothText,
            isBluetoothOn ? scanDeviceStyles.bluetoothTextOn : scanDeviceStyles.bluetoothTextOff
          ]}>
            Bluetooth is {isBluetoothOn ? 'On' : 'Off'}
          </Text>
        </View>
        <TouchableOpacity
          style={scanDeviceStyles.refreshButton}
          onPress={checkBluetoothStatus}
        >
          <Ionicons name="refresh" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>

      {/* Device Connection */}
      <View style={scanDeviceStyles.section}>
        <Text style={scanDeviceStyles.sectionTitle}>Connect Device</Text>
        <TouchableOpacity
          style={[
            sharedStyles.card,
            !isBluetoothOn && scanDeviceStyles.disabledCard
          ]}
          onPress={() => {
            if (isBluetoothOn) {
              setShowDeviceModal(true);
              startScan();
            }
          }}
          disabled={!isBluetoothOn}
        >
          <View style={[
            scanDeviceStyles.cardHeader,
            !isBluetoothOn && scanDeviceStyles.disabledCardHeader
          ]}>
            <Ionicons
              name="bluetooth"
              size={24}
              color={isBluetoothOn ? "#4A90E2" : "#ccc"}
            />
            <Text style={[
              scanDeviceStyles.cardTitle,
              !isBluetoothOn && scanDeviceStyles.disabledText
            ]}>
              {connectedDevice ? 'Connected Device' : 'Scan for Devices'}
            </Text>
          </View>

          {connectedDevice ? (
            <View style={scanDeviceStyles.connectedInfo}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={scanDeviceStyles.connectedText}>{connectedDevice.name}</Text>
            </View>
          ) : (
            <Text style={[
              sharedStyles.textMuted,
              !isBluetoothOn && scanDeviceStyles.disabledText
            ]}>
              {isBluetoothOn ? 'Tap to scan and connect' : 'Please enable Bluetooth'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Recording Duration */}
      <View style={scanDeviceStyles.section}>
        <Text style={scanDeviceStyles.sectionTitle}>Recording Duration</Text>
        <TouchableOpacity
          style={[
            sharedStyles.card,
            !isBluetoothOn && scanDeviceStyles.disabledCard
          ]}
          onPress={() => isBluetoothOn && setShowTimerModal(true)}
          disabled={!isBluetoothOn}
        >
          <View style={[
            scanDeviceStyles.cardHeader,
            !isBluetoothOn && scanDeviceStyles.disabledCardHeader
          ]}>
            <Ionicons
              name="timer"
              size={24}
              color={isBluetoothOn ? "#4A90E2" : "#ccc"}
            />
            <Text style={[
              scanDeviceStyles.cardTitle,
              !isBluetoothOn && scanDeviceStyles.disabledText
            ]}>
              Select Duration
            </Text>
          </View>

          {recordingTime ? (
            <Text style={[
              scanDeviceStyles.timeDisplay,
              !isBluetoothOn && scanDeviceStyles.disabledText
            ]}>
              {formatTime(recordingTime)}
            </Text>
          ) : (
            <Text style={[
              sharedStyles.textMuted,
              !isBluetoothOn && scanDeviceStyles.disabledText
            ]}>
              {isBluetoothOn ? 'Tap to select recording duration' : 'Please enable Bluetooth'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Recording Instructions */}
      <View style={scanDeviceStyles.section}>
        <Text style={scanDeviceStyles.sectionTitle}>How to Record</Text>
        <View style={scanDeviceStyles.instructionsCard}>
          <Image
            source={require('./assets/hand-place.png')}
            style={scanDeviceStyles.instructionImage}
            resizeMode="contain"
          />
          <Text style={scanDeviceStyles.instructionText}>
            Hold the device firmly with both hands. Ensure your fingers make good contact with the metal electrodes.
          </Text>
        </View>
      </View>

      {/* Start Button */}
      <TouchableOpacity
        style={[
          scanDeviceStyles.startButton,
          (!connectedDevice || !recordingTime) && scanDeviceStyles.disabledButton
        ]}
        onPress={startRecording}
        disabled={!connectedDevice || !recordingTime}
      >
        <Ionicons name="play" size={20} color="white" />
        <Text style={scanDeviceStyles.buttonText}>Start ECG Recording</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={sharedStyles.safeArea}>
      <FlatList
        data={[1]}
        renderItem={() => (
          currentScreen === 'checklist' ? renderChecklistScreen() : renderDeviceScreen()
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