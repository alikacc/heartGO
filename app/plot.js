import React from 'react'
import { View, Button, Dimensions, StyleSheet, Alert } from 'react-native'
import * as Print from 'expo-print'
import { shareAsync } from 'expo-sharing'
import * as FileSystem from 'expo-file-system'
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

// Function to generate the cover page HTML
const generateCoverPage = (userData, measurementData) => {
  const {
    name = 'Unknown',
    birthday = 'Unknown',
    gender = 'Unknown'
  } = userData || {};

  const {
    heartRate = 0,
    recordingDate = new Date().toLocaleString(),
    duration = '30s',
    tags = [],
    notes = '',
    qtInterval = 0,
    qrsDuration = 0,
    heartVariance = 0
  } = measurementData || {};

  // Determine heart rate classification
  let determination = 'Normal';
  if (heartRate > 100) {
    determination = 'Tachycardia';
  } else if (heartRate < 60) {
    determination = 'Bradycardia';
  }

  // Format additional information
  let additionalInfo = 'No additional information to display';
  if (tags.length > 0 || notes.trim()) {
    const tagText = tags.length > 0 ? `Tags: ${tags.join(', ')}` : '';
    const noteText = notes.trim() ? `Notes: ${notes}` : '';
    additionalInfo = [tagText, noteText].filter(Boolean).join('\n');
  }

  return `
    <div class="cover-page">
      <div class="header-section">
        <div class="logo-section">
          <img src="file:///android_asset/hand.jpg" alt="HeartGo Logo" class="logo-image" />
        </div>
        <div class="title-section">
          <h1>EKG Recording</h1>
        </div>
      </div>

      <div class="patient-section">
        <h2 class="patient-name">${name}</h2>
        <div class="patient-details">
          <p><strong>DOB:</strong> ${birthday}</p>
          <p><strong>Sex:</strong> ${gender}</p>
        </div>
      </div>

      <div class="divider"></div>

      <div class="recording-overview">
        <h3>EKG Recording Overview</h3>
        
        <div class="determination-section">
          <h4>HeartGo Determination</h4>
          <p class="determination">${determination}</p>
        </div>

        <div class="recording-details">
          <div class="detail-row">
            <span class="detail-label">Recorded:</span>
            <span class="detail-value">${recordingDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Heart Rate:</span>
            <span class="detail-value">${heartRate} BPM</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Duration:</span>
            <span class="detail-value">${duration}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">QT Interval:</span>
            <span class="detail-value">${qtInterval} ms</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">QRS Duration:</span>
            <span class="detail-value">${qrsDuration} ms</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Heart Variance:</span>
            <span class="detail-value">${heartVariance} ms</span>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="additional-info">
        <h3>Additional Information</h3>
        <p class="info-content">${additionalInfo}</p>
      </div>

      <div class="footer-section">
        <div class="disclaimer">
          <p>HeartGo does not check for heart attack. If you believe you are having a medical emergency, call emergency services. HeartGo does not provide medical advice or services, and any information from HeartGo is provided to assist you and your doctor with your medical care and not as a replacement for consulting with your doctor.</p>
        </div>
        <div class="logo-bottom">
          <div class="company-logo">HeartGo</div>
        </div>
      </div>
    </div>
  `;
};

// Modified function to accept real ECG data as parameter
export async function generateECGPDF(realEcgData, userData = null, measurementData = null) {
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

  // Build HTML for each ECG page
  const ecgPagesHtml = Array.from({ length: numPages }).map((_, pageIdx) => {
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

  // Generate cover page with user and measurement data
  const coverPageHtml = generateCoverPage(userData, {
    ...measurementData
  });

  // Full HTML with A4 portrait layout
  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=${adjustedPageW}, height=${pageH}" />
        <style>
          @page { size: A4 portrait; margin: 0 }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
          
          /* Cover page styles */
          .cover-page {
            page-break-after: always;
            padding: 40px;
            height: 100vh;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }
          
          .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
          }
          
          .logo-image {
            max-width: 120px;
            max-height: 80px;
            object-fit: contain;
          }
          
          .title-section h1 {
            margin: 0;
            font-size: 24px;
            font-weight: normal;
            color: #2c3e50;
          }
          
          .patient-section {
            margin-bottom: 30px;
          }
          
          .patient-name {
            font-size: 32px;
            font-weight: bold;
            margin: 0 0 15px 0;
            color: #2c3e50;
          }
          
          .patient-details p {
            margin: 5px 0;
            font-size: 16px;
            color: #2c3e50;
          }
          
          .divider {
            height: 3px;
            background: linear-gradient(to right, #2EB5FA,rgb(46, 121, 250));
            margin: 30px 0;
          }
          
          .recording-overview h3 {
            font-size: 22px;
            margin: 0 0 20px 0;
            color: #2c3e50;
          }
          
          .determination-section h4 {
            font-size: 18px;
            margin: 0 0 10px 0;
            color: #2c3e50;
          }
          
          .determination {
            font-size: 20px;
            font-weight: bold;
            margin: 0 0 25px 0;
            color: #2c3e50;
          }
          
          .recording-details {
            margin-bottom: 30px;
          }
          
          .detail-row {
            display: flex;
            margin-bottom: 8px;
          }
          
          .detail-label {
            font-weight: bold;
            min-width: 150px;
            color: #2c3e50;
          }
          
          .detail-value {
            color: #2c3e50;
          }
          
          .additional-info {
            flex-grow: 1;
          }
          
          .additional-info h3 {
            font-size: 22px;
            margin: 0 0 15px 0;
            color: #2c3e50;
          }
          
          .info-content {
            font-size: 14px;
            color: #2c3e50;
            white-space: pre-line;
          }
          
          .footer-section {
            margin-top: auto;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 10px;
            color: #666;
          }
          
          .disclaimer {
            flex: 1;
            max-width: 400px;
            margin-right: 20px;
          }
          
          .company-info {
            text-align: center;
          }
          
          .company-logo {
            font-size: 24px;
            font-weight: bold;
            color: #16a085;
          }
          
          .page-number {
            margin-top: 10px;
            font-size: 12px;
            color: #999;
          }
          
          /* ECG page styles */
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
        ${coverPageHtml}
        ${ecgPagesHtml}
      </body>
    </html>`

  try {
    const { uri } = await Print.printToFileAsync({ html })
    return uri
  } catch (err) {
    console.error('PDF generation error', err)
    return null
  }
}

// Modified standalone function - now requires data to be passed in
export const generateStandaloneECGPDF = async (ecgData, filePath = null, userData = null, measurementData = null) => {
  if (!ecgData) {
    console.error('No ECG data provided to generateStandaloneECGPDF')
    return false
  }

  try {
    const uri = await generateECGPDF(ecgData, userData, measurementData)

    if (filePath) {
      // Save to specific path instead of sharing
      await FileSystem.moveAsync({
        from: uri,
        to: filePath
      });
      console.log('✅ PDF saved to:', filePath);
      return true;
    } else {
      // Use your existing sharing behavior
      if (await shareAsync.isAvailableAsync()) {
        await shareAsync.shareAsync(uri);
      } else {
        Alert.alert('Success', `File saved to ${uri}`);
      }
      return true;
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

// Keep the React component for backwards compatibility, but it won't work without data
export default function ECGReportScreen({ ecgData, userData, measurementData }) {
  const handlePrint = async () => {
    if (!ecgData) {
      console.error('No ECG data provided to ECGReportScreen')
      return
    }

    try {
      await generateECGPDF(ecgData, userData, measurementData)
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