import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface NavigationBarProps {
  onHomePress?: () => void;
  onPlayPress: () => void;
  onStatsPress?: () => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  onHomePress,
  onPlayPress,
  onStatsPress,
}) => {
  const router = useRouter();

  return (
    <View style={styles.footer}>
      {/* Home Button */}
      <TouchableOpacity
        style={styles.footerButton}
        onPress={onHomePress ?? (() => router.push('/home'))}
      >
        <Ionicons name="home-outline" size={28} color="#333" />
      </TouchableOpacity>

      {/* Play Button */}
      <TouchableOpacity style={styles.playButton} onPress={onPlayPress ?? (() => router.push('/scan_device'))}>
        <Ionicons name="play" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Stats Button */}
      <TouchableOpacity
        style={styles.footerButton}
        onPress={onStatsPress ?? (() => router.push('/historical'))}
      >
        <Ionicons name="stats-chart-outline" size={28} color="#333" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#FFF',
    paddingVertical: 10,
  },
  footerButton: {
    flex: 1,
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#09f',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
});

export default NavigationBar;
