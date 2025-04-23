import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, PermissionsAndroid, Platform, Alert } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { useRouter } from 'expo-router';


import manager from './lib/ble'; // or './lib/BLE' depending on your structure

export default function App() {
  const [devices, setDevices] = useState({});
  const [scanning, setScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    requestPermissions();
    return () => {
      manager.destroy();
    };
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
    setDevices({});
    setScanning(true);
    setConnectedDevice(null);
    setErrorMessage(null);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.warn('Scan error:', error);
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

  const router = useRouter();

  const connectToDevice = async (deviceId) => {
    setErrorMessage(null);
    try {
      const device = await manager.connectToDevice(deviceId, { autoConnect: true });
      await device.discoverAllServicesAndCharacteristics();
  
      setConnectedDevice(device);
  
      // Navigate to landing page and pass device name
      router.push({
        pathname: '/landing',
        params: {
          name: device.name || 'Unknown Device',
          id: device.id,
        },
      });
  
    } catch (error) {
      console.error('❌ Connection failed:', error);
      setErrorMessage(`Connection failed: ${error.message}`);
    }
  };

  const renderDevice = ({ item }) => (
    <View style={{ padding: 10, borderBottomWidth: 1, borderColor: '#ccc' }}>
      <Text>{item.name} ({item.id})</Text>
      <Button title="Connect" onPress={() => connectToDevice(item.id)} />
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title={scanning ? "Scanning..." : "Scan for Devices"} onPress={startScan} disabled={scanning} />

      {connectedDevice && (
        <Text style={{ marginTop: 10, fontWeight: 'bold', color: 'green' }}>
          ✅ Connected to {connectedDevice.name}
        </Text>
      )}

      {errorMessage && (
        <Text style={{ marginTop: 10, fontWeight: 'bold', color: 'red' }}>
          ⚠️ {errorMessage}
        </Text>
      )}

      <FlatList
        data={Object.values(devices)}
        keyExtractor={(item) => item.id}
        renderItem={renderDevice}
        style={{ marginTop: 20 }}
      />
    </View>
  );
}