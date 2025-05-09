// PlotScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  useColorScheme,
} from "react-native";
import {
  CartesianChart,
  Line,
  Area,
  useChartPressState,
} from "victory-native";
import {
  Circle,
  LinearGradient,
  Text as SKText,
  vec,
} from "@shopify/react-native-skia";
import {useDerivedValue,useAnimatedReaction,runOnJS,type SharedValue} from "react-native-reanimated";

// ——— Dummy ECG Data ———
const DATA = Array.from({ length: 20 }, (_, i) => ({
  day: i,
  highTmp: 60 + Math.random() * 80,
}));

export default function PlotScreen() {
  // Chart press state
  const { state, isActive } = useChartPressState({ x: 0, y: { highTmp: 0 } });
  const [chartData] = useState(DATA);
// React state that will hold the “live” BPM
  const [bpm, setBpm] = useState(
  // initialize from the last point
  DATA[DATA.length - 1].highTmp.toFixed(0)
  );
  // Derived tooltip text
  const value = useDerivedValue(() => {
  return state.y.highTmp.value.value.toFixed(0);
  }, [state]);

// Mirror the shared‐value into React state
useAnimatedReaction(
() => {
// this runs on the UI thread whenever `value` changes
    return value.value;
    },
    (current, previous) => {
    // only call setBpm when it actually changes
    if (current !== previous) {
    runOnJS(setBpm)(current);
    }
    },
    // no dependencies needed
);

//   // Last point
//   const lastPoint = DATA[DATA.length - 1];
//   const heartRate = lastPoint.highTmp.toFixed(0);

  // Static date/time for demo
  const [startDate] = useState("14 Juni 2024");
  const [endDate] = useState("14 Juni 2024");
  const [lastTime] = useState("13:00 PM");

  const colorMode = useColorScheme();
  const textColor = colorMode === "dark" ? "#fff" : "#000";
  const bgColor = colorMode === "dark" ? "#000" : "#f5f7fa";

  return (
    <View style={[styles.screen, { backgroundColor: bgColor }]}>
      {/* Header title */}
      <Text style={[styles.header, { color: textColor }]}>Heart Rate</Text>

      {/* Date pickers */}
      <View style={styles.dateRow}>
        <TouchableOpacity style={styles.dateButton}>
          <Text style={styles.dateLabel}>Start Date</Text>
          <Text style={[styles.dateValue, { color: textColor }]}>
            {startDate} 
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateButton}>
          <Text style={styles.dateLabel}>End Date</Text>
          <Text style={[styles.dateValue, { color: textColor }]}>
            {endDate} ⌄
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chart container */}
      <View style={styles.chartContainer}>
        <CartesianChart
          data={DATA}
          xKey="day"
          yKeys={["highTmp"]}
          domainPadding={{ top: 30 }}
          chartPressState={state}
        >
          {({ points, chartBounds }) => (
            <>
              <Line
                points={points.highTmp}
                color="#09f"
                strokeWidth={2}
                animate={{ type: "timing", duration: 500 }}
              />
              <Area
                points={points.highTmp}
                y0={chartBounds.bottom}
                animate={{ type: "timing", duration: 500 }}
              >
                <LinearGradient
                  start={vec(0, chartBounds.bottom - 100)}
                  end={vec(0, chartBounds.bottom)}
                  colors={["#09f80", "#09f20"]}
                />
              </Area>

              {/* Highlight and tooltip at touch */}
              {isActive && (
                <>
                  <Circle
                    cx={state.x.position}
                    cy={state.y.highTmp.position}
                    r={6}
                    color="#09f"
                    opacity={0.9}
                  />
                </>
              )}
            </>
          )}
        </CartesianChart>
      </View>

      {/* Last-point date & time */}
      <View style={styles.infoRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{endDate}</Text>
        </View>
        <Text style={[styles.infoTime, { color: textColor }]}>{lastTime}</Text>
      </View>

      {/* Main reading */}
      <View style={styles.readingRow}>
        <Text style={[styles.readingValue, { color: textColor }]}>
          {bpm}
        </Text>
        <Text style={[styles.readingUnit, { color: textColor }]}>BPM</Text>
      </View>
      <Text style={[styles.status, { color: textColor }]}>is normal</Text>

      {/* Footer info */}
      <View style={styles.footerBox}>
        <Text style={styles.footerText}>
          Denyut jantung mengukur berapa kali jantung berdetak per menit (bpm).
          Denyut jantung normal biasanya berkisar antara 60–100 BPM. Memantau
          detak jantung membantu mengidentifikasi tingkat stres.
        </Text>
      </View>
    </View>
  );
}

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#09f",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 12,
    color: "#555",
  },
  dateValue: {
    fontSize: 14,
  },
  chartContainer: {
    width: width - 40,
    height: 240,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#09f",
    padding: 10,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: {
    backgroundColor: "#09f",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
  },
  infoTime: {
    fontSize: 12,
  },
  readingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  readingValue: {
    fontSize: 48,
    fontWeight: "bold",
  },
  readingUnit: {
    fontSize: 18,
    marginLeft: 4,
  },
  status: {
    fontSize: 16,
    marginBottom: 12,
  },
  footerBox: {
    backgroundColor: "#def0ff",
    borderRadius: 12,
    padding: 12,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 16,
    color: "#333",
  },
});
