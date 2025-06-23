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
import { generateStandaloneECGPDF } from './plot';

import useECGAnalysis from './lib/analysis';
import { useUser } from './UserContext';
import { theme } from './styles/theme';
import { sharedStyles } from './styles/shared';
import Header from './component/header';

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
    startTimeRef.current = Date.now();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, DURATION_SEC - elapsed);

      setTimer(remaining);

      if (remaining === 0) {
        clearInterval(intervalRef.current);

        setTimeout(() => {
          setShouldStopBLE(true);
          setMeasurementComplete(true);
        }, 100);
      }
    }, 100);

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
      // First generate and save the PDF
      console.log('🔄 Generating PDF for database save...');
      const pdfFilename = await handleDownloadPlot();

      if (!pdfFilename) {
        Alert.alert('Error', 'Failed to generate PDF file. Saving data without PDF.');
        // Continue saving without PDF filename
      }

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
      console.log(`📄 PDF Filename: ${pdfFilename || 'None'}`);

      // Insert the ECG analysis results with tags, notes, and filename
      await db.runAsync(`
        INSERT INTO ${tableName} (heartbeat, qt, qrs, heartvariance, timestamp, metadata, filename)
        VALUES (?, ?, ?, ?, ?, ?, ?);
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
        }),
        pdfFilename || null                      // filename (null if PDF generation failed)
      );

      console.log('✅ ECG data and PDF filename saved successfully to database');

      if (pdfFilename) {
        Alert.alert('Success', 'ECG measurement and plot saved to your profile!', [
          {
            text: 'OK', onPress: () => {
              // Reset states after successful save
              setMeasurementComplete(false);
              setShowResultsModal(false);
              router.push('/home');
            }
          }
        ]);
      } else {
        Alert.alert('Partial Success', 'ECG measurement saved, but PDF generation failed.', [
          {
            text: 'OK', onPress: () => {
              // Reset states after successful save
              setMeasurementComplete(false);
              setShowResultsModal(false);
              router.push('/home');
            }
          }
        ]);
      }
      return true;

    } catch (error) {
      console.error('❌ Error saving to database:', error);
      Alert.alert('Error', 'Failed to save measurement to database');
      return false;
    }
  };

  // Rewrite handleDownloadPlot to use your original plotting with user data
  const handleDownloadPlot = async () => {
    if (!isProcessed) {
      Alert.alert('Not Processed', 'Data has not been processed yet. Please process the data first.');
      return null;
    }

    if (filteredLead1.length === 0) {
      Alert.alert('No Data', 'No filtered data available to plot');
      return null;
    }

    try {
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `ecg_plot_${currentUser?.name?.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pdf`;

      // Get database directory (same as where SQLite database is stored)
      const databaseDir = FileSystem.documentDirectory + 'SQLite/';

      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(databaseDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(databaseDir, { intermediates: true });
      }

      const filePath = databaseDir + filename;

      console.log('📊 Generating ECG PDF with your original plotting...');
      console.log('📁 Target file path:', filePath);

      // Prepare the real ECG data
      const realEcgData = {
        filteredLead1,
        filteredLead2,
        filteredLead3,
        filteredAVR,
        filteredAVL,
        filteredAVF,
        length: Math.max(
          filteredLead1.length,
          filteredLead2.length,
          filteredLead3.length,
          filteredAVR.length,
          filteredAVL.length,
          filteredAVF.length
        )
      };

      // Prepare user data
      const userData = {
        name: currentUser?.name || 'Unknown',
        birthday: currentUser?.birthday || 'Unknown',
        gender: currentUser?.gender || 'Unknown'
      };

      // Prepare measurement data
      const measurementData = {
        heartRate: Math.round(heartbeatDuration),
        qtInterval: Math.round(qtcDuration * 10) / 10,
        qrsDuration: Math.round(qrsDuration * 10) / 10,
        heartVariance: Math.round(heartvarianceDuration),
        recordingDate: new Date().toLocaleString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }),
        duration: `${DURATION_SEC}s`,
        tags: selectedTags,
        notes: notes
      };

      // Use YOUR original plotting function with the file path and additional data
      await generateStandaloneECGPDF(realEcgData, filePath, userData, measurementData);

      console.log('✅ PDF generated and saved to database directory:', filePath);

      // Verify the file was saved correctly
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists && fileInfo.size > 0) {
        console.log(`✅ PDF file verified: ${fileInfo.size} bytes`);
        return filename;
      } else {
        console.error('❌ PDF file verification failed');
        return null;
      }

    } catch (err) {
      console.error('❌ PDF generation error:', err);
      Alert.alert('Error', 'Failed to generate PDF: ' + err.message);
      return null;
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

          {/* Real-time Data Display */}
          <View style={styles.dataDisplayContainer}>
            <Text style={styles.dataDisplayTitle}>Real-time Data</Text>

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Raw Data:</Text>
              <Text style={styles.dataValue}>
                Lead1: {rawLead1.length} | Lead2: {rawLead2.length}
              </Text>
            </View>

            {isProcessed && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Filtered Data:</Text>
                <Text style={styles.dataValue}>
                  I: {filteredLead1.length} | II: {filteredLead2.length} | III: {filteredLead3.length}
                </Text>
              </View>
            )}

            {isProcessed && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Augmented:</Text>
                <Text style={styles.dataValue}>
                  aVR: {filteredAVR.length} | aVL: {filteredAVL.length} | aVF: {filteredAVF.length}
                </Text>
              </View>
            )}

            {/* Show latest values if available */}
            {rawLead1.length > 0 && (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Latest Raw:</Text>
                <Text style={styles.dataValue}>
                  L1: {rawLead1[rawLead1.length - 1]?.toFixed(2) || 'N/A'} |
                  L2: {rawLead2[rawLead2.length - 1]?.toFixed(2) || 'N/A'}
                </Text>
              </View>
            )}
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
          <View style={styles.modalContent}>
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
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Notes <Text style={styles.optional}>(optional)</Text></Text>
                <Text style={styles.characterCount}>{notes.length}/200</Text>
              </View>

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
              {/* <Text style={styles.sectionTitle}>Export Data</Text>

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
              </TouchableOpacity> */}

              {/* Modified Download Plot Button */}
              {/* <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleDownloadPlot}
              >
                <Ionicons name="document-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.secondaryButtonText}>Download ECG Plot (PDF)</Text>
              </TouchableOpacity> */}
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
            </View>
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
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.base,
  },
  timerUrgent: {
    borderColor: theme.colors.error,
    backgroundColor: '#ffeeee',
  },
  bigTimerText: {
    fontSize: theme.fontSizes['6xl'],
    color: theme.colors.primary,
  },
  timerTextUrgent: {
    color: theme.colors.error,
  },
  bigTimerLabel: {
    fontSize: theme.fontSizes.xl,
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
    fontSize: theme.fontSizes['3xl'],
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  resultsSection: {
    marginBottom: theme.spacing.lg,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
    marginBottom: theme.spacing.xs,
  },
  resultLabel: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text,
  },
  resultValue: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.primary,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.base,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text,
  },
  optional: {
    fontSize: theme.fontSizes.base,
    color: theme.colors.textSecondary,
  },
  characterCount: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
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
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  selectedTagText: {
    fontSize: theme.fontSizes.base,
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
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
    color: theme.colors.text,
    minHeight: 60,
  },
  exportSection: {
    marginVertical: theme.spacing.xs,
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
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: theme.fontSizes.xl,
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
    paddingVertical: theme.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  customTagInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.base,
    padding: theme.spacing.base,
    margin: theme.spacing.lg,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text,
  },
  tagsList: {
    flex: 1,
    paddingHorizontal: theme.spacing.xs,
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
    color: theme.colors.text,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  applyButtonText: {
    fontSize: theme.fontSizes.xl,
    color: theme.colors.surface,
  },
  dataDisplayContainer: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.base,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.base,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 300,
  },
  dataDisplayTitle: {
    fontSize: theme.fontSizes.base,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  dataLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  dataValue: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.primary,
    flex: 2,
    textAlign: 'right',
  },
});