import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Animated } from 'react-native';
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const iconFadeAnim = useRef(new Animated.Value(1)).current;

  // Determine active state based on current path - each button only active on its target page
  const isHomeActive = pathname === '/home';
  const isPlayActive = pathname === '/scan_device';
  const isStatsActive = pathname === '/historical';

  useEffect(() => {
    const startAnimation = () => {
      // Fade out icon, fade in text
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(iconFadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        })
      ]).start(() => {
        // Wait a bit with the text visible
        setTimeout(() => {
          // Fade in icon, fade out text
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(iconFadeAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            })
          ]).start(() => {
            // Wait a bit with the icon visible before starting next cycle
            setTimeout(startAnimation, 2000);
          });
        }, 2000);
      });
    };

    startAnimation();

    // Cleanup animation when component unmounts
    return () => {
      fadeAnim.stopAnimation();
      iconFadeAnim.stopAnimation();
    };
  }, []);

  const handlePlayPress = () => {
    if (onPlayPress) {
      onPlayPress();
    } else {
      router.push('/scan_device');
    }
  };

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
        <Text style={[
          styles.buttonText,
          isHomeActive && styles.activeButtonText
        ]}>HOME</Text>
      </TouchableOpacity>

      {/* Play Button */}
      <View style={styles.playButtonContainer}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={handlePlayPress}
        >
          <Animated.View style={{ opacity: iconFadeAnim }}>
            <Ionicons
              name="play"
              size={32}
              color={isPlayActive ? theme.colors.surface : theme.colors.primary}
            />
          </Animated.View>
          <Animated.Text
            style={[
              styles.animatedText,
              { opacity: fadeAnim }
            ]}
          >
            RECORD{'\n'}ECG
          </Animated.Text>
        </TouchableOpacity>
      </View>

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
        <Text style={[
          styles.buttonText,
          isStatsActive && styles.activeButtonText
        ]}>HISTORY</Text>
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
    paddingTop: theme.spacing.sm,
    paddingBottom: 34, // Safe area for iOS
  },
  footerButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  buttonText: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  activeButtonText: {
    color: theme.colors.primary,
  },
  playButtonContainer: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
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
  },
  animatedText: {
    position: 'absolute',
    fontSize: theme.fontSizes.xs,
    color: theme.colors.primary,
    textAlign: 'center',
    width: '100%',
    lineHeight: theme.fontSizes.xs * 1.2,
  },
});

export default NavigationBar;
