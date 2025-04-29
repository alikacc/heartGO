import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';
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
                  
                  // Baca isi buffer dan diubah jadi array lead 1 dan lead 2
                  // Indeks 0 berarti sample pertama, indeks 1 sample kedua, dst
                  const lead1 = [];
                  const lead2 = [];
                  for (let i = 0; i <= buffer.length - 6; i += 6){
                    // Gabung 3 byte buat lead 1
                    let valLead1 = (buffer[i] << 16) | (buffer[i+1] << 8) | buffer[i+2]
                    if (valLead1 & 0x800000) valLead1 |= 0xFF000000;
                  
                    // Gabung 3 byte buat lead 2
                    let valLead2 = (buffer[i+3] << 16) | (buffer[i+4] << 8) | buffer[i+5]
                    if (valLead2 & 0x800000) valLead2 |= 0xFF000000;
                    
                    // Masukin nilai ke array
                    const index = i/6;
                    lead1[index] = valLead1;
                    lead2[index] = valLead2;
                  }
                  // Buat display engga aku setup karena engga tau caranya

                  // const intValue = buffer.readInt32LE(0); // Change to readInt16LE if needed

                  // setValue(intValue);
                  // setStatus(`Receiving from ${name}`);
                  // setEcgData(prev => [...prev.slice(-99), intValue]); // keep last 100 points
                  setValue(`Lead1: ${lead1[lead1.length - 1]}, Lead2: ${lead2[lead2.length - 1]}`);
                  setStatus(`Receiving from ${name}`);
                  setEcgData(prev => [...prev.slice(-50), { lead1, lead2 }]); // keep recent 50 frames

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
      <Text style={styles.label}>Latest ECG Sample:</Text>
      <Text style={styles.value}>{value}</Text>

      <ScrollView style={{ maxHeight: 200, marginTop: 20, width: '100%' }}>
        {ecgData.map((frame, index) => (
          <View key={index} style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
            <Text style={{ color: '#ccc' }}>
              {frame.lead1.map((v, i) => `L1[${i}]=${v}`).join(' | ')}
            </Text>
            <Text style={{ color: '#aaa', fontSize: 12 }}>
              {frame.lead2.map((v, i) => `L2[${i}]=${v}`).join(' | ')}
            </Text>
          </View>
        ))}
      </ScrollView>


      <View style={{ marginTop: 40 }}>
        <Button
          title="Go to home"
          onPress={() =>
            router.push({
              pathname: '/home',
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