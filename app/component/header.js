import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
  },
  container: {
    height: 56,               // fixed toolbar height
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,    // horizontal gutter
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    padding: 8,               // touch target padding
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  title: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});

export default Header;
