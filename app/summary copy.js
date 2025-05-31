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
  const { id, bpm = '99', rhythm = 'Normal Sinus Rhythm', timestamp } = useLocalSearchParams();
  
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

  const renderTagItem = ({ item }) => (
    <TouchableOpacity
      style={styles.tagOption}
      onPress={() => handleTagSelection(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, selectedTags.includes(item) && styles.checkedBox]}>
        {selectedTags.includes(item) && (
          <Ionicons name="checkmark" size={14} color="#fff" />
        )}
      </View>
      <Text style={styles.tagOptionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ECG Results</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Results Summary */}
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Text style={styles.rhythmText}>{rhythm}</Text>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
        </View>
        
        <View style={styles.bpmContainer}>
          <Ionicons name="heart" size={20} color="red" />
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
                  <Ionicons name="close-circle" size={16} color="#666" />
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
          <Ionicons name="add" size={18} color="#666" />
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
          <Ionicons name="download-outline" size={18} color="#007AFF" />
          <Text style={styles.secondaryButtonText}>Download PDF</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleRedoMeasurement}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={18} color="#FF6B35" />
          <Text style={[styles.secondaryButtonText, { color: '#FF6B35' }]}>Redo Measurement</Text>
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
              <Ionicons name="close" size={24} color="#666" />
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  headerSpacer: {
    width: 40,
  },
  resultCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00A86B',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rhythmText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  bpmContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bpmText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optional: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'normal',
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 2,
  },
  selectedTagText: {
    fontSize: 14,
    color: '#1976d2',
    marginRight: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 80,
    backgroundColor: '#fafafa',
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 6,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#00A86B',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  customTagInput: {
    borderBottomWidth: 2,
    borderBottomColor: '#00A86B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    margin: 16,
    marginBottom: 0,
  },
  tagsList: {
    flex: 1,
    paddingVertical: 16,
  },
  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#00A86B',
    borderRadius: 3,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#00A86B',
  },
  tagOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  applyButton: {
    backgroundColor: '#00A86B',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});