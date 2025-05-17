// PlotScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  useColorScheme,
  StatusBar,
  SafeAreaView,
  Platform,
} from "react-native";
import {
  CartesianChart,
  Line,
  Area,
  useChartPressState,
} from "victory-native";
import { Circle, LinearGradient, vec } from "@shopify/react-native-skia";
import NavigationBar from "./component/navbar";
import {
  useDerivedValue,
  useAnimatedReaction,
  runOnJS,
  type SharedValue,
} from "react-native-reanimated";
import Header from './component/header';

const DATA = Array.from({ length: 20 }, (_, i) => ({
  day: i,
  highTmp: 60 + Math.random() * 80,
}));

export default function PlotScreen() {
  // — chart press + derived bpm —
  const { state, isActive } = useChartPressState({ x: 0, y: { highTmp: 0 } });
  const [bpm, setBpm] = useState(DATA[DATA.length - 1].highTmp.toFixed(0));
  const value = useDerivedValue(
    () => state.y.highTmp.value.value.toFixed(0),
    [state]
  );
  useAnimatedReaction(
    () => value.value,
    (cur, prev) => {
      if (cur !== prev) runOnJS(setBpm)(cur);
    }
  );

  // — static date/time for demo —
  const [startDate] = useState("14 Juni 2024");
  const [endDate] = useState("14 Juni 2024");
  const [lastTime] = useState("13:00 PM");

  // — theme colors —
  const colorMode = useColorScheme();
  const textColor = colorMode === "dark" ? "#fff" : "#000";
  const bgColor = colorMode === "dark" ? "#000" : "#f5f7fa";

  // — compute axis ticks & domain —
  const yVals = DATA.map((d) => d.highTmp);
  const yMin = Math.min(...yVals);
  const yMax = Math.max(...yVals);
  const yCount = 5;
  const yStep = (yMax - yMin) / (yCount - 1);
  const yTicks = Array.from({ length: yCount }, (_, i) =>
    Math.round(yMin + yStep * i)
  ).reverse();

  const xCount = 5;
  const xStep = Math.floor((DATA.length - 1) / (xCount - 1));
  const xTicks = Array.from({ length: xCount }, (_, i) =>
    DATA[Math.min(i * xStep, DATA.length - 1)].day
  );

  // — dimensions —
  const { width } = Dimensions.get("window");
  const chartHeight = 240;
  const yAxisWidth = 40;
  const chartWidth = width - 40 - yAxisWidth;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <Header title="Profile" />
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: bgColor,
            paddingTop:
              Platform.OS === "android" ? StatusBar.currentHeight : 0,
          },
        ]}
      >
        <View style={styles.container}>
          {/* Title */}
          <Text style={[styles.header, { color: textColor }]}>
            Heart Rate
          </Text>

          {/* Date Pickers */}
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

          {/* Chart + Axes */}
          <View style={styles.chartWrapper}>
            {/* Y‐axis labels */}
            <View style={styles.yAxis}>
              {yTicks.map((y, i) => (
                <Text
                  key={i}
                  style={[styles.axisLabel, { color: textColor }]}
                >
                  {y}
                </Text>
              ))}
            </View>

            {/* Plot + X‐axis */}
            <View style={styles.plotAndXAxis}>
              <View style={styles.chartContainer}>
                {/* manual grid */}
                <View style={styles.gridOverlay}>
                  {yTicks.map((_, i) => (
                    <View
                      key={"h" + i}
                      style={{
                        position: "absolute",
                        top: (i * chartHeight) / (yTicks.length - 1),
                        left: 0,
                        right: 0,
                        borderTopWidth: 1,
                        borderTopColor: "#ccc",
                      }}
                    />
                  ))}
                  {xTicks.map((_, i) => (
                    <View
                      key={"v" + i}
                      style={{
                        position: "absolute",
                        left: (i * chartWidth) / (xTicks.length - 1),
                        top: 0,
                        bottom: 0,
                        borderLeftWidth: 1,
                        borderLeftColor: "#ccc",
                      }}
                    />
                  ))}
                </View>

                {/* Victory chart with exact Y‐domain */}
                <CartesianChart
                  data={DATA}
                  xKey="day"
                  yKeys={["highTmp"]}
                  domain={{ y: [yMin, yMax] }}           // ← force full domain
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
                      {isActive && (
                        <Circle
                          cx={state.x.position}
                          cy={state.y.highTmp.position}
                          r={6}
                          color="#09f"
                          opacity={0.9}
                        />
                      )}
                    </>
                  )}
                </CartesianChart>
              </View>

              {/* X‐axis labels */}
              <View style={styles.xAxis}>
                {xTicks.map((x, i) => (
                  <Text
                    key={i}
                    style={[styles.axisLabel, { color: textColor }]}
                  >
                    {x}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {/* Info below chart */}
          <View style={styles.infoRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{endDate}</Text>
            </View>
            <Text style={[styles.infoTime, { color: textColor }]}>
              {lastTime}
            </Text>
          </View>

          <View style={styles.readingRow}>
            <Text style={[styles.readingValue, { color: textColor }]}>
              {bpm}
            </Text>
            <Text style={[styles.readingUnit, { color: textColor }]}>
              BPM
            </Text>
          </View>
          <Text style={[styles.status, { color: textColor }]}>
            is normal
          </Text>

          <View style={styles.footerBox}>
            <Text style={styles.footerText}>
              Denyut jantung mengukur ... membantu mengidentifikasi tingkat stres.
            </Text>
          </View>
        </View>
      </SafeAreaView>
      <NavigationBar />
    </View>
  );
}

const { width } = Dimensions.get("window");
const chartHeight = 240;
const yAxisWidth = 40;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },

  dateRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
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
  dateLabel: { fontSize: 12, color: "#555" },
  dateValue: { fontSize: 14 },

  chartWrapper: { flexDirection: "row", marginBottom: 12 },
  yAxis: {
    width: yAxisWidth,
    height: chartHeight,
    justifyContent: "space-between",
  },
  plotAndXAxis: { flex: 1 },
  chartContainer: {
    position: "relative",
    width: width - 40 - yAxisWidth,
    height: chartHeight,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#09f",
    padding: 10,
  },
  gridOverlay: StyleSheet.absoluteFillObject,
  xAxis: {
    height: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  axisLabel: { fontSize: 10 },

  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  badge: { backgroundColor: "#09f", borderRadius: 20, padding: 6, marginRight: 10 },
  badgeText: { color: "#fff", fontSize: 12 },
  infoTime: { fontSize: 12 },

  readingRow: { flexDirection: "row", alignItems: "flex-end" },
  readingValue: { fontSize: 48, fontWeight: "bold" },
  readingUnit: { fontSize: 18, marginLeft: 4 },
  status: { fontSize: 16, marginBottom: 12 },

  footerBox: { backgroundColor: "#def0ff", borderRadius: 12, padding: 12 },
  footerText: { fontSize: 12, lineHeight: 16, color: "#333" },

  navbarWrapper: {
    borderTopWidth: 1,
    borderColor: "#EEE",
    backgroundColor: "#FFF",
    paddingVertical: 8,
  },
});



