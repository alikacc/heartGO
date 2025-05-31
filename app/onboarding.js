import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.sequence([
      // Logo animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Text animation (slightly delayed)
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to home after 5 seconds
    const timer = setTimeout(() => {
      router.push('/home');
    }, 5000);

    // Cleanup timer
    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, slideAnim, router]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E3F2FD', '#BBDEFB', '#90CAF9']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Logo Container */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Replace this Image source with your actual logo path */}
            <Image
              source={require('./assets/heart-logo.png')} // MODIFY THIS PATH WITH YOUR LOGO
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Text Container */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.appName}>heartGO</Text>
            <Text style={styles.tagline}>your heart buddy on</Text>
            <Text style={styles.tagline}>the go</Text>
          </Animated.View>
        </View>

        {/* Loading indicator */}
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.loadingDots}>
            <Animated.View style={[styles.dot, styles.dot1]} />
            <Animated.View style={[styles.dot, styles.dot2]} />
            <Animated.View style={[styles.dot, styles.dot3]} />
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 360,
    height: 360,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00BCD4',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00BCD4',
    marginHorizontal: 4,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
});