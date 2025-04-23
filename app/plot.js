// import React, { useEffect, useState } from 'react';
// import { View, Text, Dimensions, StyleSheet } from 'react-native';
// import { useLocalSearchParams } from 'expo-router';
// import { BleManager } from 'react-native-ble-plx';
// import { LineChart } from 'react-native-chart-kit';
// import { Buffer } from 'buffer';
// import LinearGradient from 'react-native-linear-gradient';

// import manager from './lib/ble'; // or './lib/BLE' depending on your structure

// export default function PlotScreen() {
//   const { id, name } = useLocalSearchParams();
//   const [dataPoints, setDataPoints] = useState([]);
//   const [status, setStatus] = useState('Connecting...');

//   useEffect(() => {
//     const connectAndStream = async () => {
//       try {
//         const device = await manager.devices([id]).then(devices => devices[0]);
//         if (!device) {
//           setStatus('Device not found.');
//           return;
//         }

//         await device.discoverAllServicesAndCharacteristics();
//         const services = await device.services();

//         for (const service of services) {
//           const characteristics = await service.characteristics();

//           for (const char of characteristics) {
//             if (char.isNotifiable) {
//               char.monitor((error, characteristic) => {
//                 if (error) {
//                   console.error(error);
//                   setStatus('Monitor error.');
//                   return;
//                 }

//                 if (characteristic?.value) {
//                   const base64 = characteristic.value;
//                   const buffer = Buffer.from(base64, 'base64');
//                   const intValue = buffer.readInt32LE(0); 
//                   setDataPoints(prev => [...prev.slice(-99), intValue]); 
//                   setStatus(`Plotting from ${name}`);
//                 }
//               });
//               return;
//             }
//           }
//         }

//         setStatus('No notifiable characteristic.');
//       } catch (err) {
//         console.error(err);
//         setStatus('Connection failed.');
//       }
//     };

//     connectAndStream();

//     return () => {
//       manager.cancelDeviceConnection(id);
//     };
//   }, [id]);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.status}>{status}</Text>
//       <LineChart
//         data={{
//           datasets: [{ data: dataPoints }],
//         }}
//         width={Dimensions.get('window').width - 20}
//         height={220}
//         withDots={false}
//         withInnerLines={false}
//         withOuterLines={false}
//         withVerticalLabels={false}
//         withHorizontalLabels={false}
//         chartConfig={{
//           backgroundColor: '#000',
//           backgroundGradientFrom: '#000',
//           backgroundGradientTo: '#000',
//           decimalPlaces: 0,
//           color: () => `#00FF00`,
//         }}
//         style={styles.chart}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//     paddingTop: 60,
//     alignItems: 'center',
//   },
//   status: {
//     color: '#fff',
//     marginBottom: 10,
//   },
//   chart: {
//     borderRadius: 8,
//   },
// });
