import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  ScrollView, 
  StyleSheet,
  Platform,
  Alert
} from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

export default function App() {
  const [db, setDb] = useState(null);
  const [rows, setRows] = useState([]);
  const [val, setVal] = useState('');
  const [num, setNum] = useState('');

  useEffect(() => {
    (async () => {
      const database = await SQLite.openDatabaseAsync('example.db');
      setDb(database);
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS test (
          id INTEGER PRIMARY KEY NOT NULL,
          value TEXT NOT NULL,
          intValue INTEGER
        );
      `);
      refresh();
    })();
  }, []);

  const refresh = async () => {
    if (!db) return;
    const all = await db.getAllAsync('SELECT * FROM test;');
    setRows(all);
  };

  const add = async () => {
    if (!db || !val || !num) return;
    await db.runAsync(
      'INSERT INTO test (value,intValue) VALUES (?,?);',
      val,
      parseInt(num, 10)
    );
    setVal(''); setNum('');
    refresh();
  };

  const upd = async (id) => {
    if (!db) return;
    await db.runAsync(
      'UPDATE test SET intValue = ? WHERE id = ?;',
      parseInt(num,10),
      id
    );
    setNum('');
    refresh();
  };

  const del = async (id) => {
    if (!db) return;
    await db.runAsync('DELETE FROM test WHERE id = ?;', id);
    refresh();
  };

  const exportDb = async () => {
    // path where expo-sqlite stores databases
    const sqliteDir = FileSystem.documentDirectory + 'SQLite';
    const dbFile = `${sqliteDir}/example.db`;

    // for Android request SAF permission
    if (Platform.OS === 'android') {
      const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission denied');
        return;
      }
      const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
        perm.directoryUri,
        'example.db',
        'application/octet-stream'
      );
      const b64 = await FileSystem.readAsStringAsync(dbFile, { encoding: FileSystem.EncodingType.Base64 });
      await FileSystem.writeAsStringAsync(destUri, b64, { encoding: FileSystem.EncodingType.Base64 });
      Alert.alert('Exported to', destUri);
    } else {
      // on iOS just share the file
      await Sharing.shareAsync(dbFile);
    }
  };

  const importDb = async () => {
    try {
      // allow picking any file
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
  
      console.log('📂 Picker result:', res);
  
      if (res.canceled) {
        Alert.alert('Import cancelled');
        return;
      }
  
      // res.assets is a non-empty array now
      const { uri, name } = res.assets[0];
      Alert.alert('Importing', name);
  
      // ensure the SQLite folder exists
      const sqliteDir = FileSystem.documentDirectory + 'SQLite';
      const info = await FileSystem.getInfoAsync(sqliteDir);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(sqliteDir);
      }
  
      // read the picked file & overwrite our database
      const dest = `${sqliteDir}/example.db`;
      const b64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await FileSystem.writeAsStringAsync(dest, b64, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      // reopen and refresh
      await db.closeAsync();
      const newDb = await SQLite.openDatabaseAsync('example.db');
      setDb(newDb);
      await refresh(); // whatever function you use to re-query
  
      Alert.alert('Import complete');
    } catch (err) {
      console.error('❌ importDb error:', err);
      Alert.alert('Import failed', err.message || err.toString());
    }
  };  

  return (
    <View style={styles.container}>
      <Text style={styles.header}>SQLite + Export/Import</Text>

      <View style={styles.formRow}>
        <TextInput
          style={styles.input}
          placeholder="Value"
          value={val}
          onChangeText={setVal}
        />
        <TextInput
          style={styles.input}
          placeholder="Int"
          keyboardType="number-pad"
          value={num}
          onChangeText={setNum}
        />
        <Button title="Add" onPress={add} />
      </View>

      <ScrollView style={styles.list}>
        {rows.map(r => (
          <View key={r.id} style={styles.row}>
            <Text>{r.value} — {r.intValue}</Text>
            <View style={styles.buttons}>
              <Button title="Upd" onPress={() => upd(r.id)} />
              <Button title="Del" color="red" onPress={() => del(r.id)} />
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <Button title="Export DB" onPress={exportDb} />
        <View style={{ height: 8 }} />
        <Button title="Import DB" onPress={importDb} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 48 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  formRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
  input: {
    flex: 1,
    borderColor: '#888',
    borderWidth: 1,
    padding: 8,
    marginRight: 8,
  },
  list: { flex: 1, marginBottom: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  buttons: { flexDirection: 'row', width: 100, justifyContent: 'space-between' },
  bottom: { marginBottom: 16 },
});
