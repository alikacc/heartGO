import React from 'react'
import { View, Button, Dimensions, StyleSheet } from 'react-native'
import * as Print from 'expo-print'
import { shareAsync } from 'expo-sharing'
import ecgData from './csvjson.json'  // your ECG JSON

/** Constants **/
const SMALL_SQ      = 8    // px per 1 mm
const LARGE_SQ      = SMALL_SQ * 5   // px per 5 mm
const FRAME_W       = LARGE_SQ * 5   // px per 5 large cols (25 mm = 1 s)
const FRAME_H       = LARGE_SQ * 10  // px per 10 large rows (50 mm)
const COLS          = 8    // frames per row
const ROWS          = 4    // rows per page
const PX_PER_SEC    = 25 * SMALL_SQ  // 25 mm/s → px/s
const PX_PER_MV     = 10 * SMALL_SQ  // 10 mm/mV → px/mV
const SAMPLE_RATE   = 320  // Hz
const STROKE        = 2
const HALF_STROKE   = STROKE / 2

export default function ECGReportScreen() {
  const { width: screenW } = Dimensions.get('window')
  const pageW = FRAME_W * COLS
  const pageH = FRAME_H * ROWS
  const framesPerPage = COLS * ROWS

  // total number of 1-second frames in data
  const totalFrames = Math.floor(ecgData[ecgData.length - 1].Time / SAMPLE_RATE) + 1
  const numPages = Math.ceil(totalFrames / framesPerPage)

  // Precompute absolute X for each sample
  const xs = ecgData.map(pt => (pt.Time / SAMPLE_RATE) * PX_PER_SEC)

  // Build HTML pages
  const pagesHtml = Array.from({ length: numPages }).map((_, pageIdx) => {
    const startFrame = pageIdx * framesPerPage
    const endFrame   = startFrame + framesPerPage

    // 1) Build ECG <path> for this page
    let prevFrame = -1
    const commands = ecgData.reduce((acc, pt, i) => {
      const tSec     = pt.Time / SAMPLE_RATE
      const frameIdx = Math.floor(tSec)
      if (frameIdx < startFrame || frameIdx >= endFrame) return acc

      const col = (frameIdx - startFrame) % COLS
      const row = Math.floor((frameIdx - startFrame) / COLS)
      const xInFrame = (tSec - frameIdx) * PX_PER_SEC
      const x = col * FRAME_W + xInFrame
      const y = row * FRAME_H + FRAME_H/2 - (pt.ECG_Lead1 * 1000) * PX_PER_MV

      acc.push((frameIdx !== prevFrame ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1))
      prevFrame = frameIdx
      return acc
    }, []).join(' ')

    // 2) Grid lines (minor + major)
    const grid = []
    const colsSmall = pageW / SMALL_SQ
    const rowsSmall = pageH / SMALL_SQ
    for (let i = 0; i <= colsSmall; i++) {
      const x = i * SMALL_SQ
      const major = i % 5 === 0
      grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="${pageH}"
        stroke="${major ? '#bbb' : '#eee'}" stroke-width="${major ? 1 : 0.5}" />`)
    }
    for (let j = 0; j <= rowsSmall; j++) {
      const y = j * SMALL_SQ
      const major = j % 5 === 0
      grid.push(`<line x1="0" y1="${y}" x2="${pageW}" y2="${y}"
        stroke="${major ? '#bbb' : '#eee'}" stroke-width="${major ? 1 : 0.5}" />`)
    }

    // 3) Frame borders inset by half stroke
    const borders = []
    for (let c = 0; c <= COLS; c++) {
      const x = c * FRAME_W - HALF_STROKE
      borders.push(`<line x1="${x}" y1="0" x2="${x}" y2="${pageH}"
        stroke="#000" stroke-width="${STROKE}" />`)
    }
    for (let r = 0; r <= ROWS; r++) {
      const y = r * FRAME_H - HALF_STROKE
      borders.push(`<line x1="0" y1="${y}" x2="${pageW}" y2="${y}"
        stroke="#000" stroke-width="${STROKE}" />`)
    }

    // 4) Combine into one SVG
    return `
      <div class="page">
        <div class="header">
          Enhanced Filter · Mains Filter: 50 Hz · Scale: 25 mm/s, 10 mm/mV
        </div>
        <svg width="${pageW}" height="${pageH}" xmlns="http://www.w3.org/2000/svg">
          ${grid.join('\n')}
          ${borders.join('\n')}
          <path d="${commands}" fill="none" stroke="#000" stroke-width="1.2"/>
        </svg>
      </div>`
  }).join('\n')

  // 5) Full HTML with A4 portrait layout
  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=${pageW}, height=${pageH}" />
        <style>
          @page { size: A4 portrait; margin: 0 }
          body { margin:0; padding:0; }
          .header {
            font-family: sans-serif;
            font-size: 12px;
            text-align: right;
            padding: 8px;
          }
          .page { page-break-after: always; }
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
    </html>`

  // 6) Print to PDF & share
  const handlePrint = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html })
      await shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' })
    } catch (err) {
      console.error('PDF generation error', err)
    }
  }

  return (
    <View style={styles.container}>
      <Button title="Generate ECG PDF Report" onPress={handlePrint}/>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center',
    padding: 16, backgroundColor: '#fff',
  },
})
