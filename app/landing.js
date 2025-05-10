// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, Button, ScrollView , Platform} from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { BleManager } from 'react-native-ble-plx';
// import { Buffer } from 'buffer';


// import manager from './lib/ble'; // or './lib/BLE' depending on your structure

// export default function ECGScreen() {
//   const { id, name } = useLocalSearchParams();
//   const router = useRouter();

//   const [value, setValue] = useState('Waiting for data...');
//   const [status, setStatus] = useState('Connecting...');
//   const [ecgData, setEcgData] = useState([]);

//   useEffect(() => {
//     const connectAndRead = async () => {
//       try {
//         const device = await manager.devices([id]).then(devices => devices[0]);
//         if (!device) {
//           setStatus('Device not found or not connected.');
//           return;
//         }
//         await device.discoverAllServicesAndCharacteristics();
//         if (Platform.OS === 'android') {
//           try {
//             const mtu = await device.requestMTU(247);
//             console.log('Requested MTU:', mtu);
//           } catch (e) {
//             console.warn('MTU request failed:', e);
//           }
//         }

//         const services = await device.services();

//         for (const service of services) {
//           const characteristics = await service.characteristics();

//           for (const char of characteristics) {
//             if (char.isNotifiable) {
//               char.monitor((error, characteristic) => {
//                 if (error) {
//                   console.error('Monitor error:', error);
//                   setStatus('Monitor error.');
//                   return;
//                 }

//                 if (characteristic?.value) {
//                   const base64 = characteristic.value;
//                   const buffer = Buffer.from(base64, 'base64');
                  
//                   // Baca isi buffer dan diubah jadi array lead 1 dan lead 2
//                   // Indeks 0 berarti sample pertama, indeks 1 sample kedua, dst
//                   const lead1 = [];
//                   const lead2 = [];
//                   for (let i = 0; i <= buffer.length - 6; i += 6){
//                     // Gabung 3 byte buat lead 1
//                     let valLead1 = (buffer[i] << 16) | (buffer[i+1] << 8) | buffer[i+2]
//                     if (valLead1 & 0x800000) valLead1 |= 0xFF000000;
                  
//                     // Gabung 3 byte buat lead 2
//                     let valLead2 = (buffer[i+3] << 16) | (buffer[i+4] << 8) | buffer[i+5]
//                     if (valLead2 & 0x800000) valLead2 |= 0xFF000000;
                    
//                     // Masukin nilai ke array
//                     const index = i/6;
//                     lead1[index] = valLead1;
//                     lead2[index] = valLead2;
//                   }
//                   // Buat display engga aku setup karena engga tau caranya

//                   // const intValue = buffer.readInt32LE(0); // Change to readInt16LE if needed

//                   // setValue(intValue);
//                   // setStatus(`Receiving from ${name}`);
//                   // setEcgData(prev => [...prev.slice(-99), intValue]); // keep last 100 points
//                   setValue(`Lead1: ${lead1[lead1.length - 1]}, Lead2: ${lead2[lead2.length - 1]}`);
//                   setStatus(`Receiving from ${name}`);
//                   setEcgData(prev => [...prev.slice(-50), { lead1, lead2 }]); // keep recent 50 frames

//                 }
//               });

//               return;
//             }
//           }
//         }

//         setStatus('No notifiable characteristic found.');
//       } catch (err) {
//         console.error(err);
//         setStatus('Connection failed.');
//       }
//     };

//     connectAndRead();

//     return () => {
//       manager.cancelDeviceConnection(id);
//     };
//   }, [id]);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.status}>{status}</Text>
//       <Text style={styles.label}>Latest ECG Sample:</Text>
//       <Text style={styles.value}>{value}</Text>

//       <ScrollView style={{ maxHeight: 200, marginTop: 20, width: '100%' }}>
//         {ecgData.map((frame, index) => (
//           <View key={index} style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
//             <Text style={{ color: '#ccc' }}>
//               {frame.lead1.map((v, i) => `L1[${i}]=${v}`).join(' | ')}
//             </Text>
//             <Text style={{ color: '#aaa', fontSize: 12 }}>
//               {frame.lead2.map((v, i) => `L2[${i}]=${v}`).join(' | ')}
//             </Text>
//           </View>
//         ))}
//       </ScrollView>


//       <View style={{ marginTop: 40 }}>
//         <Button
//           title="Go to home"
//           onPress={() =>
//             router.push({
//               pathname: '/home',
//               params: {
//                 id,
//                 name,
//               },
//             })
//           }
//         />
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingTop: 100,
//     alignItems: 'center',
//     backgroundColor: '#111',
//   },
//   status: {
//     color: '#fff',
//     marginBottom: 20,
//   },
//   label: {
//     fontSize: 18,
//     color: '#ccc',
//   },
//   value: {
//     fontSize: 48,
//     fontWeight: 'bold',
//     color: '#0f0',
//     marginTop: 10,
//   },
// });

// ECGScreen.tsx

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
  const subscriptionRef = useRef(null);
  const characteristicRef = useRef(null);

  // connect, monitor and parse
  useEffect(() => {
    let subscription: any;
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
          } catch {}
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
    // attach the monitor only when the user presses “Start”
    subscriptionRef.current = char.monitor((err, c) => {
      if (err) {
        setStatus('Monitor error');
        return;
      }
      // your parsing logic…
      const buffer = Buffer.from(c.value, 'base64');
      const lead1: number[] = [];
      const lead2: number[] = [];
      for (let i = 0; i + 5 < buffer.length; i += 6) {
        let v1 =
          (buffer[i] << 16) |
          (buffer[i + 1] << 8) |
          buffer[i + 2];
        let v2 =
          (buffer[i + 3] << 16) |
          (buffer[i + 4] << 8) |
          buffer[i + 5];
        
        let max = 0xC35000;
        let res1 = ((2 * v1 / max) - 1) * (2.4/3.5);
        let res2 = ((2 * v2 / max) - 1) * (2.4/3.5);
        lead1.push(res1);
        lead2.push(res2);
      }

      // display latest sample in HEX
      const int1 = lead1[lead1.length - 1] * 1000;
      const int2 = lead2[lead2.length - 1] * 1000;
      //   '0x' +
      //   (lead2[lead2.length - 1] & 0xffffff)
      //     .toString(16)
      //     .padStart(6, '0');
      setValue(`Lead1: ${int1}, Lead2: ${int2} `);
      setStatus(`Receiving from ${name}`);
      setEcgData(prev => [...prev.slice(-50), { lead1, lead2 }]);
    });
    setStatus('Notifications started');
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

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{status}</Text>
      <Text style={styles.label}>Latest ECG Sample (HEX):</Text>
      <Text style={styles.value}>{value}</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {ecgData.map((frame, index) => (
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
        <Button
          title="Go to Home"
          onPress={() =>
            router.push({ pathname: '/home', params: { id, name } })
          }
        />
        <Button title="Send Message" onPress={disconnect} />
        <View style={{ height: 12 }} />
        <Button title="Start" onPress={startNotify} />
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