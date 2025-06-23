// app/history.js

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { format, parseISO, parse, isValid } from 'date-fns';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import NavigationBar from './component/navbar';
import Header from './component/header';
import { useUser } from './UserContext';
import { sharedStyles } from './styles/shared';
import { historicalStyles } from './styles/components/historicalStyles';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const PAGE_SIZE = 6;
const MAX_DATE_SPAN_DAYS = 31;

// Transform DB rows to history format
const transformDbToHistory = (rows) => {
  return rows.map(r => {
    const rawTs = typeof r.timestamp === 'string' ? r.timestamp : '';
    const dt = parse(rawTs, 'dd/MM/yyyy HH:mm:ss', new Date());

    // Format date for filtering (YYYY-MM-DD only)
    const dateKey = isValid(dt) ? format(dt, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

    // Store full timestamp for display and sorting
    const fullTimestamp = isValid(dt) ? format(dt, 'yyyy-MM-dd HH:mm:ss') : format(new Date(), 'yyyy-MM-dd HH:mm:ss');

    return {
      date: dateKey, // Just the date part for filtering
      fullTimestamp, // Full timestamp for sorting
      hr: r.heartrate || r.heartbeat || 0,
      qrs: r.qrs || 0,
      qtc: r.qt || 0,
      heartvariance: r.heartvariance || 0,
      filename: r.filename || null,
      // Store original timestamp for display
      displayDate: rawTs || format(new Date(), 'dd/MM/yyyy HH:mm:ss'),
    };
  });
};

export default function HistoryScreen() {
  const { db, getCurrentUserTable, currentUser } = useUser();
  const [historyData, setHistoryData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calendarMonth, setCalendarMonth] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSelectingStart, setIsSelectingStart] = useState(true);
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [availableDates, setAvailableDates] = useState([]);

  const todayIso = format(new Date(), 'yyyy-MM-dd');

  // Load data effect with better error handling
  const loadData = useCallback(async () => {
    if (!db || !currentUser) {
      console.log('⚠️ Database or current user not ready yet');
      setHistoryData([]);
      setPage(0);
      return;
    }

    try {
      const tableName = getCurrentUserTable();

      // First, get all available dates for the calendar
      const datesQuery = `
        SELECT DISTINCT date(substr(timestamp, 7, 4) || '-' || substr(timestamp, 4, 2) || '-' || substr(timestamp, 1, 2)) as date 
        FROM ${tableName} 
        ORDER BY date DESC;
      `;
      const dateRows = await db.getAllAsync(datesQuery);
      const dates = dateRows.map(row => row.date);
      setAvailableDates(dates);

      // Set initial dates if not set
      if (!startDate || !endDate) {
        if (dates.length > 0) {
          const latestDate = dates[0];
          setStartDate(latestDate);
          setEndDate(latestDate);
          setCalendarMonth(latestDate.slice(0, 7) + '-01');
        } else {
          const today = format(new Date(), 'yyyy-MM-dd');
          setStartDate(today);
          setEndDate(today);
          setCalendarMonth(today.slice(0, 7) + '-01');
        }
        return; // Don't load data yet until dates are set
      }

      // Only fetch data for the selected date range
      console.log(`📊 Loading data from ${tableName} for date range: ${startDate} to ${endDate}`);

      const dataQuery = `
        SELECT * FROM ${tableName}
        WHERE date(substr(timestamp, 7, 4) || '-' || substr(timestamp, 4, 2) || '-' || substr(timestamp, 1, 2))
        BETWEEN ? AND ?
        ORDER BY timestamp DESC;
      `;

      const rows = await db.getAllAsync(dataQuery, [startDate, endDate]);
      console.log(`📈 Loaded ${rows.length} records for selected date range`);

      const transformedData = transformDbToHistory(rows);
      setHistoryData(transformedData);
      setPage(0);

    } catch (error) {
      console.error('❌ Error loading historical data:', error);
      setHistoryData([]);
      setPage(0);
    }
  }, [db, currentUser, getCurrentUserTable, startDate, endDate]);

  // Initial load and refresh on focus
  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Filter and sort the data
  const filtered = useMemo(() => {
    let result = historyData;

    // Sort the data
    result.sort((a, b) => {
      let aValue, bValue;

      if (sortField === 'date') {
        // Parse the full timestamp for comparison
        aValue = parse(a.displayDate, 'dd/MM/yyyy HH:mm:ss', new Date()).getTime();
        bValue = parse(b.displayDate, 'dd/MM/yyyy HH:mm:ss', new Date()).getTime();
      } else {
        aValue = parseFloat(a[sortField]) || 0;
        bValue = parseFloat(b[sortField]) || 0;
      }

      return sortDirection === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    });

    return result;
  }, [historyData, sortField, sortDirection]);

  // Available dates from data - use only the date part
  const availableDatesFromData = useMemo(() =>
    [...new Set(historyData.map(r => r.date))].sort(),
    [historyData]
  );

  const maxMonth = useMemo(() => todayIso.slice(0, 7), [todayIso]);

  // Calendar marked dates - following home.js logic exactly
  const markedDates = useMemo(() => {
    if (!calendarMonth || availableDates.length === 0) return {};

    const marks = {};
    const uniqueSet = new Set(availableDates);
    const [year, month] = calendarMonth.split('-');
    if (!year || !month) return {};

    const daysInMonth = new Date(year, month, 0).getDate();
    const startDateObj = startDate ? new Date(startDate) : null;

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${year}-${month.padStart(2, '0')}-${dayStr}`;
      const hasData = uniqueSet.has(dateKey);
      const isSelected = dateKey === startDate || dateKey === endDate;
      const isInRange = dateKey >= startDate && dateKey <= endDate;

      // Calculate if this date would exceed the max span limit
      let isDisabled = false;
      if (!isSelectingStart && startDateObj && hasData) {
        const currentDate = new Date(dateKey);
        const daysDifference = Math.abs(Math.floor((currentDate - startDateObj) / (1000 * 60 * 60 * 24)));
        isDisabled = daysDifference > MAX_DATE_SPAN_DAYS;
      }

      // Mark dates with data or in selected range
      if (hasData || isSelected || (isInRange && startDate !== endDate)) {
        marks[dateKey] = {
          customStyles: {
            container: {
              backgroundColor: isSelected ? '#36f' : (isInRange ? '#E8F4FF' : 'transparent'),
              borderRadius: isSelected ? 15 : 0,
              borderTopWidth: isInRange && !isSelected ? 1 : 0,
              borderBottomWidth: isInRange && !isSelected ? 1 : 0,
              borderLeftWidth: (isInRange && !isSelected) || dateKey === startDate ? 1 : 0,
              borderRightWidth: (isInRange && !isSelected) || dateKey === endDate ? 1 : 0,
              borderColor: '#36f',
              marginLeft: dateKey === startDate ? -1 : 0,
              marginRight: dateKey === endDate ? -1 : 0,
              opacity: isDisabled ? 0.3 : 1, // Dim dates that would exceed the limit
            },
            text: {
              color: isSelected ? '#fff' : (hasData ? (isDisabled ? '#999' : '#36f') : '#2d4150'),
              fontWeight: hasData || isSelected ? 'bold' : 'normal',
            },
          },
        };
      }
    }

    return marks;
  }, [calendarMonth, availableDates, startDate, endDate, isSelectingStart]);

  const handleDayPress = useCallback((day) => {
    const selectedDate = day.dateString;

    // Only allow selection of dates with data
    if (!availableDates.includes(selectedDate)) return;

    if (isSelectingStart) {
      // When selecting start date, set both start and end to the same date
      setStartDate(selectedDate);
      setEndDate(selectedDate);
      setIsSelectingStart(false);
      setPage(0); // Reset to first page
    } else {
      // When selecting end date
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(selectedDate);
      const daysDifference = Math.abs(Math.floor((endDateTime - startDateTime) / (1000 * 60 * 60 * 24)));

      // Check if date span exceeds maximum allowed days
      if (daysDifference > MAX_DATE_SPAN_DAYS) {
        Alert.alert(
          'Date Range Too Large',
          `Please select a date range of ${MAX_DATE_SPAN_DAYS} days or less to ensure optimal performance.`
        );
        return;
      }

      if (endDateTime < startDateTime) {
        // If end date is before start date, swap them
        setStartDate(selectedDate);
        setEndDate(startDate);
      } else {
        setEndDate(selectedDate);
      }
      setPage(0); // Reset to first page
    }
  }, [isSelectingStart, startDate, availableDates]);

  const openDatePicker = useCallback(() => {
    setIsSelectingStart(true);
    setShowDatePicker(true);
  }, []);

  const handleMonthChange = useCallback((month) => {
    const newMonthStr = `${month.year}-${String(month.month).padStart(2, '0')}`;
    if (newMonthStr <= maxMonth) {
      setCalendarMonth(`${newMonthStr}-01`);
    }
  }, [maxMonth]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const rows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  // Handle column header press for sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setPage(0); // Reset to first page when sorting changes
  };

  const goToToday = useCallback(() => {
    const todayMonth = todayIso.slice(0, 7) + '-01';
    setCalendarMonth(todayMonth);
  }, [todayIso]);

  // Add function to open saved PDF
  const openSavedPDF = async (filename) => {
    if (!filename) {
      Alert.alert('No Plot', 'No saved plot available for this measurement');
      return;
    }

    try {
      const databaseDir = FileSystem.documentDirectory + 'SQLite/';
      const filePath = databaseDir + filename;

      console.log('🔍 Looking for PDF at:', filePath);

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      console.log('📄 File info:', fileInfo);

      if (!fileInfo.exists) {
        Alert.alert('File Not Found', `The saved plot file could not be found at: ${filePath}`);
        return;
      }

      if (fileInfo.size === 0) {
        Alert.alert('Invalid File', 'The saved plot file appears to be empty');
        return;
      }

      console.log(`✅ Found PDF file: ${fileInfo.size} bytes`);

      // Share/open the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/pdf',
          dialogTitle: 'ECG Plot'
        });
      } else {
        Alert.alert('Success', `Plot file found at: ${filePath} (${fileInfo.size} bytes)`);
      }
    } catch (error) {
      console.error('❌ Error opening PDF:', error);
      Alert.alert('Error', `Failed to open the saved plot: ${error.message}`);
    }
  };

  return (
    <View style={sharedStyles.container}>
      <SafeAreaView style={sharedStyles.safeArea}>
        <Header title="History" showUserSwitcher={true} />
        <StatusBar barStyle="dark-content" />

        {/* Date Range Display */}
        {startDate && endDate && (
          <View style={historicalStyles.dateSpanWrapper}>
            <TouchableOpacity style={historicalStyles.dateSpanButton} onPress={openDatePicker}>
              <View style={historicalStyles.dateSpanContent}>
                <Text style={historicalStyles.dateSpanLabel}>DATE SPAN</Text>
                <Text style={historicalStyles.dateSpanValue}>
                  {format(parseISO(startDate), 'd MMM yyyy')} - {format(parseISO(endDate), 'd MMM yyyy')}
                </Text>
              </View>
              <Text style={historicalStyles.datePickerIcon}>📅</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowDatePicker(false);
            setIsSelectingStart(true);
          }}
        >
          <View style={historicalStyles.modalBackdrop}>
            <TouchableOpacity style={historicalStyles.modalOverlay} activeOpacity={1} onPress={() => {
              setShowDatePicker(false);
              setIsSelectingStart(true);
            }} />
            <View style={historicalStyles.modalContainer}>
              <View style={historicalStyles.modalHeader}>
                <View style={historicalStyles.headerLeft}>
                  <TouchableOpacity style={historicalStyles.todayButton} onPress={goToToday}>
                    <Text style={historicalStyles.todayButtonText}>Today</Text>
                  </TouchableOpacity>
                  <View style={historicalStyles.selectionIndicatorContainer}>
                    <Text style={historicalStyles.selectionIndicator}>
                      {isSelectingStart ? 'Select Start Date' : 'Select End Date'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => {
                  setShowDatePicker(false);
                  setIsSelectingStart(true);
                }} style={historicalStyles.closeButton}>
                  <Text style={historicalStyles.closeButtonText}>Done</Text>
                </TouchableOpacity>
              </View>

              <Calendar
                current={calendarMonth}
                minDate="2020-01-01"
                maxDate={todayIso}
                onDayPress={handleDayPress}
                markedDates={markedDates}
                markingType="custom"
                onMonthChange={handleMonthChange}
                disableAllTouchEventsForDisabledDays={true}
                enableSwipeMonths={true}
                hideExtraDays={true}
                firstDay={1}
                disableMonthChange={false}
                hideArrows={false}
                disableArrowLeft={false}
                disableArrowRight={calendarMonth && calendarMonth.slice(0, 7) >= maxMonth}
                theme={{
                  backgroundColor: '#ffffff',
                  calendarBackground: '#ffffff',
                  textSectionTitleColor: '#b6c1cd',
                  selectedDayBackgroundColor: 'transparent',
                  selectedDayTextColor: '#36f',
                  todayTextColor: '#09f',
                  dayTextColor: '#2d4150',
                  textDisabledColor: '#d9e1e8',
                  arrowColor: '#09f',
                  disabledArrowColor: '#d9e1e8',
                  monthTextColor: '#2d4150',
                  indicatorColor: '#09f',
                  textDayFontFamily: 'System',
                  textMonthFontFamily: 'System',
                  textDayHeaderFontFamily: 'System',
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14
                }}
                style={historicalStyles.calendar}
              />
            </View>
          </View>
        </Modal>

        <View style={historicalStyles.tableContainer}>
          <View style={[historicalStyles.tableRow, historicalStyles.tableHeader]}>
            <TouchableOpacity
              style={[historicalStyles.cell, historicalStyles.colDate]}
              onPress={() => handleSort('date')}
            >
              <View style={historicalStyles.headerContent}>
                <Text style={historicalStyles.headerText}>Date</Text>
                <Text style={historicalStyles.headerText}>
                  {sortField === 'date' && sortDirection === 'asc' ? '▵' : '▿'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[historicalStyles.cell, historicalStyles.colSmall]}
              onPress={() => handleSort('hr')}
            >
              <View style={historicalStyles.headerContent}>
                <Text style={historicalStyles.headerText}>HR</Text>
                <Text style={historicalStyles.headerText}>
                  {sortField === 'hr' && sortDirection === 'asc' ? '▵' : '▿'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[historicalStyles.cell, historicalStyles.colSmall]}
              onPress={() => handleSort('qrs')}
            >
              <View style={historicalStyles.headerContent}>
                <Text style={historicalStyles.headerText}>QRS</Text>
                <Text style={historicalStyles.headerText}>
                  {sortField === 'qrs' && sortDirection === 'asc' ? '▵' : '▿'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[historicalStyles.cell, historicalStyles.colSmall]}
              onPress={() => handleSort('qtc')}
            >
              <View style={historicalStyles.headerContent}>
                <Text style={historicalStyles.headerText}>QTC</Text>
                <Text style={historicalStyles.headerText}>
                  {sortField === 'qtc' && sortDirection === 'asc' ? '▵' : '▿'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[historicalStyles.cell, historicalStyles.colSmall]}
              onPress={() => handleSort('heartvariance')}
            >
              <View style={historicalStyles.headerContent}>
                <Text style={historicalStyles.headerText}>HRV</Text>
                <Text style={historicalStyles.headerText}>
                  {sortField === 'heartvariance' && sortDirection === 'asc' ? '▵' : '▿'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={[historicalStyles.cell, historicalStyles.colPlot]}>
              <Text style={historicalStyles.headerText}>Plot</Text>
            </View>
          </View>

          <View style={historicalStyles.tableBody}>
            {rows.map((r, i) => (
              <View key={i} style={[historicalStyles.tableRow, i % 2 === 0 && historicalStyles.evenRow]}>
                <Text style={[historicalStyles.cell, historicalStyles.colDate, historicalStyles.cellText]}>
                  {r.displayDate}
                </Text>
                <Text style={[historicalStyles.cell, historicalStyles.colSmall, historicalStyles.cellText]}>{r.hr}</Text>
                <Text style={[historicalStyles.cell, historicalStyles.colSmall, historicalStyles.cellText]}>{r.qrs}</Text>
                <Text style={[historicalStyles.cell, historicalStyles.colSmall, historicalStyles.cellText]}>{r.qtc}</Text>
                <Text style={[historicalStyles.cell, historicalStyles.colSmall, historicalStyles.cellText]}>{r.heartvariance}</Text>
                <TouchableOpacity
                  style={[historicalStyles.cell, historicalStyles.colPlot, { alignItems: 'center' }]}
                  onPress={() => openSavedPDF(r.filename)}
                  disabled={!r.filename}
                >
                  <MaterialCommunityIcons
                    name="chart-line"
                    size={20}
                    color={r.filename ? "#09f" : "#ccc"}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Pagination sticks directly to table */}
          <View style={historicalStyles.pager}>
            <TouchableOpacity
              style={[historicalStyles.pagerButton, page === 0 && historicalStyles.pagerButtonDisabled]}
              onPress={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={page === 0 ? '#ccc' : '#09f'}
              />
            </TouchableOpacity>

            <View style={historicalStyles.pagerInfo}>
              <Text style={historicalStyles.pagerText}>
                Page {page + 1} of {pageCount || 1}
              </Text>
            </View>

            <TouchableOpacity
              style={[historicalStyles.pagerButton, page === pageCount - 1 && historicalStyles.pagerButtonDisabled]}
              onPress={() => setPage(Math.min(page + 1, pageCount - 1))}
              disabled={page === pageCount - 1}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={page === pageCount - 1 ? '#ccc' : '#09f'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
      <NavigationBar />
    </View>
  );
}