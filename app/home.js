
// import React, { useState, useEffect, useRef } from 'react';
// import { 
//   View, 
//   Text, 
//   TouchableOpacity, 
//   StyleSheet, 
//   ScrollView, 
//   Platform,
//   SafeAreaView,
//   StatusBar,
//   Dimensions
// } from 'react-native';
// import { format } from 'date-fns';
// import { Modal } from 'react-native';
// import { Calendar } from 'react-native-calendars';
// import NavigationBar from './component/navbar';
// import Header from './component/header';

// // Sample data in CSV format - in a real app this would come from a file or API
// const csvData = `timestamp,parameter,value,unit,status
// 2024-06-14T10:10:00,Heart Rate,72,bpm,Normal
// 2024-06-14T10:15:00,QRS Duration,120,ms,Abnormal
// 2024-06-14T10:20:00,Heart Rhythm,Regular,,Normal
// 2024-06-14T10:25:00,QTc Interval,410,ms,Normal
// 2024-06-14T10:30:00,Heart Rate,75,bpm,Normal
// 2024-06-14T11:00:00,QRS Duration,130,ms,Abnormal
// 2024-06-14T11:15:00,Heart Rhythm,Regular,,Normal
// 2024-06-14T11:30:00,QTc Interval,415,ms,Normal
// 2024-06-13T10:10:00,Heart Rate,68,bpm,Normal
// 2024-06-13T10:15:00,QRS Duration,110,ms,Normal
// 2024-06-13T10:20:00,Heart Rhythm,Regular,,Normal
// 2024-06-13T10:25:00,QTc Interval,405,ms,Normal
// 2024-06-12T10:10:00,Heart Rate,80,bpm,Abnormal
// 2024-06-12T10:15:00,QRS Duration,135,ms,Abnormal
// 2024-06-12T10:20:00,Heart Rhythm,Irregular,,Abnormal
// 2024-06-12T10:25:00,QTc Interval,440,ms,Abnormal`;

// // Parse CSV to JavaScript objects
// const parseCSV = (csv) => {
//   const lines = csv.split('\n');
//   const headers = lines[0].split(',');
  
//   return lines.slice(1).map(line => {
//     const values = line.split(',');
//     const entry = {};
//     headers.forEach((header, index) => {
//       entry[header] = values[index];
//     });
//     return entry;
//   });
// };



// // Extract unique dates from data
// const getUniqueDates = (data) => {
//   const dates = data.map(item => item.timestamp.split('T')[0]);
//   return [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a)); // Most recent first
// };

// // Get most recent records for each parameter
// const getLatestRecords = (data, date) => {
//   // Filter by selected date
//   const dateData = data.filter(item => item.timestamp.startsWith(date));
  
//   // Group by parameter
//   const parameterGroups = {};
//   dateData.forEach(item => {
//     if (!parameterGroups[item.parameter]) {
//       parameterGroups[item.parameter] = [];
//     }
//     parameterGroups[item.parameter].push(item);
//   });
  
//   // Get latest record for each parameter
//   const latestRecords = {};
//   Object.keys(parameterGroups).forEach(parameter => {
//     const records = parameterGroups[parameter];
//     records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
//     latestRecords[parameter] = records[0];
    
//     // Add the history for this parameter
//     latestRecords[parameter].history = records.slice(0, 3).map(record => ({
//       timestamp: record.timestamp,
//       value: record.value,
//       unit: record.unit
//     }));
//   });
  
//   return latestRecords;
// };

// const App = () => {
//   const parsedData = parseCSV(csvData);
//   const uniqueDates = getUniqueDates(parsedData);

//   const [calendarMonth, setCalendarMonth] = useState(selectedDate);
//   const todayString = new Date().toISOString().split('T')[0];

  
//   const [selectedDate, setSelectedDate] = useState(uniqueDates[0]); // Default to most recent date
//   const availableDates = uniqueDates; // Dates that have data

//   const generateMarkedDates = () => {
//     const marks = {};
  
//     // Mark available dates
//     availableDates.forEach(date => {
//       marks[date] = {
//         selected: date === selectedDate,
//         selectedColor: '#09f',
//         selectedTextColor: '#fff',
//         disabled: false,
//       };
//     });
  
//     // Dim all days in month that are not available
//     const today = new Date();
//     const currentMonth = today.toISOString().substring(0, 7);
//     for (let d = 1; d <= 31; d++) {
//       const day = `${currentMonth}-${String(d).padStart(2, '0')}`;
//       if (!availableDates.includes(day)) {
//         marks[day] = { disabled: true, disableTouchEvent: true };
//       }
//     }
  
//     return marks;
//   };
  

//   const [statusFilter, setStatusFilter] = useState('All');
//   const [showDatePicker, setShowDatePicker] = useState(false);
  
//   // Get the latest records for each parameter on the selected date
//   const latestRecords = getLatestRecords(parsedData, selectedDate);
  
//   // Filter records by selected status
//   const filteredRecords = Object.values(latestRecords).filter(record => {
//     if (statusFilter === 'All') return true;
//     return record.status === statusFilter;
//   });

//   // Format date for display
//   const formatDisplayDate = (dateStr) => {
//     const date = new Date(dateStr);
//     return format(date, 'd MMMM yyyy');
//   };
  
//   // Format time for display in history items
//   const formatTime = (timestampStr) => {
//     const date = new Date(timestampStr);
//     return format(date, 'HH:mm');
//   };

//   const goToToday = () => {
//     setCalendarMonth(todayString);
//     setSelectedDate(todayString);
//   };
  

//   return (
//     <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
//       {/* <Header title="Profile" /> */}
//       <SafeAreaView style={styles.safeArea}>
//         <StatusBar barStyle="dark-content" />
        
//         {/* Connection Status */}
//         <View style={styles.connectionContainer}>
//           <Text style={styles.connectionText}>You are</Text>
//           <Text style={styles.connectedText}>Connected</Text>
//         </View>
        
//         {/* Parameter Header */}
//         <Text style={styles.headerText}>Parameter</Text>
        
//         {/* Date Picker
//         <View style={styles.datePickerContainer}>
//           <TouchableOpacity 
//             style={styles.datePickerButton}
//             onPress={() => setShowDatePicker(!showDatePicker)}
//           >
//             <Text style={styles.datePickerText}>
//               Date: {formatDisplayDate(selectedDate)}
//             </Text>
//             <Text style={styles.datePickerIcon}>⌵</Text>
//           </TouchableOpacity> */}
          
//           {/* Date Options Dropdown */}
//           {/* {showDatePicker && (
//             <View style={styles.dateOptions}>
//               <ScrollView style={styles.dateScroll}>
//                 {uniqueDates.map((date, index) => (
//                   <TouchableOpacity
//                     key={index}
//                     style={styles.dateOption}
//                     onPress={() => {
//                       setSelectedDate(date);
//                       setShowDatePicker(false);
//                     }}
//                   >
//                     <Text style={styles.dateOptionText}>{formatDisplayDate(date)}</Text>
//                   </TouchableOpacity>
//                 ))}
//               </ScrollView>
//             </View>
//           )}
//         </View> */}

//         <View style={{ paddingHorizontal: 15 }}>
//           <TouchableOpacity 
//             style={styles.datePickerButton}
//             onPress={() => setShowDatePicker(true)}
//           >
//             <Text style={styles.datePickerText}>
//               Date: {formatDisplayDate(selectedDate)}
//             </Text>
//             <Text style={styles.datePickerIcon}>📅</Text>
//           </TouchableOpacity>

//           <Modal
//             visible={showDatePicker}
//             transparent
//             animationType="fade"
//             onRequestClose={() => setShowDatePicker(false)}
//           >
//             <TouchableOpacity 
//               style={styles.modalBackdrop}
//               activeOpacity={1}
//               onPressOut={() => setShowDatePicker(false)}
//             >
//               <View style={styles.modalContainer}>
//               <TouchableOpacity 
//                 onPress={goToToday}
//                 style={styles.todayButton}
//               >
//                 <Text style={styles.todayButtonText}>Today</Text>
//               </TouchableOpacity>

//               <Calendar
//                 current={calendarMonth}
//                 onDayPress={(day) => {
//                   if (availableDates.includes(day.dateString)) {
//                     setSelectedDate(day.dateString);
//                     setCalendarMonth(day.dateString); // 🔥 Save month state
//                     setShowDatePicker(false);
//                   }
//                 }}
//                 onMonthChange={(month) => {
//                   setCalendarMonth(`${month.year}-${String(month.month).padStart(2, '0')}-01`);
//                 }}
//                 markedDates={generateMarkedDates()}
//                 disableAllTouchEventsForDisabledDays={true}
//                 theme={{
//                   todayTextColor: '#09f',
//                   selectedDayBackgroundColor: '#09f',
//                   selectedDayTextColor: '#fff',
//                   disabledTextColor: '#ccc',
//                 }}
//               />

//               </View>
//             </TouchableOpacity>
//           </Modal>
//         </View>


        
//         {/* Status Filters */}
//         <View style={styles.filtersContainer}>
//           <TouchableOpacity 
//             style={[
//               styles.filterButton, 
//               statusFilter === 'All' && styles.activeFilter
//             ]}
//             onPress={() => setStatusFilter('All')}
//           >
//             <Text style={styles.filterText}>All</Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             style={[
//               styles.filterButton, 
//               statusFilter === 'Normal' && styles.activeFilter
//             ]}
//             onPress={() => setStatusFilter('Normal')}
//           >
//             <Text style={styles.filterText}>Normal</Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             style={[
//               styles.filterButton, 
//               statusFilter === 'Abnormal' && styles.activeFilter
//             ]}
//             onPress={() => setStatusFilter('Abnormal')}
//           >
//             <Text style={styles.filterText}>Abnormal</Text>
//           </TouchableOpacity>
//         </View>
        
//         {/* Parameter Boxes */}
//         {/* Fixed ScrollView with contentContainerStyle for proper layout */}
//         <ScrollView 
//           style={styles.parametersContainer}
//           contentContainerStyle={styles.parametersContentContainer}
//         >
//           {Object.values(latestRecords)
//             .filter(record => {
//               if (statusFilter === 'All') return true;
//               return record.status === statusFilter;
//             })
//             .map((record, index) => (
//               <TouchableOpacity 
//                 key={index}
//                 style={styles.parameterBox}
//                 onPress={() => console.log(`Clicked on ${record.parameter}`)}
//               >
//                 {/* Parameter Header */}
//                 <View style={styles.parameterHeader}>
//                   <Text style={styles.parameterTitle}>{record.parameter}</Text>
//                   <Text style={styles.parameterArrow}>›</Text>
//                 </View>
                
//                 {/* Parameter Value */}
//                 <View style={styles.parameterValueContainer}>
//                   <Text style={styles.parameterValue}>
//                     {record.value} 
//                     <Text style={styles.parameterUnit}> {record.unit}</Text>
//                   </Text>
//                   <Text style={[
//                     styles.parameterStatus,
//                     record.status === 'Normal' ? styles.normalStatus : styles.abnormalStatus
//                   ]}>
//                     {record.status}
//                   </Text>
//                 </View>
                
//                 {/* Parameter History */}
//                 <View style={styles.historyContainer}>
//                   {record.history.map((item, historyIndex) => (
//                     <Text key={historyIndex} style={styles.historyItem}>
//                       • {item.value} {item.unit}, {formatTime(item.timestamp)}
//                     </Text>
//                   ))}
//                 </View>
                
//                 {/* Extra Info for QRS Duration */}
//                 {record.parameter === 'QRS Duration' && record.status === 'Abnormal' && (
//                   <View style={styles.infoBox}>
//                     <Text style={styles.infoTitle}>QRS duration is prolonged</Text>
//                     <Text style={styles.infoText}>which may indicate conduction delay</Text>
//                   </View>
//                 )}
//               </TouchableOpacity>
//             ))}
//         </ScrollView>

//         <NavigationBar/>
//       </SafeAreaView>
//     </View>
//   );
// };

// const windowWidth = Dimensions.get('window').width;
// const boxWidth = (windowWidth - 40) / 2; // 40 is the total horizontal padding


// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#F8F9FA',
//     paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
//   },
//   connectionContainer: {
//     flexDirection: 'row',
//     padding: 10,
//     alignItems: 'center',
//     marginTop: -20,
//   },
//   connectionText: {
//     fontSize: 14,
//     color: '#333',
//     marginRight: 4,
//   },
//   connectedText: {
//     fontSize: 14,
//     color: '#00CC00',
//     fontWeight: 'bold',
//   },
//   headerText: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     padding: 15,
//     paddingBottom: 10,
//   },
//   datePickerContainer: {
//     paddingHorizontal: 15,
//     position: 'relative',
//     zIndex: 100,
//   },
//   datePickerButton: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 12,
//     borderRadius: 25,
//     borderWidth: 1,
//     borderColor: '#DDD',
//     backgroundColor: '#FFF',
//   },
//   datePickerText: {
//     fontSize: 16,
//     color: '#333',
//   },
//   datePickerIcon: {
//     fontSize: 18,
//     color: '#333',
//   },
//   dateOptions: {
//     position: 'absolute',
//     top: 55,
//     left: 15,
//     right: 15,
//     backgroundColor: '#FFF',
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: '#DDD',
//     maxHeight: 200,
//     zIndex: 101,
//   },
//   dateScroll: {
//     maxHeight: 200,
//   },
//   dateOption: {
//     padding: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEE',
//   },
//   dateOptionText: {
//     fontSize: 16,
//     color: '#333',
//   },
//   filtersContainer: {
//     flexDirection: 'row',
//     justifyContent: 'flex-start',
//     padding: 15,
//     zIndex: 50,
//   },
//   filterButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 20,
//     borderRadius: 20,
//     marginRight: 10,
//     backgroundColor: '#EEE',
//   },
//   activeFilter: {
//     backgroundColor: '#09f',
//   },
//   filterText: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#333',
//   },
//   parametersContainer: {
//     flex: 1,
//     padding: 10,
//   },
//   parametersContentContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   parameterBox: {
//     width: boxWidth,
//     backgroundColor: '#FFF',
//     borderRadius: 10,
//     padding: 15,
//     marginBottom: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   parameterHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   parameterTitle: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: '#36f',
//   },
//   parameterArrow: {
//     fontSize: 18,
//     color: '#36f',
//   },
//   parameterValueContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//   },
//   parameterValue: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     marginRight: 10,
//   },
//   parameterUnit: {
//     fontSize: 18,
//     fontWeight: 'normal',
//     color: '#666',
//   },
//   parameterStatus: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   normalStatus: {
//     color: '#00CC00',
//   },
//   abnormalStatus: {
//     color: '#FF0000',
//   },
//   historyContainer: {
//     marginTop: 5,
//   },
//   historyItem: {
//     fontSize: 12,
//     color: '#666',
//     marginBottom: 2,
//   },
//   infoBox: {
//     backgroundColor: '#E8F4FF',
//     borderRadius: 5,
//     padding: 10,
//     marginTop: 10,
//   },
//   infoTitle: {
//     fontSize: 12,
//     fontWeight: 'bold',
//     color: '#09f',
//   },
//   infoText: {
//     fontSize: 12,
//     color: '#09f',
//   },
//   modalBackdrop: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.4)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContainer: {
//     width: '90%',
//     backgroundColor: '#FFF',
//     borderRadius: 10,
//     padding: 10,
//     elevation: 10,
//   },  
//   todayButton: {
//     alignSelf: 'flex-end',
//     marginBottom: 10,
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     backgroundColor: '#09f',
//     borderRadius: 8,
//   },
//   todayButtonText: {
//     color: 'white',
//     fontWeight: 'bold',
//   },  
// });

// export default App;

// Home.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Modal,
} from 'react-native';
import { format } from 'date-fns';
import { Calendar } from 'react-native-calendars';
import Header from './component/header';
import NavigationBar from './component/navbar';

// --- your CSV parsing + helper functions unchanged ---
const csvData = `timestamp,parameter,value,unit,status
2024-06-14T10:10:00,Heart Rate,72,bpm,Normal
…`; // truncated for brevity

const parseCSV = (csv) => {
  const lines = csv.split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const entry = {};
    headers.forEach((h, i) => { entry[h] = values[i]; });
    return entry;
  });
};

const getUniqueDates = data => {
  const dates = data.map(d => d.timestamp.split('T')[0]);
  return [...new Set(dates)].sort((a,b)=> new Date(b) - new Date(a));
};

const getLatestRecords = (data, date) => {
  // Filter by selected date
  const dateData = data.filter(item => item.timestamp.startsWith(date));
  
  // Group by parameter
  const parameterGroups = {};
  dateData.forEach(item => {
    if (!parameterGroups[item.parameter]) {
      parameterGroups[item.parameter] = [];
    }
    parameterGroups[item.parameter].push(item);
  });
  
  // Get latest record for each parameter
  const latestRecords = {};
  Object.keys(parameterGroups).forEach(parameter => {
    const records = parameterGroups[parameter];
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    latestRecords[parameter] = records[0];
    
    // Add the history for this parameter
    latestRecords[parameter].history = records.slice(0, 3).map(record => ({
      timestamp: record.timestamp,
      value: record.value,
      unit: record.unit
    }));
  });
  
  return latestRecords;
};

// --- Home component starts here ---
export default function Home() {
  const parsed = parseCSV(csvData);
  const uniqueDates = getUniqueDates(parsed);

  // pick first available date as default
  const [selectedDate, setSelectedDate] = useState(uniqueDates[0]);
  // calendarMonth should start at that month
  const [calendarMonth, setCalendarMonth] = useState(
    uniqueDates[0].slice(0,7) + '-01'
  );
  const todayString = new Date().toISOString().split('T')[0];

  // status filter etc…
  const [statusFilter, setStatusFilter] = useState('All');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const latestRecords = getLatestRecords(parsed, selectedDate);

  const formatDisplayDate = ds => format(new Date(ds), 'd MMMM yyyy');
  const formatTime = ts => format(new Date(ts), 'HH:mm');

  // --- Build markedDates for Calendar ---
  const generateMarkedDates = () => {
    const marks = {};

    // 1) Mark every available date as enabled
    uniqueDates.forEach(d => {
      marks[d] = {
        disabled: false,
        disableTouchEvent: false,
        selected: d === selectedDate,
        selectedColor: '#09f',
        selectedTextColor: '#fff',
      };
    });

    // 2) Dim all other days in current month
    const [year, month] = calendarMonth.split('-');
    const daysInMonth = new Date(+year, +month, 0).getDate();
    const monthPrefix = `${year}-${month}`;

    for (let day = 1; day <= daysInMonth; day++) {
      const d = `${monthPrefix}-${String(day).padStart(2,'0')}`;
      if (!uniqueDates.includes(d)) {
        marks[d] = {
          ...(marks[d]||{}),
          disabled: true,
          disableTouchEvent: true,
        };
      }
    }

    return marks;
  };

  const goToToday = () => {
    setCalendarMonth(todayString.slice(0,7) + '-01');
    setSelectedDate(todayString);
  };

  return (
    <View style={{ flex:1, backgroundColor:'#F8F9FA' }}>
      <SafeAreaView style={styles.safeArea}>
        <Header title="Home" />
        <StatusBar barStyle="dark-content" />

        {/* Connection + Title */}
        <View style={styles.connectionContainer}>
          <Text style={styles.connectionText}>You are</Text>
          <Text style={styles.connectedText}>Connected</Text>
        </View>
        <Text style={styles.headerText}>Parameter</Text>

        {/* Date Picker Trigger */}
        <View style={styles.dateTriggerWrapper}>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.datePickerText}>
              Date: {formatDisplayDate(selectedDate)}
            </Text>
            <Text style={styles.datePickerIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        {/* Modal Calendar */}
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPressOut={() => setShowDatePicker(false)}
          >
            <View style={styles.modalContainer}>
              <TouchableOpacity
                onPress={goToToday}
                style={styles.todayButton}
              >
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>
              <Calendar
                current={calendarMonth}
                onMonthChange={(m) =>
                  setCalendarMonth(`${m.year}-${String(m.month).padStart(2,'0')}-01`)
                }
                onDayPress={(day) => {
                  if (uniqueDates.includes(day.dateString)) {
                    setSelectedDate(day.dateString);
                    setShowDatePicker(false);
                  }
                }}
                markedDates={generateMarkedDates()}
                disableAllTouchEventsForDisabledDays={true}
                theme={{
                  todayTextColor: '#09f',
                  selectedDayBackgroundColor: '#09f',
                  selectedDayTextColor: '#fff',
                  disabledTextColor: '#ccc',
                }}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          {['All','Normal','Abnormal'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterButton,
                statusFilter === f && styles.activeFilter,
              ]}
              onPress={() => setStatusFilter(f)}
            >
              <Text style={styles.filterText}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Parameter Boxes */}
        <ScrollView
          style={styles.parametersContainer}
          contentContainerStyle={styles.parametersContentContainer}
        >
          {Object.values(latestRecords)
            .filter(r => statusFilter==='All' || r.status===statusFilter)
            .map((record, i) => (
              <TouchableOpacity key={i} style={styles.parameterBox}>
                <View style={styles.parameterHeader}>
                  <Text style={styles.parameterTitle}>
                    {record.parameter}
                  </Text>
                  <Text style={styles.parameterArrow}>›</Text>
                </View>
                <View style={styles.parameterValueContainer}>
                  <Text style={styles.parameterValue}>
                    {record.value}
                    <Text style={styles.parameterUnit}> {record.unit}</Text>
                  </Text>
                  <Text
                    style={[
                      styles.parameterStatus,
                      record.status==='Normal'
                        ? styles.normalStatus
                        : styles.abnormalStatus
                    ]}
                  >
                    {record.status}
                  </Text>
                </View>
                <View style={styles.historyContainer}>
                  {record.history.map((h,i2)=>(
                    <Text key={i2} style={styles.historyItem}>
                      • {h.value} {h.unit}, {formatTime(h.timestamp)}
                    </Text>
                  ))}
                </View>
                {record.parameter==='QRS Duration' &&
                 record.status==='Abnormal' && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>
                      QRS duration is prolonged
                    </Text>
                    <Text style={styles.infoText}>
                      which may indicate conduction delay
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
        </ScrollView>

        
      </SafeAreaView>
      <NavigationBar />
    </View>
  );
}

const windowWidth = Dimensions.get('window').width;
const boxWidth = (windowWidth - 40) / 2;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  connectionContainer: {
    flexDirection: 'row',
    padding: 15,
  },
  connectionText: { fontSize: 14, color: '#333' },
  connectedText: { fontSize: 14, color: '#0A0', fontWeight: 'bold' },
  headerText: { fontSize: 24, fontWeight: 'bold', paddingHorizontal: 15 },
  dateTriggerWrapper: { padding: 15 },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
  },
  datePickerText: { fontSize: 16, color: '#333' },
  datePickerIcon: { fontSize: 18, color: '#333' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 10,
  },
  todayButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#09f',
    borderRadius: 6,
  },
  todayButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginVertical: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#EEE',
    marginRight: 10,
  },
  activeFilter: { backgroundColor: '#09f' },
  filterText: { fontSize: 14, color: '#333' },
  parametersContainer: {
    flex: 1,
    padding: 10,
  },
  parametersContentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  parameterBox: {
    width: boxWidth,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  parameterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  parameterTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#36f',
  },
  parameterArrow: {
    fontSize: 18,
    color: '#36f',
  },
  parameterValueContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  parameterValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 10,
  },
  parameterUnit: {
    fontSize: 18,
    fontWeight: 'normal',
    color: '#666',
  },
  parameterStatus: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  normalStatus: {
    color: '#00CC00',
  },
  abnormalStatus: {
    color: '#FF0000',
  },
  historyContainer: {
    marginTop: 5,
  },
  historyItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoBox: {
    backgroundColor: '#E8F4FF',
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#09f',
  },
  infoText: {
    fontSize: 12,
    color: '#09f',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 10,
    elevation: 10,
  },  
  todayButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#09f',
    borderRadius: 8,
  },
  todayButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },  
});
