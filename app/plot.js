// import React, { useState } from "react";
// import { View, useColorScheme } from "react-native";
// import {
//   CartesianChart,
//   Line,
//   Area,
//   useChartPressState,
// } from "victory-native";
// import {
//   Circle,
//   LinearGradient,
//   Text as SKText,
//   vec,
// } from "@shopify/react-native-skia";
// import { useDerivedValue, type SharedValue } from "react-native-reanimated";

// // Inline data
// const DATA = Array.from({ length: 31 }, (_, i) => ({
//   day: i,
//   highTmp: 40 + 30 * Math.random(),
// }));

// const DATA2 = Array.from({ length: 31 }, (_, i) => ({
//   day: i,
//   highTmp: 40 + 10 * Math.random(),
// }));

// export const LineChart = () => {
//   const { state, isActive } = useChartPressState({ x: 0, y: { highTmp: 0 } });
//   const colorMode = useColorScheme();
//   const [chartData, setChartData] = useState(DATA);

//   const value = useDerivedValue(() => {
//     return "$" + state.y.highTmp.value.value.toFixed(2);
//   }, [state]);

//   const labelColor = colorMode === "dark" ? "white" : "black";

//   return (
//     <View
//       style={{
//         flex: 1,
//         backgroundColor: colorMode === "dark" ? "#000" : "#fff",
//         alignItems: "center",
//         paddingHorizontal: 10,
//         paddingVertical: 30,
//       }}
//     >
//       <View style={{ width: "95%", height: "60%", paddingTop: 10 }}>
//         <CartesianChart
//           data={chartData}
//           xKey="day"
//           yKeys={["highTmp"]}
//           domainPadding={{ top: 30 }}
//           chartPressState={state}
//         >
//           {({ points, chartBounds }) => (
//             <>
//               <SKText
//                 x={chartBounds.left + 10}
//                 y={40}
//                 text={value.value}
//                 size={18}
//                 color={labelColor}
//                 style="fill"
//               />
//               <Line
//                 points={points.highTmp}
//                 color="lightgreen"
//                 strokeWidth={3}
//                 animate={{ type: "timing", duration: 500 }}
//               />
//               <Area
//                 points={points.highTmp}
//                 y0={chartBounds.bottom}
//                 animate={{ type: "timing", duration: 500 }}
//               >
//                 <LinearGradient
//                   start={vec(chartBounds.bottom, 200)}
//                   end={vec(chartBounds.bottom, chartBounds.bottom)}
//                   colors={["green", "#90ee9050"]}
//                 />
//               </Area>
//               {isActive && (
//                 <ToolTip x={state.x.position} y={state.y.highTmp.position} />
//               )}
//             </>
//           )}
//         </CartesianChart>
//       </View>
//     </View>
//   );
// };

// function ToolTip({ x, y }: { x: SharedValue<number>; y: SharedValue<number> }) {
//   return <Circle cx={x} cy={y} r={8} color="grey" opacity={0.8} />;
// }
