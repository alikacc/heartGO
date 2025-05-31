import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  TouchableOpacity,
  Modal
} from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import NavigationBar from './component/navbar';
import { useUser } from './UserContext';

// bump this whenever you add a migration
const TARGET_DB_VERSION = 2;

// Available tags
const AVAILABLE_TAGS = [
  'Exercise', 'Rest', 'Medication', 'Stress', 'Sleep', 'Caffeine',
  'Alcohol', 'Sick', 'Normal', 'Pain', 'Anxiety', 'Other'
];

export default function App() {
  const { db, getCurrentUserTable, currentUser } = useUser();
  const [rows, setRows] = useState([]);
  const [heartbeat, setHeartbeat] = useState('');
  const [qt, setQt] = useState('');
  const [qrs, setQrs] = useState('');
  const [heartvariance, setheartvariance] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [notes, setNotes] = useState('');
  const [showTagModal, setShowTagModal] = useState(false);

  useEffect(() => {
    if (db && currentUser) {
      refresh();
    }
  }, [db, currentUser]); // Refresh when user changes

  const refresh = async () => {
    if (!db) return;
    try {
      const tableName = getCurrentUserTable();
      console.log(`📊 Loading data from table: ${tableName} for user: ${currentUser?.name}`);
      const data = await db.getAllAsync(`SELECT * FROM ${tableName} ORDER BY id DESC;`);
      console.log(`📈 Loaded ${data.length} records from ${tableName}`);
      setRows(data);
    } catch (error) {
      console.error("Refresh Error:", error);
      Alert.alert("Error", error.message);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const add = async () => {
    if (!db || !heartbeat || !qt || !qrs || !heartvariance) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    try {
      const tableName = getCurrentUserTable();
      const now = new Date();
      const timestamp = now.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(',', '');

      const metadata = JSON.stringify({
        t: selectedTags,
        n: notes.trim() || null
      });

      console.log(`📊 Adding new data for user: ${currentUser?.name} to table: ${tableName}`);
      console.log(`📈 Data: HB=${heartbeat}, QT=${qt}, QRS=${qrs}, HR=${heartvariance}, Tags=${selectedTags.join(',')}`);

      await db.runAsync(
        `INSERT INTO ${tableName} (heartbeat, qt, qrs, heartvariance, timestamp, metadata)
         VALUES (?, ?, ?, ?, ?, ?);`,
        parseFloat(heartbeat),
        parseFloat(qt),
        parseFloat(qrs),
        parseFloat(heartvariance),
        timestamp,
        metadata
      );

      console.log(`✅ Data added successfully to ${tableName} at ${timestamp}`);

      // Clear form
      setHeartbeat(''); setQt(''); setQrs(''); setheartvariance('');
      setSelectedTags([]); setNotes('');
      await refresh();
    } catch (error) {
      console.error("❌ Insert Error:", error);
      Alert.alert("Insert Failed", error.message);
    }
  };

  const del = async (id) => {
    if (!db) return;
    try {
      const tableName = getCurrentUserTable();
      console.log(`🗑️ Deleting record ID: ${id} from table: ${tableName}`);

      await db.runAsync(`DELETE FROM ${tableName} WHERE id = ?;`, id);

      console.log(`✅ Record deleted successfully from ${tableName}`);
      await refresh();
    } catch (error) {
      console.error("❌ Delete Error:", error);
      Alert.alert("Delete Failed", error.message);
    }
  };

  const parseMetadata = (metadataStr) => {
    if (!metadataStr) return { tags: [], notes: '' };
    try {
      const parsed = JSON.parse(metadataStr);
      return {
        tags: parsed.t || [],
        notes: parsed.n || ''
      };
    } catch {
      return { tags: [], notes: '' };
    }
  };

  const newSession = () => {
    setRows([]);
  };

  const exportDb = async () => {
    try {
      // Close the current database connection
      if (db) await db.closeAsync();

      // Use the central database file
      const dbFile = `${FileSystem.documentDirectory}SQLite/heartgo_users.db`;
      const stats = await FileSystem.getInfoAsync(dbFile);
      console.log("Exporting central DB file size:", stats.size);

      if (Platform.OS === 'android') {
        const perm = await FileSystem.StorageAccessFramework
          .requestDirectoryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission denied'); return;
        }

        const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
          perm.directoryUri,
          'heartgo_users.db', // Export with proper name
          'application/octet-stream'
        );
        const b64 = await FileSystem.readAsStringAsync(dbFile, {
          encoding: FileSystem.EncodingType.Base64
        });
        await FileSystem.writeAsStringAsync(destUri, b64, {
          encoding: FileSystem.EncodingType.Base64
        });
        Alert.alert('Exported to', destUri);

      } else {
        await Sharing.shareAsync(dbFile);
      }
    } catch (error) {
      console.error("Export Error:", error);
      Alert.alert("Export Failed", error.message);
    }
  };

  const importDb = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*', copyToCacheDirectory: true,
      });

      if (res.canceled) { Alert.alert('Import cancelled'); return; }
      const { uri, name } = res.assets[0];
      Alert.alert('Importing', name);

      const sqliteDir = FileSystem.documentDirectory + 'SQLite';
      const info = await FileSystem.getInfoAsync(sqliteDir);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(sqliteDir);
      }

      // Import to the central database
      const dest = `${sqliteDir}/heartgo_users.db`;
      const b64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64
      });
      await FileSystem.writeAsStringAsync(dest, b64, {
        encoding: FileSystem.EncodingType.Base64
      });

      Alert.alert('Import complete', 'Please restart the app to see imported data');
    } catch (error) {
      console.error("Import Error:", error);
      Alert.alert("Import Failed", error.message);
    }
  };

  const showDatabaseInfo = async () => {
    const dbPath = `${FileSystem.documentDirectory}SQLite/heartgo_users.db`;
    const dbInfo = await FileSystem.getInfoAsync(dbPath);

    console.log('🗄️ LIVE DATABASE INFO:');
    console.log('📍 Path:', dbPath);
    console.log('📊 Size:', dbInfo.size, 'bytes');
    console.log('📅 Modified:', new Date(dbInfo.modificationTime));
    console.log('✅ Exists:', dbInfo.exists);

    Alert.alert('Live Database Info',
      `Path: ${dbPath}\nSize: ${dbInfo.size} bytes\nExists: ${dbInfo.exists}`
    );
  };

  const accessLiveDatabase = async () => {
    try {
      // Open the SAME database file that your app uses
      const liveDb = await SQLite.openDatabaseAsync('heartgo_users.db');

      // Get all users
      const users = await liveDb.getAllAsync('SELECT * FROM users;');
      console.log('👥 Live users:', users);

      // Get all tables in the database
      const tables = await liveDb.getAllAsync(
        `SELECT name FROM sqlite_master WHERE type='table';`
      );
      console.log('📊 Live tables:', tables);

      // Get data from current user's table
      if (currentUser) {
        const userData = await liveDb.getAllAsync(`SELECT * FROM ${currentUser.tableName} LIMIT 5;`);
        console.log(`📈 Live data for ${currentUser.name}:`, userData);
      }

      await liveDb.closeAsync();
    } catch (error) {
      console.error('❌ Error accessing live DB:', error);
    }
  };

  const monitorDatabase = async () => {
    const dbPath = `${FileSystem.documentDirectory}SQLite/heartgo_users.db`;

    // Check database size before and after operations
    const beforeInfo = await FileSystem.getInfoAsync(dbPath);
    console.log('📊 DB size before:', beforeInfo.size);

    // Do some operation...
    await add(); // Your existing add function

    // Check size after
    const afterInfo = await FileSystem.getInfoAsync(dbPath);
    console.log('📊 DB size after:', afterInfo.size);
    console.log('📈 Size changed by:', afterInfo.size - beforeInfo.size, 'bytes');
  };

  const inspectLiveDatabase = async () => {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/heartgo_users.db`;
      const dbInfo = await FileSystem.getInfoAsync(dbPath);

      if (!dbInfo.exists) {
        Alert.alert('Database not found!');
        return;
      }

      // Open the live database
      const liveDb = await SQLite.openDatabaseAsync('heartgo_users.db');

      // Get database schema
      const tables = await liveDb.getAllAsync(
        `SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name;`
      );

      console.log('🏗️ LIVE DATABASE SCHEMA:');
      tables.forEach(table => {
        console.log(`📊 Table: ${table.name}`);
        console.log(`🔧 SQL: ${table.sql}`);
      });

      // Get users
      const users = await liveDb.getAllAsync('SELECT * FROM users;');
      console.log('👥 LIVE USERS:', users);

      // Get row counts for each user table
      for (const user of users) {
        try {
          const count = await liveDb.getFirstAsync(`SELECT COUNT(*) as count FROM ${user.tableName};`);
          console.log(`📈 ${user.name} has ${count.count} records in ${user.tableName}`);
        } catch (e) {
          console.log(`❌ Error counting ${user.tableName}:`, e.message);
        }
      }

      await liveDb.closeAsync();

      Alert.alert('Live Database Inspected', 'Check console for details');

    } catch (error) {
      console.error('❌ Database inspection error:', error);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>HeartGo Data Storage</Text>
      <Text style={styles.currentUser}>Current User: {currentUser?.name}</Text>

      <View style={styles.formRow}>
        <TextInput
          style={styles.input}
          placeholder="Heartbeat"
          keyboardType="decimal-pad"
          value={heartbeat}
          onChangeText={setHeartbeat}
        />
        <TextInput
          style={styles.input}
          placeholder="QT"
          keyboardType="decimal-pad"
          value={qt}
          onChangeText={setQt}
        />
        <TextInput
          style={styles.input}
          placeholder="QRS"
          keyboardType="decimal-pad"
          value={qrs}
          onChangeText={setQrs}
        />
        <TextInput
          style={styles.input}
          placeholder="Heart Rate Variance"
          keyboardType="decimal-pad"
          value={heartvariance}
          onChangeText={setheartvariance}
        />
      </View>

      {/* Tags Selection */}
      <TouchableOpacity
        style={styles.tagButton}
        onPress={() => setShowTagModal(true)}
      >
        <Text style={styles.tagButtonText}>
          Tags: {selectedTags.length > 0 ? selectedTags.join(', ') : 'None'}
        </Text>
      </TouchableOpacity>

      {/* Notes Input */}
      <TextInput
        style={styles.notesInput}
        placeholder="Notes (optional)"
        multiline
        numberOfLines={2}
        value={notes}
        onChangeText={setNotes}
      />

      <Button title="Add" onPress={add} />

      {/* Tag Selection Modal */}
      <Modal visible={showTagModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Tags</Text>
            <ScrollView style={styles.tagList}>
              {AVAILABLE_TAGS.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagOption,
                    selectedTags.includes(tag) && styles.tagOptionSelected
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[
                    styles.tagOptionText,
                    selectedTags.includes(tag) && styles.tagOptionTextSelected
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title="Done" onPress={() => setShowTagModal(false)} />
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.list}>
        {rows.map(r => {
          const metadata = parseMetadata(r.metadata);
          return (
            <View key={r.id} style={styles.row}>
              <View style={styles.rowContent}>
                <Text style={styles.rowData}>
                  HB: {r.heartbeat}, QT: {r.qt}, QRS: {r.qrs}, HRV: {r.heartvariance}
                </Text>
                <Text style={styles.rowTime}>Time: {r.timestamp}</Text>
                {metadata.tags.length > 0 && (
                  <Text style={styles.rowTags}>Tags: {metadata.tags.join(', ')}</Text>
                )}
                {metadata.notes && (
                  <Text style={styles.rowNotes}>Notes: {metadata.notes}</Text>
                )}
              </View>
              <View style={styles.buttons}>
                <Button title="Del" color="red" onPress={() => del(r.id)} />
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.bottom}>
        {/* <Button title="New Session" onPress={newSession} /> */}
        <Button title="Export DB" onPress={exportDb} />
        <View style={{ height: 8 }} />
        <Button title="Import DB" onPress={importDb} />
        <Button title="Show DB Info" onPress={showDatabaseInfo} />
        <Button title="Inspect Live DB" onPress={inspectLiveDatabase} />
      </View>
      <NavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 48 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  formRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' },
  input: { flex: 1, borderColor: '#888', borderWidth: 1, padding: 8, margin: 4, minWidth: '48%', borderRadius: 8 },
  list: { flex: 1, marginBottom: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    alignItems: 'flex-start'
  },
  rowContent: {
    flex: 1,
    paddingRight: 8,
  },
  rowData: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  rowTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  buttons: {
    width: 60,
    justifyContent: 'center'
  },
  bottom: { marginBottom: 16 },
  tagButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    margin: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tagButtonText: {
    fontSize: 14,
    color: '#333',
  },
  notesInput: {
    borderColor: '#888',
    borderWidth: 1,
    padding: 8,
    margin: 4,
    borderRadius: 8,
    textAlignVertical: 'top',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  tagList: {
    maxHeight: 200,
  },
  tagOption: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 2,
    backgroundColor: '#f5f5f5',
  },
  tagOptionSelected: {
    backgroundColor: '#007AFF',
  },
  tagOptionText: {
    fontSize: 16,
    color: '#333',
  },
  tagOptionTextSelected: {
    color: 'white',
  },
  rowTags: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  rowNotes: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  currentUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09f',
    marginBottom: 16,
    textAlign: 'center',
  },
});
