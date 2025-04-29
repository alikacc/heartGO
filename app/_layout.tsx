import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,  // 🔥 Global setting to hide header on all screens
      }}
    />
  );
}
