import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface NavigationBarProps {
  onHomePress: () => void;
  onPlayPress: () => void;
  onMenuPress: () => void;
}

const navbar = ({ onHomePress, onPlayPress, onMenuPress }: NavigationBarProps) => {
  return (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.footerButton} onPress={onHomePress}>
        <Text style={styles.footerIcon}>⌂</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.playButton} onPress={onPlayPress}>
        <Text style={styles.playIcon}>▶</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.footerButton} onPress={onMenuPress}>
        <Text style={styles.footerIcon}>☰</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#FFF',
  },
  footerButton: {
    padding: 10,
  },
  footerIcon: {
    fontSize: 24,
    color: '#333',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#09f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 30,
    color: '#FFF',
  },
});

export default navbar;
