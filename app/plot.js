// import React from 'react'
// import {
//   View,
//   Text,
//   StyleSheet,
//   Dimensions,
//   ScrollView
// } from 'react-native'
// import Svg, { Line, Path } from 'react-native-svg'
// import ecgData from './ecg.json'

// /** ECG paper specs **/
// const SMALL_SQ      = 8     // 1 mm = 8 px
// const LARGE_EVERY   = 5     // darker line every 5 mm
// const MM_PER_MV     = 10    // 10 mm per 1 mV vertically
// const MM_PER_SEC    = 25    // 25 mm per 1 s horizontally
// const SAMPLING_RATE = 320   // Hz

// export default function ECGWithGrid({ data = ecgData }) {
//   if (!Array.isArray(data) || data.length === 0) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.placeholder}>
//           No ECG data to display
//         </Text>
//       </View>
//     )
//   }

//   // screen dimensions
//   const { width: screenW, height: H } = Dimensions.get('window')

//   // horizontal scale: px per second
//   const pxPerSec = MM_PER_SEC * SMALL_SQ

//   // how many seconds fit per “page”?
//   const secsPerPage = screenW / pxPerSec

//   // total duration of recording
//   const totalSecs = (data.length - 1) / SAMPLING_RATE

//   // how many pages?
//   const pages = Math.ceil(totalSecs / secsPerPage)

//   // vertical scale
//   const pxPerMv   = MM_PER_MV * SMALL_SQ
//   const baselineY = H / 2

//   // grid line counts for each page
//   const vCount = Math.ceil(screenW / SMALL_SQ)
//   const hCount = Math.ceil(H / SMALL_SQ)

//   return (
//     <View style={styles.container}>
//       <ScrollView
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         style={{ flex: 1 }}
//         contentContainerStyle={{ height: H }}
//       >
//         {Array.from({ length: pages }).map((_, pageIndex) => {
//           // start/end times for this page
//           const t0 = pageIndex * secsPerPage
//           const t1 = t0 + secsPerPage

//           // build path only for points in [t0, t1]
//           const pathData = data
//             .map((pt, i) => {
//               const tSec = pt.Time / SAMPLING_RATE
//               if (tSec < t0 || tSec > t1) return null
//               const x = (tSec - t0) * pxPerSec
//               const y = baselineY - (pt.ECG_Lead1 * 1000) * pxPerMv
//               return `${pathData == null && i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
//             })
//             .filter(Boolean)
//             .map((cmd, i) => (i === 0 ? cmd.replace(/^L/, 'M') : cmd))
//             .join(' ')

//           return (
//             <Svg
//               key={pageIndex}
//               width={screenW}
//               height={H}
//             >
//               {/* vertical grid */}
//               {Array.from({ length: vCount }).map((_, i) => {
//                 const x = i * SMALL_SQ
//                 const major = i % LARGE_EVERY === 0
//                 return (
//                   <Line
//                     key={`v${pageIndex}-${i}`}
//                     x1={x} y1={0}
//                     x2={x} y2={H}
//                     stroke={major ? '#bbb' : '#eee'}
//                     strokeWidth={major ? 1 : 0.5}
//                   />
//                 )
//               })}
//               {/* horizontal grid */}
//               {Array.from({ length: hCount }).map((_, i) => {
//                 const y = i * SMALL_SQ
//                 const major = i % LARGE_EVERY === 0
//                 return (
//                   <Line
//                     key={`h${pageIndex}-${i}`}
//                     x1={0} y1={y}
//                     x2={screenW} y2={y}
//                     stroke={major ? '#bbb' : '#eee'}
//                     strokeWidth={major ? 1 : 0.5}
//                   />
//                 )
//               })}
//               {/* ECG trace */}
//               <Path
//                 d={pathData}
//                 fill="none"
//                 stroke="grey"
//                 strokeWidth={1}
//               />
//             </Svg>
//           )
//         })}
//       </ScrollView>
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   placeholder: {
//     color: '#999',
//     fontStyle: 'italic',
//     textAlign: 'center',
//     marginTop: 20,
//   },
// })

import React from 'react'
import { View, Button, Dimensions, StyleSheet } from 'react-native'
import * as Print from 'expo-print'
import { shareAsync } from 'expo-sharing'
import ecgData from './ecg.json'  // your pre-converted JSON

/** ECG paper specs **/
const SMALL_SQ      = 8    // 1 mm = 8 px
const LARGE_EVERY   = 5    // darker line every 5 mm
const MM_PER_MV     = 10   // 10 mm per 1 mV vertically
const MM_PER_SEC    = 25   // 25 mm per 1 s horizontally
const SAMPLING_RATE = 320  // Hz

export default function ECGReportScreen() {
  // screen dims
  const { width: screenW, height: screenH } = Dimensions.get('window')

  // compute total duration & pixel width
  const totalSecs  = (ecgData.length - 1) / SAMPLING_RATE
  const pxPerSec   = MM_PER_SEC * SMALL_SQ       // px per second
  const widthPx    = totalSecs * pxPerSec
  const heightPx   = screenH                     // use screen height for SVG

  // build grid lines array
  const gridLines = []
  const vCount = Math.ceil(widthPx  / SMALL_SQ)
  const hCount = Math.ceil(heightPx / SMALL_SQ)

  for (let i = 0; i < vCount; i++) {
    const x     = i * SMALL_SQ
    const major = i % LARGE_EVERY === 0
    gridLines.push({ x1: x, y1: 0, x2: x, y2: heightPx, major })
  }
  for (let j = 0; j < hCount; j++) {
    const y     = j * SMALL_SQ
    const major = j % LARGE_EVERY === 0
    gridLines.push({ x1: 0, y1: y, x2: widthPx, y2: y, major })
  }

  // build ECG path string
  const pxPerMv   = MM_PER_MV * SMALL_SQ          // px per mV
  const baselineY = heightPx / 2                  // vertical center
  const pathData  = ecgData.map((pt, i) => {
    const tSec = pt.Time / SAMPLING_RATE
    const x    = tSec * pxPerSec
    const y    = baselineY - (pt.ECG_Lead1 * 1000) * pxPerMv
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  // generate the full HTML + SVG string
  const html = `
  <html>
    <head>
      <meta name="viewport" content="width=${widthPx}, height=${heightPx}" />
      <style>
        body { margin: 0; padding: 0; }
        .header {
          font-family: sans-serif;
          font-size: 14px;
          text-align: center;
          margin-top: 8px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        Enhanced Filter · Mains Filter: 50 Hz · Scale: 25 mm/s, 10 mm/mV
      </div>
      <svg width="${widthPx}" height="${heightPx}" xmlns="http://www.w3.org/2000/svg">
        ${gridLines.map(line => `
          <line
            x1="${line.x1}" y1="${line.y1}"
            x2="${line.x2}" y2="${line.y2}"
            stroke="${line.major ? '#bbb' : '#eee'}"
            stroke-width="${line.major ? 1 : 0.5}"
          />
        `).join('')}
        <path d="${pathData}"
              fill="none"
              stroke="black"
              stroke-width="1.2"
        />
      </svg>
    </body>
  </html>`

  // trigger PDF generation & share
  const handlePrint = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html })
      await shareAsync(uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
      })
    } catch (err) {
      console.error('Error generating PDF', err)
    }
  }

  return (
    <View style={styles.container}>
      <Button
        title="Generate ECG Report"
        onPress={handlePrint}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
})
