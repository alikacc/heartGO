import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";

export const PulseIndicator = () => {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  const interval = 1250;

  useEffect(() => {
    const animatePulse = (animatedValue, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: interval,
            delay,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animatePulse(pulse1, 0);
    animatePulse(pulse2, 400);
  }, [pulse1, pulse2]);

  const scale1 = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.6],
  });

  const opacity1 = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 0],
  });

  const scale2 = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.6],
  });

  const opacity2 = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 0],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulse,
          {
            transform: [{ scale: scale1 }],
            opacity: opacity1,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.pulse,
          {
            transform: [{ scale: scale2 }],
            opacity: opacity2,
          },
        ]}
      />
      <View style={styles.innerCircle}>
        <Image
          source={require("../assets/icon.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 300,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FF6060",
  },
  innerCircle: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FF6060",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 50,
    height: 50,
  },
});
