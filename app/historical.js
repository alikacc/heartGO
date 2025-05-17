// app/history.js

import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { format, parseISO } from 'date-fns';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import NavigationBar from './component/navbar'; // adjust path as needed

// ——— Dummy “CSV” data for now ———
const RAW = [
  { date: '2024-06-14', hr: 72, qrs: 120, qtc: 410, rhythm: 'Normal' },
  { date: '2024-06-15', hr: 74, qrs: 119, qtc: 400, rhythm: 'Normal' },
  { date: '2024-06-16', hr: 75, qrs: 121, qtc: 405, rhythm: 'Normal' },
  { date: '2024-06-17', hr: 76, qrs: 122, qtc: 408, rhythm: 'Normal' },
  { date: '2024-06-18', hr: 75, qrs: 130, qtc: 410, rhythm: 'Normal' },
  { date: '2024-06-19', hr: 75, qrs: 120, qtc: 402, rhythm: 'Normal' },
  { date: '2024-06-20', hr: 73, qrs: 120, qtc: 405, rhythm: 'Normal' },
];

const PAGE_SIZE = 5;

export default function HistoryScreen() {
  const [startDate, setStartDate] = useState(RAW[0].date);
  const [endDate, setEndDate] = useState(RAW[RAW.length - 1].date);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selecting, setSelecting] = useState('start');
  const [page, setPage] = useState(0);

  // filter by date window
  const filtered = RAW.filter(r =>
    r.date >= startDate && r.date <= endDate
  );
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);

  const rows = filtered.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE
  );

  const onDayPress = (day) => {
    if (selecting === 'start') {
      setStartDate(day.dateString);
      if (day.dateString > endDate) setEndDate(day.dateString);
    } else {
      setEndDate(day.dateString);
      if (day.dateString < startDate) setStartDate(day.dateString);
    }
    setCalendarOpen(false);
  };

  // build markedDates so only our RAW dates are clickable
  const marks = {};
  RAW.forEach(r => {
    marks[r.date] = { disabled: false };
  });
  // everything else in the current month gets disabled
  const currentMonth = (selecting === 'start' ? startDate : endDate).slice(0, 7);
  const [year, mon] = currentMonth.split('-');
  const daysInMon = new Date(+year, +mon, 0).getDate();
  for (let d = 1; d <= daysInMon; d++) {
    const ds = `${year}-${mon}-${String(d).padStart(2, '0')}`;
    if (!marks[ds]) marks[ds] = { disabled: true };
  }

// after:
    // const parts = (calendarMonth || '').split('-');
    // const year  = parts[0] || '1970';
    // const month = parts[1] || '01';
    // const daysInMonth  = new Date(+year, +month, 0).getDate();
    // const monthPrefix = `${year}-${month}`;


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* ——— Header ——— */}
      <Text style={styles.pageTitle}>History</Text>

      {/* ——— Date range pickers ——— */}
      <View style={styles.rangeContainer}>
        <TouchableOpacity
          style={styles.rangeBtn}
          onPress={() => { setSelecting('start'); setCalendarOpen(true); }}
        >
          <Text style={styles.rangeLabel}>Start Date</Text>
          <Text style={styles.rangeValue}>{format(parseISO(startDate), 'd MMM yyyy')}</Text>
          <Ionicons name="caret-down" size={16} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rangeBtn}
          onPress={() => { setSelecting('end'); setCalendarOpen(true); }}
        >
          <Text style={styles.rangeLabel}>End Date</Text>
          <Text style={styles.rangeValue}>{format(parseISO(endDate), 'd MMM yyyy')}</Text>
          <Ionicons name="caret-down" size={16} color="#333" />
        </TouchableOpacity>
      </View>

      {/* ——— Table header ——— */}
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.cell, styles.colDate]}>Date</Text>
        <Text style={[styles.cell, styles.colSmall]}>HR</Text>
        <Text style={[styles.cell, styles.colSmall]}>QRS</Text>
        <Text style={[styles.cell, styles.colSmall]}>QTc</Text>
        <Text style={[styles.cell, styles.colSmall]}>Rhythm</Text>
        <Text style={[styles.cell, styles.colPlot]}>Plot</Text>
      </View>

      {/* ——— Table body ——— */}
      <ScrollView style={styles.body}>
        {rows.map((r, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.cell, styles.colDate]}>
              {format(parseISO(r.date), 'd MMM yyyy')}
            </Text>
            <Text style={[styles.cell, styles.colSmall]}>{r.hr}</Text>
            <Text style={[styles.cell, styles.colSmall]}>{r.qrs}</Text>
            <Text style={[styles.cell, styles.colSmall]}>{r.qtc}</Text>
            <View style={[styles.cell, styles.colSmall, {alignItems:'center'}]}>
              <View style={[
                styles.dot,
                { backgroundColor: r.rhythm==='Normal' ? '#2ecc71' : '#e74c3c' }
              ]}/>
            </View>
            <TouchableOpacity style={[styles.cell, styles.colPlot]}>
              <MaterialCommunityIcons
                name="chart-line"
                size={20}
                color="#09f"
              />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* ——— Pagination ——— */}
      <View style={styles.pager}>
        <TouchableOpacity
          onPress={() => setPage(Math.max(0, page-1))}
          disabled={page===0}
        >
          <Text style={[styles.pageBtn, page===0 && {opacity:0.4}]}>
            Previous
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setPage(Math.min(page+1, pageCount-1))}
          disabled={page===pageCount-1}
        >
          <Text style={[styles.pageBtn, page===pageCount-1 && {opacity:0.4}]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>

      {/* ——— Calendar Modal ——— */}
      <Modal
        visible={calendarOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPressOut={() => setCalendarOpen(false)}
        >
          <View style={styles.modalContent}>
            <Calendar
              current={(selecting==='start'?startDate:endDate).slice(0,7)+'-01'}
              onDayPress={onDayPress}
              markedDates={marks}
              disableAllTouchEventsForDisabledDays
              theme={{
                selectedDayBackgroundColor: '#09f',
                todayTextColor: '#09f',
                disabledTextColor: '#ccc'
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ——— Bottom nav ——— */}
      <NavigationBar/>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS==='android' ? StatusBar.currentHeight : 0,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  rangeContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  rangeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#09f',
  },
  rangeLabel: {
    fontSize: 12,
    color: '#555',
    marginRight: 4,
  },
  rangeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginRight: 4,
  },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#09f',
    backgroundColor: '#fff',
  },
  tableHeader: {
    backgroundColor: '#E0F7FF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginHorizontal: 16,
  },
  cell: {
    padding: 12,
    fontSize: 12,
    color: '#000',
  },
  colDate:    { flex: 2 },
  colSmall:   { flex: 1, textAlign: 'center' },
  colPlot:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  body: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 8,
  },

  pager: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#09f',
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginHorizontal: 16,
    borderRadius: 0,
  },
  pageBtn: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  modalBackdrop: {
    flex:1,
    backgroundColor:'rgba(0,0,0,0.4)',
    justifyContent:'center',
    alignItems:'center'
  },
  modalContent: {
    backgroundColor:'#fff',
    borderRadius:8,
    overflow:'hidden'
  }
});
