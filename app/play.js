// ConnectionLoading.js
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function ConnectionLoading() {
  // animated values for three pulses
  const scales = [useRef(new Animated.Value(0)).current,
                  useRef(new Animated.Value(0)).current,
                  useRef(new Animated.Value(0)).current];
  const opacities = [useRef(new Animated.Value(1)).current,
                     useRef(new Animated.Value(1)).current,
                     useRef(new Animated.Value(1)).current];

  useEffect(() => {
    scales.forEach((scale, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 500),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1,
              duration: 2000,
              easing: Easing.out(Easing.circle),
              useNativeDriver: true,
            }),
            Animated.timing(opacities[i], {
              toValue: 0,
              duration: 2000,
              easing: Easing.out(Easing.linear),
              useNativeDriver: true,
            }),
          ]),
          // reset
          Animated.timing(scale, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacities[i], {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  // base radius = 25% of min dimension
  const baseRadius = Math.min(width, height) * 0.25;

  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        {scales.map((scale, i) => (
          <Animated.View
            key={i}
            style={[
              styles.pulse,
              {
                width: baseRadius * 1.0,
                height: baseRadius * 1.0,
                borderRadius: baseRadius,
                transform: [
                  {
                    scale: scale.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 2.5], // from 1× to 3×
                    }),
                  },
                ],
                opacity: opacities[i],
              },
            ]}
          />
        ))}

        <View
          style={[
            styles.innerCircle,
            {
              width: baseRadius * 1.0,
              height: baseRadius * 1.0,
              borderRadius: (baseRadius * 1.0) / 2,
            },
          ]}
        />
      </View>
      <Text style={styles.label}>Connecting…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  center: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    backgroundColor: '#09f',
  },
  innerCircle: {
    backgroundColor: '#09f',
  },
  label: {
    marginTop: 80,
    fontSize: 18,
    color: '#333',
  },
});
