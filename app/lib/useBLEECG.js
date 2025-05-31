/* useBLEECG.js */
import { useState, useEffect, useRef } from 'react';
import { Buffer } from 'buffer';
import manager from './ble';   // ← your BleManager singleton

export default function useBLEECGNO(deviceId, shouldStop = false) {
  // Use a single state object for both leads
  const [samples, setSamples] = useState({ lead1: [], lead2: [] });
  const [totalSamples, setTotalSamples] = useState(0);
  const subRef = useRef(null);
  const isStoppedRef = useRef(false); // Track if we've already stopped

  useEffect(() => {
    let isMounted = true;

    // If shouldStop is true, disconnect but DON'T clear the data
    if (shouldStop && !isStoppedRef.current) {
      console.log('Stopping BLE connection due to shouldStop flag - PRESERVING DATA');
      isStoppedRef.current = true;

      if (subRef.current) {
        subRef.current.remove();
        subRef.current = null;
      }
      manager.cancelDeviceConnection(deviceId);

      // DON'T clear the samples - keep the data!
      console.log(`📊 BLE stopped - Data preserved: Lead1=${samples.lead1.length}, Lead2=${samples.lead2.length}`);
      return;
    }

    // If already stopped, don't try to reconnect
    if (shouldStop) {
      return;
    }

    (async () => {
      try {
        let device = await manager.devices([deviceId]).then(ds => ds[0]);
        if (!device) device = await manager.connectToDevice(deviceId);
        await device.discoverAllServicesAndCharacteristics();

        // pick first notifiable characteristic
        const svcs = await device.services();
        let ecgChar = null;
        for (const svc of svcs) {
          const chars = await svc.characteristics();
          ecgChar = chars.find(c => c.isNotifiable);
          if (ecgChar) break;
        }
        if (!ecgChar) {
          console.warn('No notifiable characteristic found');
          return;
        }

        // monitor & parse
        subRef.current = ecgChar.monitor((err, c) => {
          if (err || !c?.value) return;
          if (!isMounted || shouldStop) return; // Don't process if component unmounted or should stop

          const buffer = Buffer.from(c.value, 'base64');
          const lead1 = [];
          const lead2 = [];

          for (let i = 0; i + 5 < buffer.length; i += 6) {
            // raw 24-bit values
            let v1 = (buffer[i] << 16) |
              (buffer[i + 1] << 8) |
              buffer[i + 2];
            let v2 = (buffer[i + 3] << 16) |
              (buffer[i + 4] << 8) |
              buffer[i + 5];

            // normalize & scale to V (per your formula)
            let max = 0xC35000;
            let res1 = ((2 * v1 / max) - 1) * (2.4 / 3.5);
            let res2 = ((2 * v2 / max) - 1) * (2.4 / 3.5);
            lead1.push(res1);
            lead2.push(res2);
          }

          setSamples(prev => {
            const all1 = [...prev.lead1, ...lead1];
            const all2 = [...prev.lead2, ...lead2];

            console.log(`📈 useBLEECG samples updated:`);
            console.log(`  New samples in this packet: ${lead1.length}`);
            console.log(`  Lead1 total: ${all1.length}`);
            console.log(`  Lead2 total: ${all2.length}`);

            return {
              lead1: all1,
              lead2: all2
            };
          });

          setTotalSamples(prev => {
            const newTotal = prev + lead1.length;
            console.log(`📈 useBLEECG Total samples: ${newTotal}`);
            return newTotal;
          });
        });
      } catch (e) {
        console.warn('BLE ECG init failed:', e.message);
      }
    })();

    return () => {
      isMounted = false;
      if (subRef.current) {
        subRef.current.remove();
        subRef.current = null;
      }
      // Only disconnect if not already stopped
      if (!isStoppedRef.current) {
        manager.cancelDeviceConnection(deviceId);
      }
    };
  }, [deviceId, shouldStop]); // Add shouldStop to dependencies

  return {
    lead1: samples.lead1 || [],
    lead2: samples.lead2 || [],
    totalSamples,
    isStopped: isStoppedRef.current
  };
}