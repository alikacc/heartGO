// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, ScrollView } from 'react-native';
// import { useLocalSearchParams } from 'expo-router';
// import { BleManager } from 'react-native-ble-plx';
// import { Buffer } from 'buffer';

// const manager = new BleManager();

// export default function ECGScreen() {
//   const { id, name } = useLocalSearchParams();
//   const [value, setValue] = useState('Waiting for data...');
//   const [status, setStatus] = useState('Connecting...');

//   useEffect(() => {
//     const connectAndRead = async () => {
//       try {
//         const device = await manager.devices([id]).then(devices => devices[0]);
//         if (!device) {
//           setStatus('Device not found or not connected.');
//           return;
//         }
//         await device.discoverAllServicesAndCharacteristics();

//         await device.discoverAllServicesAndCharacteristics();

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

//                   // Assuming 16-bit signed integer (adjust if needed)
//                   const intValue = buffer.readInt32LE(0);

//                   setValue(intValue);
//                   setStatus(`Receiving from ${name}`);
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
//       <Text style={styles.label}>Latest ECG Value:</Text>
//       <Text style={styles.value}>{value}</Text>
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

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

import manager from './lib/ble'; // or './lib/BLE' depending on your structure

export default function ECGScreen() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();

  const [value, setValue] = useState('Waiting for data...');
  const [status, setStatus] = useState('Connecting...');
  const [ecgData, setEcgData] = useState([]);

  useEffect(() => {
    const connectAndRead = async () => {
      try {
        const device = await manager.devices([id]).then(devices => devices[0]);
        if (!device) {
          setStatus('Device not found or not connected.');
          return;
        }
        await device.discoverAllServicesAndCharacteristics();

        const services = await device.services();

        for (const service of services) {
          const characteristics = await service.characteristics();

          for (const char of characteristics) {
            if (char.isNotifiable) {
              char.monitor((error, characteristic) => {
                if (error) {
                  console.error('Monitor error:', error);
                  setStatus('Monitor error.');
                  return;
                }

                if (characteristic?.value) {
                  const base64 = characteristic.value;
                  const buffer = Buffer.from(base64, 'base64');
                  const intValue = buffer.readInt32LE(0); // Change to readInt16LE if needed

                  setValue(intValue);
                  setStatus(`Receiving from ${name}`);
                  setEcgData(prev => [...prev.slice(-99), intValue]); // keep last 100 points
                }
              });

              return;
            }
          }
        }

        setStatus('No notifiable characteristic found.');
      } catch (err) {
        console.error(err);
        setStatus('Connection failed.');
      }
    };

    connectAndRead();

    return () => {
      manager.cancelDeviceConnection(id);
    };
  }, [id]);

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{status}</Text>
      <Text style={styles.label}>Latest ECG Value:</Text>
      <Text style={styles.value}>{value}</Text>

      <View style={{ marginTop: 40 }}>
        <Button
          title="See Plotting"
          onPress={() =>
            router.push({
              pathname: '/plot',
              params: {
                id,
                name,
              },
            })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    alignItems: 'center',
    backgroundColor: '#111',
  },
  status: {
    color: '#fff',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    color: '#ccc',
  },
  value: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#0f0',
    marginTop: 10,
  },
});
