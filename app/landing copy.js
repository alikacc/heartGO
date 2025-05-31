import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import manager from './lib/ble'; // adjust path as needed

export default function ECGScreen() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();

  const [value, setValue] = useState('Waiting for data...');
  const [status, setStatus] = useState('Connecting...');
  const [ecgData, setEcgData] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [totalSamples, setTotalSamples] = useState(0);
  const subscriptionRef = useRef(null);
  const characteristicRef = useRef(null);

  // connect, monitor and parse
  useEffect(() => {
    let subscription;
    (async () => {
      try {
        const device = await manager.devices([id]).then((d) => d[0]);
        if (!device) {
          setStatus('Device not found or not connected.');
          return;
        }
        await device.discoverAllServicesAndCharacteristics();
        if (Platform.OS === 'android') {
          try {
            await device.requestMTU(247);
          } catch { }
        }

        const services = await device.services();
        for (const service of services) {
          for (const char of await service.characteristics()) {
            if (char.isNotifiable) {
              characteristicRef.current = char;
              return;
            }
          }
        }
        setStatus('No notifiable characteristic found.');
      } catch {
        setStatus('Connection failed.');
      }
    })();

    return () => {
      subscriptionRef.current?.remove();
      manager.cancelDeviceConnection(id);
    };
  }, [id]);

  const startNotify = () => {
    const char = characteristicRef.current;
    if (!char) {
      Alert.alert('No notifiable characteristic found');
      return;
    }

    setIsRecording(true);
    setTotalSamples(0);

    subscriptionRef.current = char.monitor((err, c) => {
      if (err) {
        setStatus('Monitor error');
        setIsRecording(false);
        return;
      }

      const buffer = Buffer.from(c.value, 'base64');
      const lead1 = [];
      const lead2 = [];
      for (let i = 0; i + 5 < buffer.length; i += 6) {
        let v1 = (buffer[i] << 16) | (buffer[i + 1] << 8) | buffer[i + 2];
        let v2 = (buffer[i + 3] << 16) | (buffer[i + 4] << 8) | buffer[i + 5];

        let max = 0xC35000;
        let res1 = ((2 * v1 / max) - 1) * (2.4 / 3.5);
        let res2 = ((2 * v2 / max) - 1) * (2.4 / 3.5);
        lead1.push(res1);
        lead2.push(res2);
      }

      const int1 = lead1[lead1.length - 1] * 1000;
      const int2 = lead2[lead2.length - 1] * 1000;
      setValue(`Lead1: ${int1}, Lead2: ${int2}`);
      setStatus(`Recording... Total samples: ${totalSamples + lead1.length}`);

      // Remove the slice limitation - store ALL data
      setEcgData(prev => [...prev, { lead1, lead2 }]);
      setTotalSamples(prev => prev + lead1.length);
    });
    setStatus('Notifications started - Recording unlimited data');
  };

  const disconnect = async () => {
    await manager.cancelDeviceConnection(id);
  };

  const exportData = async () => {
    if (ecgData.length === 0) {
      Alert.alert('No data to export');
      return;
    }
    let content = '';
    ecgData.forEach((frame, idx) => {
      const h1 = frame.lead1
        .map((v) =>
          '0x' +
          (v & 0xffffff)
            .toString(16)
            .padStart(6, '0')
            .toUpperCase()
        )
        .join(',');
      const h2 = frame.lead2
        .map((v) =>
          '0x' +
          (v & 0xffffff)
            .toString(16)
            .padStart(6, '0')
            .toUpperCase()
        )
        .join(',');
      content += `Frame ${idx}: L1=[${h1}] L2=[${h2}]\n`;
    });
    const fileUri =
      FileSystem.documentDirectory + `ecg_${Date.now()}.txt`;
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      Alert.alert('Saved to', fileUri);
    }
  };

  const stopAndExport = async () => {
    try {
      // Stop notifications first
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }

      // Disconnect from device
      await manager.cancelDeviceConnection(id);
      setStatus('Disconnected');

      // Export data as CSV
      if (ecgData.length === 0) {
        Alert.alert('No data to export');
        return;
      }

      // Create CSV content
      let csvContent = 'Frame,Sample,Lead1_Hex,Lead1_Decimal,Lead2_Hex,Lead2_Decimal\n';

      ecgData.forEach((frame, frameIdx) => {
        frame.lead1.forEach((v1, sampleIdx) => {
          const v2 = frame.lead2[sampleIdx];
          const hex1 = '0x' + (v1 & 0xffffff).toString(16).padStart(6, '0').toUpperCase();
          const hex2 = '0x' + (v2 & 0xffffff).toString(16).padStart(6, '0').toUpperCase();
          csvContent += `${frameIdx},${sampleIdx},${hex1},${v1 * 1000},${hex2},${v2 * 1000}\n`;
        });
      });

      const fileUri = FileSystem.documentDirectory + `ecg_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('CSV Saved', `File saved to: ${fileUri}`);
      }

      // Clear the data after export
      setEcgData([]);
      setValue('Stopped - Data exported');

    } catch (error) {
      console.error('Stop and export error:', error);
      Alert.alert('Error', 'Failed to stop and export data');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{status}</Text>
      <Text style={styles.label}>Recording Status: {isRecording ? 'RECORDING' : 'STOPPED'}</Text>
      <Text style={styles.label}>Total Samples: {totalSamples}</Text>
      <Text style={styles.label}>Latest ECG Sample (HEX):</Text>
      <Text style={styles.value}>{value}</Text>

      {/* Show only last few frames in UI to prevent performance issues */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {ecgData.slice(-10).map((frame, index) => (
          <View key={index} style={styles.frame}>
            <Text style={styles.hex1}>
              {frame.lead1
                .map((v) =>
                  '0x' +
                  (v & 0xffffff)
                    .toString(16)
                    .padStart(6, '0')
                    .toUpperCase()
                )
                .join(' | ')}
            </Text>
            <Text style={styles.hex2}>
              {frame.lead2
                .map((v) =>
                  '0x' +
                  (v & 0xffffff)
                    .toString(16)
                    .padStart(6, '0')
                    .toUpperCase()
                )
                .join(' | ')}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttons}>
        <Button title="Download Data" onPress={exportData} />
        <View style={{ height: 12 }} />
        <Button title="Start" onPress={startNotify} />
        <View style={{ height: 12 }} />
        <Button title="Stop & Export CSV" onPress={stopAndExport} color="#ff6b6b" />
        <View style={{ height: 12 }} />
        <Button
          title="Go to Home"
          onPress={() =>
            router.push({ pathname: '/home', params: { id, name } })
          }
        />
        <Button title="Send Message" onPress={disconnect} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#111',
  },
  status: {
    color: '#fff',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: '#ccc',
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f0',
    marginVertical: 8,
  },
  scroll: {
    maxHeight: 200,
    marginVertical: 12,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  frame: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  hex1: {
    color: '#ccc',
    fontSize: 12,
  },
  hex2: {
    color: '#aaa',
    fontSize: 12,
  },
  buttons: {
    marginTop: 24,
  },
});