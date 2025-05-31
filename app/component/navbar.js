import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const NavigationBar = ({
  onHomePress,
  onPlayPress,
  onStatsPress,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  // Determine active state based on current path - each button only active on its target page
  const isHomeActive = pathname === '/home';
  const isPlayActive = pathname === '/scan_device';
  const isStatsActive = pathname === '/historical';

  return (
    <View style={styles.footer}>
      {/* Home Button */}
      <TouchableOpacity
        style={styles.footerButton}
        onPress={onHomePress ?? (() => router.push('/home'))}
      >
        <Ionicons
          name={isHomeActive ? "home" : "home-outline"}
          size={28}
          color={isHomeActive ? theme.colors.primary : theme.colors.text}
        />
      </TouchableOpacity>

      {/* Play Button */}
      <TouchableOpacity
        style={styles.playButton}
        onPress={onPlayPress ?? (() => router.push('/scan_device'))}
      >
        <Ionicons name="play" size={32} color={theme.colors.primary} />
      </TouchableOpacity>

      {/* Stats Button */}
      <TouchableOpacity
        style={styles.footerButton}
        onPress={onStatsPress ?? (() => router.push('/historical'))}
      >
        <Ionicons
          name={isStatsActive ? "stats-chart" : "stats-chart-outline"}
          size={28}
          color={isStatsActive ? theme.colors.primary : theme.colors.text}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm + 2,
    paddingBottom: 34, // Safe area for iOS
  },
  footerButton: {
    flex: 1,
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 32,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm + 2,
  },
});

export default NavigationBar;
