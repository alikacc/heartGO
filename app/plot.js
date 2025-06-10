import React from 'react'
import { View, Button, Dimensions, StyleSheet } from 'react-native'
import * as Print from 'expo-print'
import { shareAsync } from 'expo-sharing'
// Remove the dummy data import
// import ecgData from './coco.json'  // REMOVED - we'll use real data now

/** Constants **/
const SMALL_SQ = 8        // px per 1 mm
const LARGE_SQ = SMALL_SQ * 5   // px per 5 mm
const FRAME_W = LARGE_SQ * 5    // 25 mm = 1 s
const FRAME_H = LARGE_SQ * 10   // 50 mm
const COLS = 8        // frames per row (1 frame = 1 s)
const ROWS = 4        // rows per page
const PX_PER_SEC = 25 * SMALL_SQ  // 25 mm/s → px/s
const PX_PER_MV = 10 * SMALL_SQ   // 10 mm/mV → px/mV
const SAMPLE_RATE = 320  // Hz

// Modified function to accept real ECG data as parameter
export async function generateECGPDF(realEcgData) {
  const pageW = FRAME_W * COLS
  const pageH = FRAME_H * ROWS

  // Ensure pageW is a multiple of LARGE_SQ for complete boxes
  const completeLargeBoxes = Math.ceil(pageW / LARGE_SQ)
  const adjustedPageW = completeLargeBoxes * LARGE_SQ

  const framesPerPage = COLS * ROWS  // seconds per page

  // Calculate total duration from data length and sample rate
  const totalSeconds = realEcgData.length / SAMPLE_RATE
  const totalFrames = Math.ceil(totalSeconds)
  const numPages = Math.ceil(totalFrames / framesPerPage)

  // Total samples from the real data
  const totalSamples = realEcgData.length

  // keys and labels for the six leads - using your filtered data structure
  const leadKeys = [
    'filteredLead1',
    'filteredLead2',
    'filteredLead3',
    'filteredAVR',
    'filteredAVL',
    'filteredAVF'
  ]
  const leadLabels = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF']

  // Build HTML for each page
  const pagesHtml = Array.from({ length: numPages }).map((_, pageIdx) => {
    const startSecond = pageIdx * framesPerPage
    const endSecond = startSecond + framesPerPage

    // Convert to sample indices
    const startSample = Math.floor(startSecond * SAMPLE_RATE)
    const endSample = Math.min(Math.floor(endSecond * SAMPLE_RATE), realEcgData.length)

    // Divide page into six equal vertical strips
    const segmentHeight = pageH / 6

    // 1) Generate one <path> per lead
    const leadPaths = leadKeys.map((key, leadIdx) => {
      let d = ''
      let firstPoint = true

      for (let i = startSample; i < endSample; i++) {
        // Calculate time relative to start of this page
        const t = (i / SAMPLE_RATE) - startSecond
        const x = t * PX_PER_SEC

        // vertical center of this strip
        const yCenter = leadIdx * segmentHeight + segmentHeight / 2

        // Get voltage value - handle case where data might be missing
        const voltage = realEcgData[key] && realEcgData[key][i] ? realEcgData[key][i] : 0
        // Convert voltage to pixels (assuming voltage is already in mV)
        const y = yCenter - (voltage * PX_PER_MV)

        const cmd = `${firstPoint ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
        d += cmd + ' '
        firstPoint = false
      }

      return d.trim()
    })

    // 2) Generate grid lines (vertical + horizontal)
    const gridLines = []
    const colsSmall = adjustedPageW / SMALL_SQ
    const rowsSmall = pageH / SMALL_SQ

    // vertical lines
    for (let i = 0; i <= colsSmall; i++) {
      const x = i * SMALL_SQ
      const isMajor = i % 5 === 0
      gridLines.push(`
        <line
          x1="${x}" y1="0"
          x2="${x}" y2="${pageH}"
          stroke="${isMajor ? '#bbb' : '#eee'}"
          stroke-width="${isMajor ? 1 : 0.5}"
        />`)
    }

    // horizontal lines
    for (let j = 0; j <= rowsSmall; j++) {
      const y = j * SMALL_SQ
      const isMajor = j % 5 === 0
      gridLines.push(`
        <line
          x1="0" y1="${y}"
          x2="${adjustedPageW}" y2="${y}"
          stroke="${isMajor ? '#bbb' : '#eee'}"
          stroke-width="${isMajor ? 1 : 0.5}"
        />`)
    }

    // Add vertical thick lines every 5 large boxes
    const thickVerticalLines = []
    const colsLarge = adjustedPageW / LARGE_SQ
    for (let i = 0; i <= colsLarge; i += 5) {
      const x = i * LARGE_SQ
      thickVerticalLines.push(`
        <line
          x1="${x}" y1="0"
          x2="${x}" y2="${pageH}"
          stroke="#000"
          stroke-width="2"
        />`)
    }

    // 3) Add labels and paths
    const labelsAndPaths = leadPaths.map((d, idx) => {
      const yLabel = idx * segmentHeight + 14  // 14 px down for label
      const label = leadLabels[idx]
      return `
        <text
          x="4"
          y="${yLabel.toFixed(1)}"
          font-size="14"
          font-family="sans-serif"
          fill="#000"
        >${label}</text>
        <path
          d="${d}"
          fill="none"
          stroke="#000"
          stroke-width="1.2"
        />`
    }).join('\n')

    return `
      <div class="page">
        <div class="header">
          Enhanced Filter · Mains Filter: 50 Hz · Scale: 25 mm/s, 10 mm/mV
          Total Samples: ${totalSamples} · Duration: ${totalSeconds.toFixed(1)}s
        </div>
        <svg
          width="${adjustedPageW}"
          height="${pageH}"
          xmlns="http://www.w3.org/2000/svg"
        >
          ${gridLines.join('\n')}
          ${thickVerticalLines.join('\n')}
          ${labelsAndPaths}
        </svg>
      </div>`
  }).join('\n')

  // Full HTML with A4 portrait layout
  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=${adjustedPageW}, height=${pageH}" />
        <style>
          @page { size: A4 portrait; margin: 0 }
          body { margin: 0; padding: 0; }
          .total-samples {
            font-family: sans-serif;
            font-size: 12px;
            text-align: left;
            padding: 4px 8px;
            font-weight: bold;
          }
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

  try {
    const { uri } = await Print.printToFileAsync({ html })
    await shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' })
    return true
  } catch (err) {
    console.error('PDF generation error', err)
    return false
  }
}

// Modified standalone function - now requires data to be passed in
export async function generateStandaloneECGPDF(realEcgData) {
  if (!realEcgData) {
    console.error('No ECG data provided to generateStandaloneECGPDF')
    return false
  }

  return await generateECGPDF(realEcgData)
}

// Keep the React component for backwards compatibility, but it won't work without data
export default function ECGReportScreen({ ecgData }) {
  const handlePrint = async () => {
    if (!ecgData) {
      console.error('No ECG data provided to ECGReportScreen')
      return
    }

    try {
      await generateECGPDF(ecgData)
    } catch (err) {
      console.error('PDF generation error', err)
    }
  }

  return (
    <View style={styles.container}>
      <Button
        title="Generate ECG PDF"
        onPress={handlePrint}
        disabled={!ecgData}
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