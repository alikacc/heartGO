// ECGWithGrid.js

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView
} from 'react-native'
import Svg, { Line, Path } from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import ecgData from './ecg.json'

/** ECG paper specs **/
const SMALL_SQ      = 8     // 1 mm = 8 px
const LARGE_EVERY   = 5     // darker line every 5 mm
const MM_PER_MV     = 10    // 10 mm per 1 mV vertically
const MM_PER_SEC    = 25    // 25 mm per 1 s horizontally
const SAMPLING_RATE = 320   // Hz

/** Header height **/
const HEADER_H = 100

export default function ECGWithGrid({ data = ecgData }) {
  // --- Timer logic ---
  const [timer, setTimer] = useState(30)
  useEffect(() => {
    const iv = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(iv)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholder}>
          No ECG data to display
        </Text>
      </View>
    )
  }

  // --- Layout dimensions ---
  const { width: screenW, height: screenH } = Dimensions.get('window')
  const plotH = screenH - HEADER_H

  // --- Scales ---
  const pxPerSec = MM_PER_SEC * SMALL_SQ
  const pxPerMv  = MM_PER_MV  * SMALL_SQ
  const baselineY = plotH / 2

  // --- Pagination ---
  const secsPerPage = screenW / pxPerSec
  const totalSecs   = (data.length - 1) / SAMPLING_RATE
  const pages       = Math.ceil(totalSecs / secsPerPage)

  // --- Grid counts ---
  const vCount = Math.ceil(screenW / SMALL_SQ)
  const hCount = Math.ceil(plotH  / SMALL_SQ)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Heart/BPM */}
        <View style={styles.headerItem}>
          <Ionicons name="heart" size={28} color="red" />
          <Text style={styles.headerText}>-- BPM</Text>
        </View>
        {/* Timer */}
        <View style={styles.headerItem}>
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{timer}</Text>
          </View>
          <Text style={styles.headerText}>Seconds</Text>
        </View>
        {/* Connection/Signal */}
        <View style={styles.headerItem}>
          <Ionicons name="wifi" size={28} color="green" />
          <Text style={styles.headerText}>Great Signal</Text>
        </View>
      </View>

      {/* ECG Plot, starts below header */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {Array.from({ length: pages }).map((_, pi) => {
          const t0 = pi * secsPerPage
          const t1 = t0 + secsPerPage
          let first = true

          // build path only for points in [t0, t1]
          const pathD = data
            .map(pt => {
              const t = pt.Time / SAMPLING_RATE
              if (t < t0 || t > t1) return null
              const x   = (t - t0) * pxPerSec
              const y   = baselineY - (pt.ECG_Lead1 * 1000) * pxPerMv
              const cmd = `${first ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
              first = false
              return cmd
            })
            .filter(Boolean)
            .join(' ')

          return (
            <Svg
              key={pi}
              width={screenW}
              height={plotH}
            >
              {/* vertical grid */}
              {Array.from({ length: vCount }).map((_, i) => {
                const x     = i * SMALL_SQ
                const major = i % LARGE_EVERY === 0
                return (
                  <Line
                    key={`v${pi}-${i}`}
                    x1={x} y1={0}
                    x2={x} y2={plotH}
                    stroke={major ? '#bbb' : '#eee'}
                    strokeWidth={major ? 1 : 0.5}
                  />
                )
              })}
              {/* horizontal grid */}
              {Array.from({ length: hCount }).map((_, i) => {
                const y     = i * SMALL_SQ
                const major = i % LARGE_EVERY === 0
                return (
                  <Line
                    key={`h${pi}-${i}`}
                    x1={0} y1={y}
                    x2={screenW} y2={y}
                    stroke={major ? '#bbb' : '#eee'}
                    strokeWidth={major ? 1 : 0.5}
                  />
                )
              })}
              {/* ECG trace */}
              <Path
                d={pathD}
                fill="none"
                stroke="grey"
                strokeWidth={1}
              />
            </Svg>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: HEADER_H,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  headerItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    marginTop: 4,
    fontSize: 14,
    color: '#333',
  },
  timerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    flex: 1,
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
    fontStyle: 'italic',
  },
})
