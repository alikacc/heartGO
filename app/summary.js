import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { theme } from './styles/theme';
import { sharedStyles } from './styles/shared';
import Header from './component/header';

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

export default function ECGResultsSummary() {
  const router = useRouter();
  const { id, bpm = '99', rhythm = 'Normal Sinus Rhythm', timestamp, ecgData } = useLocalSearchParams();

  // State for tags and notes
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [notes, setNotes] = useState('');
  const [showTagModal, setShowTagModal] = useState(false);

  // Format timestamp
  const formatTimestamp = (ts) => {
    if (!ts) {
      const now = new Date();
      return now.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return ts;
  };

  // Parse ECG data if available - ADD BETTER ERROR HANDLING
  let parsedECGData = null;
  try {
    if (ecgData) {
      parsedECGData = JSON.parse(decodeURIComponent(ecgData));
      console.log('Parsed ECG data successfully:', Object.keys(parsedECGData));
    } else {
      console.log('No ecgData parameter found');
    }
  } catch (error) {
    console.error('Failed to parse ECG data:', error);
    parsedECGData = null;
  }

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

  // Save results
  const handleSave = () => {
    const resultData = {
      id,
      bpm,
      rhythm,
      timestamp: formatTimestamp(timestamp),
      tags: selectedTags,
      notes: notes.trim(),
      savedAt: new Date().toISOString(),
    };

    console.log('Saving ECG result:', resultData);

    Alert.alert(
      'Success',
      'ECG result saved successfully!',
      [{ text: 'OK', onPress: () => router.push('/historical') }]
    );
  };

  // Download PDF
  const handleDownloadPDF = () => {
    Alert.alert(
      'PDF Download',
      'PDF download functionality will be implemented soon.',
      [{ text: 'OK' }]
    );
  };

  // Redo measurement
  const handleRedoMeasurement = () => {
    Alert.alert(
      'Redo Measurement',
      'Are you sure you want to take a new measurement?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: () => router.push('/') }
      ]
    );
  };

  // Export CSV function - FIXED to work like landing.js
  const handleExportCSV = async () => {
    try {
      console.log('Starting CSV export...');

      if (!ecgData) {
        Alert.alert('No Data', 'No ECG data parameter found.');
        return;
      }

      if (!parsedECGData) {
        Alert.alert('No Data', 'Failed to parse ECG data.');
        return;
      }

      console.log('Parsed ECG data:', {
        lead1Length: parsedECGData.lead1?.length || 0,
        lead2Length: parsedECGData.lead2?.length || 0,
        filteredLead1Length: parsedECGData.filteredLead1?.length || 0,
        filteredLead2Length: parsedECGData.filteredLead2?.length || 0
      });

      // Use raw lead data like landing.js does
      const lead1Data = parsedECGData.lead1 || [];
      const lead2Data = parsedECGData.lead2 || [];

      if (lead1Data.length === 0 && lead2Data.length === 0) {
        Alert.alert('No Data', 'No ECG samples found.');
        return;
      }

      // Create CSV like landing.js does - just the data
      let csvContent = '';
      const maxLength = Math.max(lead1Data.length, lead2Data.length);

      for (let i = 0; i < maxLength; i++) {
        const v1 = lead1Data[i] || '';
        const v2 = lead2Data[i] || '';
        // Add empty values for other leads to maintain 6 columns
        csvContent += `${v1},${v2},,,,\n`;
      }

      if (csvContent.length === 0) {
        Alert.alert('No Data', 'Generated CSV is empty.');
        return;
      }

      // Save to file
      const fileName = `ecg_data_${Date.now()}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      console.log(`CSV exported with ${maxLength} samples`);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('CSV Saved', `File saved: ${fileName}`);
      }

    } catch (error) {
      console.error('CSV export error:', error);
      Alert.alert('Error', 'Failed to export CSV');
    }
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="User Profile" showUserSwitcher={false} />

      {/* Results Summary */}
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Text style={styles.rhythmText}>{rhythm}</Text>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
        </View>

        <View style={styles.bpmContainer}>
          <Ionicons name="heart" size={20} color={theme.colors.error} />
          <Text style={styles.bpmText}>{bpm} BPM</Text>
        </View>

        <Text style={styles.timestamp}>
          {formatTimestamp(timestamp)}
        </Text>
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

        <TextInput
          style={styles.notesInput}
          placeholder="How did you feel? What were you doing?"
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
          textAlignVertical="top"
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleDownloadPDF}
          activeOpacity={0.7}
        >
          <Ionicons name="download-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.secondaryButtonText}>Download PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleExportCSV}
          activeOpacity={0.7}
        >
          <Ionicons name="document-text-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.secondaryButtonText}>Export CSV</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleRedoMeasurement}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={18} color={theme.colors.warning} />
          <Text style={[styles.secondaryButtonText, { color: theme.colors.warning }]}>Redo Measurement</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>SAVE</Text>
        </TouchableOpacity>
      </View>

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
    backgroundColor: theme.colors.background,
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.base,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.base,
  },
  rhythmText: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.bold,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  bpmContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  bpmText: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.semiBold,
    fontWeight: theme.fonts.weights.semiBold,
    marginLeft: theme.spacing.sm,
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.regular,
    color: theme.colors.textSecondary,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
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
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.base,
    paddingHorizontal: theme.spacing.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.medium,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  notesInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.base,
    padding: theme.spacing.base,
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
    minHeight: 80,
  },
  actionButtons: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
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
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingTop: 50,
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
});