// app/_layout.js
import React from 'react'
import { BLEProvider } from './BLEContext'   // adjust path if needed
import { UserProvider } from './UserContext'  // Add this import
import { Stack } from 'expo-router'
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  })

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null // or loading screen
  }

  return (
    <UserProvider>
      <BLEProvider>
        <Stack
          initialRouteName="storage"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="plot"
            options={{ title: 'Welcome' }}
          />
          {/* <Stack.Screen name="storage" /> */}
          <Stack.Screen name="scan_device" />
          <Stack.Screen name="pdfGenerator" />
          {/* <Stack.Screen name="plotplot" /> */}
          <Stack.Screen name="history" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="storage" />
          <Stack.Screen name="play" />
          <Stack.Screen name="historical" />
          <Stack.Screen name="summary" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="UserSwitcher" />
          <Stack.Screen name="simple-recording" />
          <Stack.Screen
            name="parameter"
            options={({ route }) => ({
              headerShown: true,               // show native header
              title: route.params.parameter,   // e.g. "Heartbeat"
            })}
          />
        </Stack>
      </BLEProvider>
    </UserProvider>
  )
}
