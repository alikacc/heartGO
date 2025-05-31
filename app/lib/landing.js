// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Button,
//   ScrollView,
//   Platform,
//   Alert,
// } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { BleManager } from 'react-native-ble-plx';
// import { Buffer } from 'buffer';
// import * as FileSystem from 'expo-file-system';
// import * as Sharing from 'expo-sharing';

// import manager from './ble'; // adjust path as needed

// export default function useBLEECG(deviceId, shouldStop = false) {
//   const { id } = useLocalSearchParams();

//   const [samples, setSamples] = useState({ lead1: [], lead2: [] });
//   const [totalSamples, setTotalSamples] = useState(0);
//   const subscriptionRef = useRef(null);
//   const characteristicRef = useRef(null);

//   // connect, monitor and parse
//   useEffect(() => {

//     if (shouldStop) {
//       console.log('Stopping BLE connection due to shouldStop flag');
//       if (subscriptionRef.current) {
//         subscriptionRef.current.remove();
//         subscriptionRef.current = null;
//       }
//       manager.cancelDeviceConnection(deviceId);
//       setSamples({ lead1: [], lead2: [] }); // Clear both at once
//       setTotalSamples(0); // Reset total samples
//       return;
//     }

//     (async () => {
//       try {
//         const device = await manager.devices([id]).then((d) => d[0]);
//         if (!device) {
//           console.log('Device not found or not connected.');
//           return;
//         }
//         await device.discoverAllServicesAndCharacteristics();
//         if (Platform.OS === 'android') {
//           try {
//             await device.requestMTU(247);
//           } catch { }
//         }

//         const services = await device.services();
//         for (const service of services) {
//           for (const char of await service.characteristics()) {
//             if (char.isNotifiable) {
//               characteristicRef.current = char;

//               // Auto-start notifications immediately
//               console.log('Starting notifications automatically...');
//               subscriptionRef.current = char.monitor((err, c) => {
//                 if (err) {
//                   console.log('Monitor error:', err);
//                   return;
//                 }

//                 const buffer = Buffer.from(c.value, 'base64');
//                 const lead1 = [];
//                 const lead2 = [];

//                 for (let i = 0; i + 5 < buffer.length; i += 6) {
//                   let v1 = (buffer[i] << 16) | (buffer[i + 1] << 8) | buffer[i + 2];
//                   let v2 = (buffer[i + 3] << 16) | (buffer[i + 4] << 8) | buffer[i + 5];

//                   let max = 0xC35000;
//                   let res1 = ((2 * v1 / max) - 1) * (2.4 / 3.5) * 1000;
//                   let res2 = ((2 * v2 / max) - 1) * (2.4 / 3.5) * 1000;
//                   lead1.push(res1);
//                   lead2.push(res2);
//                 }

//                 // Store samples using setSamples like useBLEECG
//                 setSamples(prev => {
//                   const all1 = [...prev.lead1, ...lead1];
//                   const all2 = [...prev.lead2, ...lead2];

//                   console.log(`📈 Landing.js samples updated:`);
//                   console.log(`  New samples in this packet: ${lead1.length}`);
//                   console.log(`  Lead1 total: ${all1.length}`);
//                   console.log(`  Lead2 total: ${all2.length}`);
//                   console.log(`  Latest Lead1 samples:`, lead1);
//                   console.log(`  Latest Lead2 samples:`, lead2);

//                   return {
//                     lead1: all1,
//                     lead2: all2
//                   };
//                 });

//                 setTotalSamples(prev => {
//                   const newTotal = prev + lead1.length;
//                   console.log(`📈 Landing.js Total samples: ${newTotal}`);
//                   return newTotal;
//                 });
//               });

//               return;
//             }
//           }
//         }
//         console.log('No notifiable characteristic found.');
//       } catch (error) {
//         console.log('Connection failed:', error);
//       }
//     })();

//     return () => {
//       subscriptionRef.current?.remove();
//       manager.cancelDeviceConnection(id);
//     };
//   }, [deviceId, shouldStop]);

//   return {
//     lead1: samples.lead1 || [],
//     lead2: samples.lead2 || [],
//     totalSamples
//   };
// }

/* useBLEECG.js - FIXED VERSION */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Buffer } from 'buffer';
import manager from './ble';

export default function useBLEECG(deviceId, shouldStop = false) {
  // Use refs to store data to avoid re-render bottlenecks
  const lead1DataRef = useRef([]);
  const lead2DataRef = useRef([]);
  
  // State for triggering re-renders (updated less frequently)
  const [samples, setSamples] = useState({ lead1: [], lead2: [] });
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  
  const subRef = useRef(null);
  const deviceRef = useRef(null);
  const updateTimeoutRef = useRef(null);

  // Batch update function to reduce re-renders
  const batchUpdateSamples = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      setSamples({
        lead1: [...lead1DataRef.current],
        lead2: [...lead2DataRef.current]
      });
      setLastUpdateTime(Date.now());
    }, 100); // Update UI every 100ms instead of every packet
  }, []);

  useEffect(() => {
    let isMounted = true;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;

    // Clear data when shouldStop is true
    if (shouldStop) {
      console.log('Stopping BLE connection due to shouldStop flag');
      
      // Clean up subscription
      if (subRef.current) {
        subRef.current.remove();
        subRef.current = null;
      }
      
      // Clean up timeouts
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      
      // Disconnect device
      if (deviceRef.current) {
        manager.cancelDeviceConnection(deviceId);
        deviceRef.current = null;
      }
      
      // Clear all data
      lead1DataRef.current = [];
      lead2DataRef.current = [];
      setSamples({ lead1: [], lead2: [] });
      return;
    }

    const connectAndStart = async () => {
      try {
        console.log('Connecting to device:', deviceId);
        
        // Connect to device
        let device = await manager.devices([deviceId]).then(ds => ds[0]);
        if (!device || !device.isConnected) {
          console.log('Device not connected, connecting...');
          device = await manager.connectToDevice(deviceId, {
            requestMTU: 512, // Request larger MTU for better throughput
            connectionPriority: 1, // High priority connection
            autoConnect: false
          });
        }
        
        deviceRef.current = device;
        
        console.log('Discovering services...');
        await device.discoverAllServicesAndCharacteristics();

        // Find ECG characteristic
        const svcs = await device.services();
        let ecgChar = null;
        
        for (const svc of svcs) {
          const chars = await svc.characteristics();
          ecgChar = chars.find(c => c.isNotifiable);
          if (ecgChar) {
            console.log('Found notifiable characteristic:', ecgChar.uuid);
            break;
          }
        }
        
        if (!ecgChar) {
          throw new Error('No notifiable characteristic found');
        }

        console.log('Starting ECG monitoring...');
        
        // Monitor characteristic with optimized settings
        subRef.current = ecgChar.monitor((err, characteristic) => {
          if (err) {
            console.error('BLE monitor error:', err);
            return;
          }
          
          if (!characteristic?.value || !isMounted) {
            return;
          }

          try {
            const buffer = Buffer.from(characteristic.value, 'base64');
            
            // Ensure we have complete samples (6 bytes per sample pair)
            const numSamples = Math.floor(buffer.length / 6);
            
            if (numSamples === 0) {
              return;
            }

            // Process all complete samples in the buffer
            for (let i = 0; i < numSamples; i++) {
              const offset = i * 6;
              
              // Extract 24-bit values for both leads
              let v1 = (buffer[offset] << 16) |
                      (buffer[offset + 1] << 8) |
                      buffer[offset + 2];
              let v2 = (buffer[offset + 3] << 16) |
                      (buffer[offset + 4] << 8) |
                      buffer[offset + 5];

              // Handle signed 24-bit conversion
              if (v1 & 0x800000) v1 -= 0x1000000;
              if (v2 & 0x800000) v2 -= 0x1000000;

              // Convert to millivolts
              const max = 0xC35000;
              const res1 = ((2 * v1 / max) - 1) * (2.4 / 3.5) * 1000;
              const res2 = ((2 * v2 / max) - 1) * (2.4 / 3.5) * 1000;

              // Store in refs (much faster than state updates)
              lead1DataRef.current.push(res1);
              lead2DataRef.current.push(res2);
            }

            // Log progress periodically
            if (lead1DataRef.current.length % 1000 === 0) {
              console.log(`Collected ${lead1DataRef.current.length} samples`);
            }

            // Batch update UI
            batchUpdateSamples();
            
          } catch (parseError) {
            console.error('Error parsing BLE data:', parseError);
          }
        }, 'ECGMonitor');

        console.log('ECG monitoring started successfully');
        reconnectAttempts = 0; // Reset on successful connection
        
      } catch (error) {
        console.error('BLE connection failed:', error);
        
        if (reconnectAttempts < maxReconnectAttempts && isMounted && !shouldStop) {
          reconnectAttempts++;
          console.log(`Retrying connection (${reconnectAttempts}/${maxReconnectAttempts})...`);
          setTimeout(() => {
            if (isMounted && !shouldStop) {
              connectAndStart();
            }
          }, 1000 * reconnectAttempts); // Exponential backoff
        }
      }
    };

    // Start connection
    connectAndStart();

    // Cleanup function
    return () => {
      console.log('Cleaning up BLE connection...');
      isMounted = false;
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      
      if (subRef.current) {
        subRef.current.remove();
        subRef.current = null;
      }
      
      if (deviceRef.current) {
        manager.cancelDeviceConnection(deviceId);
        deviceRef.current = null;
      }
    };
  }, [deviceId, shouldStop, batchUpdateSamples]);

  // Return current data from refs (most up-to-date) and state (for rendering)
  return {
    lead1: lead1DataRef.current || [],
    lead2: lead2DataRef.current || [],
    // Also provide state versions for React rendering
    lead1State: samples.lead1 || [],
    lead2State: samples.lead2 || [],
    sampleCount: lead1DataRef.current.length,
    lastUpdate: lastUpdateTime
  };
}