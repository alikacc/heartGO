import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  SafeAreaView,
  Button,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

import useECGAnalysis from './lib/analysis';
import { useUser } from './UserContext';
import { theme } from './styles/theme';
import { sharedStyles } from './styles/shared';
import Header from './component/header';
import ecgData from './ecg.json'  // your ECG JSON

/** Header height & duration **/
const HEADER_H = 100;

// Predefined tag options
const AVAILABLE_TAGS = [
  'Ablation',
  'Alcohol',
  'Altitude change',
  'Anxiety',
  'Caffeine',
  'Chest pain',
  'Dizziness',
  'Exercise',
  'Fatigue',
  'Medication',
  'Palpitations',
  'Rest',
  'Shortness of breath',
  'Sleep',
  'Stress',
];

/** Constants **/
const SMALL_SQ = 8;    // px per 1 mm
const LARGE_SQ = SMALL_SQ * 5;   // px per 5 mm
const FRAME_W = LARGE_SQ * 5;   // px per 5 large cols (25 mm = 1 s)
const FRAME_H = LARGE_SQ * 10;  // px per 10 large rows (50 mm)
const COLS = 8;    // frames per row
const ROWS = 4;    // rows per page
const PX_PER_SEC = 25 * SMALL_SQ;  // 25 mm/s → px/s
const PX_PER_MV = 10 * SMALL_SQ;  // 10 mm/mV → px/mV
const SAMPLE_RATE = 320;  // Hz
const STROKE = 2;
const HALF_STROKE = STROKE / 2;

export default function ECGWithGrid() {
  const router = useRouter();
  const { db, getCurrentUserTable, currentUser } = useUser();

  // 1) Fixed countdown timer using setInterval instead of requestAnimationFrame
  const [timer, setTimer] = useState(DURATION_SEC);
  const [shouldStopBLE, setShouldStopBLE] = useState(false);
  const [measurementComplete, setMeasurementComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const { id, recordingTime } = useLocalSearchParams();
  const DURATION_SEC = parseInt(recordingTime) || 30;

  // Add state for tags and notes
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [notes, setNotes] = useState('');
  const [showTagModal, setShowTagModal] = useState(false);

  // Add state for plot modal
  const [showPlotModal, setShowPlotModal] = useState(false);

  useEffect(() => {
    // Record the start time
    startTimeRef.current = Date.now();

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up interval that updates every 100ms for smoother countdown
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, DURATION_SEC - elapsed);

      setTimer(remaining);

      // When timer reaches 0, stop BLE and mark measurement complete
      if (remaining === 0) {
        clearInterval(intervalRef.current);
        setShouldStopBLE(true);
        setMeasurementComplete(true);
      }
    }, 100); // Update every 100ms for smooth countdown

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [DURATION_SEC]);

  // 2) Get raw samples from analysis hook
  const analysisData = useECGAnalysis(id, shouldStopBLE);
  const {
    rawLead1 = [],
    rawLead2 = [],
    filteredLead1 = [],
    filteredLead2 = [],
    filteredLead3 = [],
    filteredAVR = [],
    filteredAVL = [],
    filteredAVF = [],
    isProcessed = false,
    processCompleteData,
    heartvarianceDuration = 0,
    qtcDuration = 0,
    qrsDuration = 0,
    heartbeatDuration = 0
  } = analysisData || {};

  // Handle tag selection
  const handleTagSelection = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Add custom tag
  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  // Apply tags and close modal
  const applyTags = () => {
    if (customTag.trim()) {
      addCustomTag();
    }
    setShowTagModal(false);
    setCustomTag('');
  };

  // Show results modal when measurement is complete
  useEffect(() => {
    if (measurementComplete && !showResultsModal) {
      setShowResultsModal(true);
    }
  }, [measurementComplete]);

  // Process data when measurement is complete
  useEffect(() => {
    if (measurementComplete && !isProcessed && rawLead1.length > 0 && !isProcessing) {
      console.log('🔄 Measurement complete, processing data...');
      console.log(`Raw data available: Lead1=${rawLead1.length}, Lead2=${rawLead2.length}`);
      setIsProcessing(true);

      setTimeout(() => {
        try {
          const result = processCompleteData();
          console.log('✅ Processing completed:', result);
        } catch (error) {
          console.error('❌ Processing failed:', error);
        } finally {
          setIsProcessing(false);
        }
      }, 100);
    }
  }, [measurementComplete, isProcessed, rawLead1.length, processCompleteData, isProcessing]);

  // Add the missing handleManualProcess function
  const handleManualProcess = () => {
    if (rawLead1.length > 0 && rawLead2.length > 0) {
      console.log('🔄 Manual processing triggered...');
      setIsProcessing(true);

      setTimeout(() => {
        try {
          const result = processCompleteData();
          console.log('✅ Manual processing completed:', result);
        } catch (error) {
          console.error('❌ Manual processing failed:', error);
        } finally {
          setIsProcessing(false);
        }
      }, 100);
    } else {
      Alert.alert('No Data', 'No raw data available to process');
    }
  };

  // Function to export CSV
  const exportToCSV = async (data, filename) => {
    try {
      let csvContent = '';

      if (filename.includes('raw')) {
        // Raw data CSV
        csvContent = 'Sample,Lead1,Lead2\n';
        const maxLength = Math.max(data.rawLead1.length, data.rawLead2.length);
        for (let i = 0; i < maxLength; i++) {
          const lead1Val = i < data.rawLead1.length ? data.rawLead1[i] : '';
          const lead2Val = i < data.rawLead2.length ? data.rawLead2[i] : '';
          csvContent += `${i + 1},${lead1Val},${lead2Val}\n`;
        }
      } else {
        // Filtered data CSV
        csvContent = 'Sample,Lead_I,Lead_II,Lead_III,aVR,aVL,aVF\n';
        const maxLength = Math.max(
          data.filteredLead1.length,
          data.filteredLead2.length,
          data.filteredLead3.length,
          data.filteredAVR.length,
          data.filteredAVL.length,
          data.filteredAVF.length
        );
        for (let i = 0; i < maxLength; i++) {
          const lead1Val = i < data.filteredLead1.length ? data.filteredLead1[i] : '';
          const lead2Val = i < data.filteredLead2.length ? data.filteredLead2[i] : '';
          const lead3Val = i < data.filteredLead3.length ? data.filteredLead3[i] : '';
          const avrVal = i < data.filteredAVR.length ? data.filteredAVR[i] : '';
          const avlVal = i < data.filteredAVL.length ? data.filteredAVL[i] : '';
          const avfVal = i < data.filteredAVF.length ? data.filteredAVF[i] : '';
          csvContent += `${i + 1},${lead1Val},${lead2Val},${lead3Val},${avrVal},${avlVal},${avfVal}\n`;
        }
      }

      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', `File saved to ${fileUri}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Error', 'Failed to export CSV file');
    }
  };

  const handleExportRaw = () => {
    if (rawLead1.length === 0 && rawLead2.length === 0) {
      Alert.alert('No Data', 'No raw data available to export');
      return;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    exportToCSV({ rawLead1, rawLead2 }, `ecg_raw_data_${timestamp}.csv`);
  };

  const handleExportFiltered = () => {
    if (!isProcessed) {
      Alert.alert('Not Processed', 'Data has not been processed yet. Please process the data first.');
      return;
    }
    if (filteredLead1.length === 0) {
      Alert.alert('No Data', 'No filtered data available to export');
      return;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    exportToCSV({
      filteredLead1,
      filteredLead2,
      filteredLead3,
      filteredAVR,
      filteredAVL,
      filteredAVF
    }, `ecg_filtered_data_${timestamp}.csv`);
  };

  // Calculate sample counts
  const totalRawSamples = Math.max(rawLead1.length, rawLead2.length);
  const totalFilteredSamples = Math.max(
    filteredLead1.length,
    filteredLead2.length,
    filteredLead3.length,
    filteredAVR.length,
    filteredAVL.length,
    filteredAVF.length
  );

  console.log(`📱 ECG Page - Sample Counts:`);
  console.log(`  Raw Lead1: ${rawLead1.length}`);
  console.log(`  Raw Lead2: ${rawLead2.length}`);
  console.log(`  Total Raw Samples: ${totalRawSamples}`);
  console.log(`  Is Processed: ${isProcessed}`);
  if (isProcessed) {
    console.log(`  Filtered Lead1: ${filteredLead1.length}`);
    console.log(`  Total Filtered Samples: ${totalFilteredSamples}`);
  }

  // Determine the current status text
  const getStatusText = () => {
    if (!measurementComplete) {
      return 'Recording...';
    }
    if (isProcessing || !isProcessed) {
      return 'Filtering...';
    }
    return 'Finished!';
  };

  const renderTagItem = ({ item }) => (
    <TouchableOpacity
      style={styles.tagOption}
      onPress={() => handleTagSelection(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, selectedTags.includes(item) && styles.checkedBox]}>
        {selectedTags.includes(item) && (
          <Ionicons name="checkmark" size={14} color={theme.colors.surface} />
        )}
      </View>
      <Text style={styles.tagOptionText}>{item}</Text>
    </TouchableOpacity>
  );

  // Function to save ECG data to database
  const saveToDatabase = async () => {
    if (!db || !currentUser) {
      console.error('❌ Database or current user not available');
      Alert.alert('Error', 'Database not available');
      return false;
    }

    if (!isProcessed) {
      console.error('❌ Data not processed yet');
      Alert.alert('Error', 'Please process the data first');
      return false;
    }

    try {
      const tableName = getCurrentUserTable();

      // Create timestamp in the format expected by your database
      const timestamp = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(',', '');

      console.log(`💾 Saving ECG data to ${tableName} for user: ${currentUser.name}`);
      console.log(`📊 Data: HR=${heartbeatDuration}, QT=${qtcDuration}, QRS=${qrsDuration}, HRV=${heartvarianceDuration}`);

      // Insert the ECG analysis results with tags and notes
      await db.runAsync(`
        INSERT INTO ${tableName} (heartbeat, qt, qrs, heartvariance, timestamp, metadata)
        VALUES (?, ?, ?, ?, ?, ?);
      `,
        Math.round(heartbeatDuration),           // heartbeat
        Math.round(qtcDuration * 10) / 10,      // qt (rounded to 1 decimal)
        Math.round(qrsDuration * 10) / 10,      // qrs (rounded to 1 decimal)
        Math.round(heartvarianceDuration),       // heartvariance
        timestamp,                               // timestamp
        JSON.stringify({                         // metadata
          recordingDuration: DURATION_SEC,
          measurementId: id,
          tags: selectedTags,
          notes: notes.trim()
        })
      );

      console.log('✅ ECG data saved successfully to database');
      Alert.alert('Success', 'ECG measurement saved to your profile!', [
        { text: 'OK', onPress: () => router.push('/home') }
      ]);
      return true;

    } catch (error) {
      console.error('❌ Error saving to database:', error);
      Alert.alert('Error', 'Failed to save measurement to database');
      return false;
    }
  };

  // Function to handle plot download
  const handleDownloadPlot = () => {
    console.log('📈 Filtered Lead1 data length:', filteredLead1?.length);
    console.log('📈 Is processed:', isProcessed);

    if (!isProcessed || filteredLead1.length === 0) {
      Alert.alert('No Data', 'No filtered data available to plot. Please process the data first.');
      return;
    }
    setShowPlotModal(true);
  };

  // Function to handle PDF generation
  const handlePDFGeneration = async () => {
    try {
      const { width: screenW } = Dimensions.get('window');
      const pageW = FRAME_W * COLS;
      const pageH = FRAME_H * ROWS;
      const framesPerPage = COLS * ROWS;

      // Debug logging to see what data we're using
      console.log('🔍 Debugging ECG Plot Data:');
      console.log('Filtered Lead1 available:', !!filteredLead1);
      console.log('Filtered Lead1 length:', filteredLead1?.length);
      console.log('First 5 filtered values:', filteredLead1?.slice(0, 5));
      console.log('Last 5 filtered values:', filteredLead1?.slice(-5));

      // Use filtered data if provided, otherwise fall back to ecgData
      const ecgDataToUse = filteredLead1 ?
        filteredLead1.map((value, index) => ({
          Time: index, // Sample index as time
          ECG_Lead1: value  // Remove the /1000 here since we'll scale in the plotting
        })) :
        ecgData;

      console.log('Using filtered data:', !!filteredLead1);
      console.log('Data length being plotted:', ecgDataToUse.length);
      console.log('First 5 points to plot:', ecgDataToUse.slice(0, 5));

      if (!ecgDataToUse || ecgDataToUse.length === 0) {
        console.error('❌ No data available to plot!');
        Alert.alert('Error', 'No ECG data available to plot');
        return;
      }

      // total number of 1-second frames in data
      const totalFrames = Math.floor(ecgDataToUse[ecgDataToUse.length - 1].Time / SAMPLE_RATE) + 1;
      const numPages = Math.ceil(totalFrames / framesPerPage);

      console.log('Total frames:', totalFrames);
      console.log('Number of pages:', numPages);

      // Precompute absolute X for each sample
      const xs = ecgDataToUse.map(pt => (pt.Time / SAMPLE_RATE) * PX_PER_SEC);

      // Build HTML pages
      const pagesHtml = Array.from({ length: numPages }).map((_, pageIdx) => {
        const startFrame = pageIdx * framesPerPage;
        const endFrame = startFrame + framesPerPage;

        // 1) Build ECG <path> for this page
        let prevFrame = -1;
        let pointsPlotted = 0;
        console.log(`Building path for page ${pageIdx + 1}/${numPages}`);
        console.log(`Frame range: ${startFrame} to ${endFrame}`);

        const commands = ecgDataToUse.reduce((acc, pt, i) => {
          const tSec = pt.Time / SAMPLE_RATE;
          const frameIdx = Math.floor(tSec);
          if (frameIdx < startFrame || frameIdx >= endFrame) return acc;

          const col = (frameIdx - startFrame) % COLS;
          const row = Math.floor((frameIdx - startFrame) / COLS);
          const xInFrame = (tSec - frameIdx) * PX_PER_SEC;
          const x = col * FRAME_W + xInFrame;
          const y = row * FRAME_H + FRAME_H / 2 - (pt.ECG_Lead1 * 1000) * PX_PER_MV;  // Add *1000 here for proper scaling

          pointsPlotted++;
          if (pointsPlotted <= 5 || pointsPlotted >= ecgDataToUse.length - 5) {
            console.log(`Point ${pointsPlotted}: x=${x.toFixed(1)}, y=${y.toFixed(1)}, value=${pt.ECG_Lead1}`);
          }

          acc.push((frameIdx !== prevFrame ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1));
          prevFrame = frameIdx;
          return acc;
        }, []);

        console.log(`Total points plotted on page ${pageIdx + 1}: ${pointsPlotted}`);

        // 2) Grid lines (minor + major)
        const grid = [];
        const colsSmall = pageW / SMALL_SQ;
        const rowsSmall = pageH / SMALL_SQ;
        for (let i = 0; i <= colsSmall; i++) {
          const x = i * SMALL_SQ;
          const major = i % 5 === 0;
          grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="${pageH}"
            stroke="${major ? '#bbb' : '#eee'}" stroke-width="${major ? 1 : 0.5}" />`);
        }
        for (let j = 0; j <= rowsSmall; j++) {
          const y = j * SMALL_SQ;
          const major = j % 5 === 0;
          grid.push(`<line x1="0" y1="${y}" x2="${pageW}" y2="${y}"
            stroke="${major ? '#bbb' : '#eee'}" stroke-width="${major ? 1 : 0.5}" />`);
        }

        // 3) Frame borders inset by half stroke
        const borders = [];
        for (let c = 0; c <= COLS; c++) {
          const x = c * FRAME_W - HALF_STROKE;
          borders.push(`<line x1="${x}" y1="0" x2="${x}" y2="${pageH}"
            stroke="#000" stroke-width="${STROKE}" />`);
        }
        for (let r = 0; r <= ROWS; r++) {
          const y = r * FRAME_H - HALF_STROKE;
          borders.push(`<line x1="0" y1="${y}" x2="${pageW}" y2="${y}"
            stroke="#000" stroke-width="${STROKE}" />`);
        }

        // 4) Combine into one SVG
        return `
          <div class="page">
            <div class="header">
              Enhanced Filter · Mains Filter: 50 Hz · Scale: 25 mm/s, 10 mm/mV · Lead I
            </div>
            <svg width="${pageW}" height="${pageH}" xmlns="http://www.w3.org/2000/svg">
              ${grid.join('\n')}
              ${borders.join('\n')}
              <path d="${commands.join(' ')}" fill="none" stroke="#000" stroke-width="1.2"/>
            </svg>
          </div>`;
      }).join('\n');

      // 5) Full HTML with A4 portrait layout
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
        </html>`;

      // 6) Print to PDF & share
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch (err) {
      console.error('PDF generation error', err);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={sharedStyles.safeArea}>
        <Header title="ECG Measurement" />

        {/* Main Timer Display - Centered */}
        <View style={styles.mainContent}>
          <View style={styles.centerTimerContainer}>
            <View style={[styles.bigTimerCircle, timer <= 5 && styles.timerUrgent]}>
              <Text style={[styles.bigTimerText, timer <= 5 && styles.timerTextUrgent]}>
                {timer}s
              </Text>
            </View>
            <Text style={styles.bigTimerLabel}>{getStatusText()}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Results Modal */}
      <Modal
        visible={showResultsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Measurement Complete</Text>

            {/* Measurement Results */}
            <View style={styles.resultsSection}>
              <Text style={styles.sectionTitle}>Results</Text>

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Heart Rate</Text>
                <Text style={styles.resultValue}>
                  {isProcessed ? `${Math.round(heartbeatDuration)} bpm` : 'Processing...'}
                </Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>QT Interval</Text>
                <Text style={styles.resultValue}>
                  {isProcessed ? `${Math.round(qtcDuration * 10) / 10} ms` : 'Processing...'}
                </Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>QRS Duration</Text>
                <Text style={styles.resultValue}>
                  {isProcessed ? `${Math.round(qrsDuration * 10) / 10} ms` : 'Processing...'}
                </Text>
              </View>

              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Heart Variance</Text>
                <Text style={styles.resultValue}>
                  {isProcessed ? `${Math.round(heartvarianceDuration)} ms` : 'Processing...'}
                </Text>
              </View>
            </View>

            {/* Tags Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags <Text style={styles.optional}>(optional)</Text></Text>

              {selectedTags.length > 0 && (
                <View style={styles.selectedTagsContainer}>
                  {selectedTags.map((tag, index) => (
                    <View key={index} style={styles.selectedTag}>
                      <Text style={styles.selectedTagText}>{tag}</Text>
                      <TouchableOpacity
                        onPress={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-circle" size={16} color={theme.colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.button}
                onPress={() => setShowTagModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={theme.colors.textSecondary} />
                <Text style={styles.buttonText}>Add Tags</Text>
              </TouchableOpacity>
            </View>

            {/* Notes Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes <Text style={styles.optional}>(optional)</Text></Text>
              <Text style={styles.characterCount}>{notes.length}/200</Text>

              <TextInput
                style={styles.notesInput}
                placeholder="How did you feel? What were you doing?"
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={(text) => setNotes(text.slice(0, 200))}
                textAlignVertical="top"
                maxLength={200}
              />
            </View>

            {/* Export Buttons */}
            <View style={styles.exportSection}>
              <Text style={styles.sectionTitle}>Export Data</Text>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleExportRaw}
                disabled={totalRawSamples === 0}
              >
                <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.secondaryButtonText}>Export Raw Data CSV</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  (!isProcessed || isProcessing) && styles.disabledButton
                ]}
                onPress={handleExportFiltered}
                disabled={!isProcessed || isProcessing}
              >
                <Ionicons name="analytics-outline" size={20} color={!isProcessed || isProcessing ? '#999' : theme.colors.primary} />
                <Text style={[styles.secondaryButtonText, (!isProcessed || isProcessing) && { color: '#999' }]}>
                  {isProcessing ? 'Processing...' : 'Export Filtered Data CSV'}
                </Text>
              </TouchableOpacity>

              {/* New Download Plot Button */}
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  (!isProcessed || isProcessing) && styles.disabledButton
                ]}
                onPress={handleDownloadPlot}
                disabled={!isProcessed || isProcessing}
              >
                <Ionicons name="document-outline" size={20} color={!isProcessed || isProcessing ? '#999' : theme.colors.primary} />
                <Text style={[styles.secondaryButtonText, (!isProcessed || isProcessing) && { color: '#999' }]}>
                  {isProcessing ? 'Processing...' : 'Download ECG Plot (Lead I)'}
                </Text>
              </TouchableOpacity>

              {/* New PDF Generation Button */}
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  (!isProcessed || isProcessing) && styles.disabledButton
                ]}
                onPress={handlePDFGeneration}
                disabled={!isProcessed || isProcessing}
              >
                <Ionicons name="document-outline" size={20} color={!isProcessed || isProcessing ? '#999' : theme.colors.primary} />
                <Text style={[styles.secondaryButtonText, (!isProcessed || isProcessing) && { color: '#999' }]}>
                  {isProcessing ? 'Processing...' : 'Generate ECG PDF Report'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.primaryButton, !isProcessed && styles.disabledButton]}
              onPress={saveToDatabase}
              activeOpacity={isProcessed ? 0.8 : 1}
              disabled={!isProcessed}
            >
              <Text style={[styles.primaryButtonText, !isProcessed && styles.disabledButtonText]}>
                SAVE TO PROFILE
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Plot Modal */}
      <Modal
        visible={showPlotModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPlotModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ECG Plot - Lead I</Text>
            <TouchableOpacity
              onPress={() => setShowPlotModal(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.plotContainer}>
            <Button
              title="Generate ECG PDF Report"
              onPress={handlePDFGeneration}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Tag Selection Modal */}
      <Modal
        visible={showTagModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTagModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Tags</Text>
            <TouchableOpacity
              onPress={() => setShowTagModal(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.customTagInput}
            placeholder="Type custom tag here"
            value={customTag}
            onChangeText={setCustomTag}
            returnKeyType="done"
            onSubmitEditing={addCustomTag}
          />

          <FlatList
            data={AVAILABLE_TAGS}
            renderItem={renderTagItem}
            keyExtractor={(item, index) => index.toString()}
            style={styles.tagsList}
            showsVerticalScrollIndicator={false}
          />

          <TouchableOpacity
            style={styles.applyButton}
            onPress={applyTags}
            activeOpacity={0.8}
          >
            <Text style={styles.applyButtonText}>APPLY</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTimerContainer: {
    alignItems: 'center',
  },
  bigTimerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  timerUrgent: {
    borderColor: theme.colors.error,
    backgroundColor: '#ffeeee',
  },
  bigTimerText: {
    fontSize: 48,
    fontFamily: theme.fonts.bold,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
  },
  timerTextUrgent: {
    color: theme.colors.error,
  },
  bigTimerLabel: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.medium,
    color: theme.colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.fontSizes.xxl,
    fontFamily: theme.fonts.bold,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  resultsSection: {
    marginBottom: theme.spacing.xl,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base + 2,
    marginBottom: theme.spacing.sm,
  },
  resultLabel: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  resultValue: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.semiBold,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.primary,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.semiBold,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.base,
  },
  optional: {
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    fontWeight: 'normal',
  },
  characterCount: {
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginBottom: theme.spacing.xs,
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.base,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.lightBlue,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.xs + 2,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  selectedTagText: {
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary,
    marginRight: theme.spacing.xs + 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.base,
    paddingHorizontal: theme.spacing.lg,
  },
  buttonText: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.medium,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  notesInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.base,
    padding: theme.spacing.base,
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
    minHeight: 80,
  },
  exportSection: {
    marginVertical: 20,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.base,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.base,
  },
  secondaryButtonText: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.medium,
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.bold,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.surface,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  disabledButtonText: {
    color: '#666',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.semiBold,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text,
  },
  customTagInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.base,
    padding: theme.spacing.base,
    margin: theme.spacing.xl,
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
  },
  tagsList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tagOptionText: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  applyButtonText: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.bold,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.surface,
  },
  plotContainer: {
    flex: 1,
    padding: theme.spacing.lg,
  },
});