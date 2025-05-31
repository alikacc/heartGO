// BLEContext.js
import React, { createContext, useState, useEffect } from 'react'
import { BleManager } from 'react-native-ble-plx'

export const BLEContext = createContext({
  manager: null,
  device: null,
  isConnected: false,
  connect: async (id) => { },
  disconnect: async () => { }
})

export function BLEProvider({ children }) {
  const [manager] = useState(() => new BleManager())
  const [device, setDevice] = useState(null)
  const [isConnected, setConnected] = useState(false)

  // Connect by device ID
  const connect = async (id) => {
    try {
      const dev = await manager.connectToDevice(id)
      await dev.discoverAllServicesAndCharacteristics()
      setDevice(dev)
      setConnected(true)
      return dev
    } catch (e) {
      console.error('BLE connect error', e)
      setConnected(false)
      throw e
    }
  }

  // Disconnect current device
  const disconnect = async () => {
    if (device) {
      await manager.cancelDeviceConnection(device.id)
      setDevice(null)
      setConnected(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
  }, [manager])

  return (
    <BLEContext.Provider value={{
      manager,
      device,
      isConnected,
      connect,
      disconnect
    }}>
      {children}
    </BLEContext.Provider>
  )
}
