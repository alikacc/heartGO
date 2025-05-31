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

const PAGE_SIZE = 6;

// Transform DB rows to history format
const transformDbToHistory = (rows) => {
  return rows.map(r => {
    const rawTs = typeof r.timestamp === 'string' ? r.timestamp : '';
    const dt = parse(rawTs, 'dd/MM/yyyy HH:mm:ss', new Date());
    const dateKey = isValid(dt) ? format(dt, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

    return {
      date: dateKey,
      hr: r.heartrate || r.heartbeat || 0,
      qrs: r.qrs || 0,
      qtc: r.qt || 0,
      heartvariance: r.heartvariance || 0,
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

  const todayIso = format(new Date(), 'yyyy-MM-dd');
  const maxMonth = useMemo(() => todayIso.slice(0, 7), [todayIso]);

  // Load data effect with better error handling
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!db || !currentUser) {
        console.log('⚠️ Database or current user not ready yet');
        if (!cancelled) {
          setHistoryData([]);
          setPage(0);
        }
        return;
      }

      try {
        const tableName = getCurrentUserTable();
        console.log(`📊 Loading historical data from table: ${tableName} for user: ${currentUser.name}`);

        // Check if table exists first
        const tableExists = await db.getFirstAsync(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name=?;
        `, tableName);

        if (!tableExists) {
          console.log(`⚠️ Table ${tableName} does not exist yet`);
          if (!cancelled) {
            setHistoryData([]);
            setPage(0);
          }
          return;
        }

        const rows = await db.getAllAsync(`SELECT * FROM ${tableName};`);
        console.log(`📈 Loaded ${rows.length} historical records from ${tableName}`);

        const transformedData = transformDbToHistory(rows);
        setHistoryData(transformedData);

        // Set initial date range if we have data
        if (transformedData.length > 0) {
          const dates = transformedData.map(r => r.date).sort();
          const firstDate = dates[0];
          const lastDate = dates[dates.length - 1];

          setStartDate(firstDate);
          setEndDate(lastDate);
          setCalendarMonth(firstDate.slice(0, 7) + '-01');
        } else {
          // No data, set to today
          setStartDate(todayIso);
          setEndDate(todayIso);
          setCalendarMonth(todayIso.slice(0, 7) + '-01');
        }
      } catch (error) {
        console.error('❌ Error loading historical data:', error);
        if (!cancelled) {
          setHistoryData([]);
          setPage(0);
        }
      }
    };

    loadData();
    return () => { cancelled = true };
  }, [db, currentUser, getCurrentUserTable, startDate, endDate, sortField, sortDirection]);

  useFocusEffect(useCallback(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!db || !currentUser) {
        console.log('⚠️ Database or current user not ready yet');
        if (!cancelled) {
          setHistoryData([]);
          setPage(0);
        }
        return;
      }

      try {
        const tableName = getCurrentUserTable();
        console.log(`📊 Loading historical data from table: ${tableName} for user: ${currentUser.name}`);

        // Check if table exists first
        const tableExists = await db.getFirstAsync(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name=?;
        `, tableName);

        if (!tableExists) {
          console.log(`⚠️ Table ${tableName} does not exist yet`);
          if (!cancelled) {
            setHistoryData([]);
            setPage(0);
          }
          return;
        }

        const rows = await db.getAllAsync(`SELECT * FROM ${tableName};`);
        console.log(`📈 Loaded ${rows.length} historical records from ${tableName}`);

        const transformedData = transformDbToHistory(rows);
        setHistoryData(transformedData);

        // Set initial date range if we have data
        if (transformedData.length > 0) {
          const dates = transformedData.map(r => r.date).sort();
          const firstDate = dates[0];
          const lastDate = dates[dates.length - 1];

          setStartDate(firstDate);
          setEndDate(lastDate);
          setCalendarMonth(firstDate.slice(0, 7) + '-01');
        } else {
          // No data, set to today
          setStartDate(todayIso);
          setEndDate(todayIso);
          setCalendarMonth(todayIso.slice(0, 7) + '-01');
        }
      } catch (error) {
        console.error('❌ Error loading historical data:', error);
        if (!cancelled) {
          setHistoryData([]);
          setPage(0);
        }
      }
    };

    loadData();
    return () => { cancelled = true };
  }, [db, currentUser, getCurrentUserTable, todayIso, startDate, endDate, sortField, sortDirection]));

  // Available dates from data
  const availableDates = useMemo(() =>
    [...new Set(historyData.map(r => r.date))].sort(),
    [historyData]
  );

  // Filter by date window and sort
  const filtered = useMemo(() => {
    let result = historyData.filter(r => r.date >= startDate && r.date <= endDate);

    // Sort the data
    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Convert date strings to Date objects for proper sorting
      if (sortField === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        // Convert to numbers for HR, QRS, QTc
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [historyData, startDate, endDate, sortField, sortDirection]);

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

  // Calendar marked dates
  const markedDates = useMemo(() => {
    if (!calendarMonth || availableDates.length === 0) return {};

    const marks = {};
    const availableDatesSet = new Set(availableDates);
    const [year, month] = calendarMonth.split('-');

    if (!year || !month) return {};

    const daysInMonth = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
      const hasData = availableDatesSet.has(dateStr);
      const isStartDate = dateStr === startDate;
      const isEndDate = dateStr === endDate;
      const isInRange = dateStr >= startDate && dateStr <= endDate;
      const isToday = dateStr === todayIso;

      if (hasData || isStartDate || isEndDate) {
        let backgroundColor = 'transparent';
        let textColor = '#09f';
        let fontWeight = 'bold';

        if (isStartDate || isEndDate) {
          backgroundColor = '#09f';
          textColor = '#fff';
          fontWeight = 'bold';
        } else if (isInRange && hasData) {
          backgroundColor = '#E8F4FF';
          textColor = '#09f';
        } else if (isToday && hasData) {
          backgroundColor = '#E8F4FF';
          fontWeight = '600';
        }

        marks[dateStr] = {
          customStyles: {
            container: {
              backgroundColor,
              borderRadius: 16,
              borderWidth: isToday && !isStartDate && !isEndDate ? 1 : 0,
              borderColor: isToday && !isStartDate && !isEndDate ? '#09f' : 'transparent',
            },
            text: {
              color: textColor,
              fontWeight: fontWeight,
            }
          }
        };
      }
    }

    return marks;
  }, [availableDates, startDate, endDate, calendarMonth, todayIso]);

  const handleDayPress = useCallback((day) => {
    if (!availableDates.includes(day.dateString)) return;

    if (isSelectingStart) {
      setStartDate(day.dateString);
      setIsSelectingStart(false);
      if (day.dateString > endDate) {
        setEndDate(day.dateString);
      }
    } else {
      setEndDate(day.dateString);
      setIsSelectingStart(true);
      if (day.dateString < startDate) {
        setStartDate(day.dateString);
      }
      setShowDatePicker(false);
    }
  }, [isSelectingStart, availableDates, startDate, endDate]);

  const handleMonthChange = useCallback((month) => {
    const newMonthStr = `${month.year}-${String(month.month).padStart(2, '0')}`;
    if (newMonthStr <= maxMonth) {
      setCalendarMonth(`${newMonthStr}-01`);
    }
  }, [maxMonth]);

  const openDatePicker = useCallback(() => {
    setIsSelectingStart(true);
    setShowDatePicker(true);
  }, []);

  const closeDatePicker = useCallback(() => {
    setShowDatePicker(false);
    setIsSelectingStart(true);
  }, []);

  const goToToday = useCallback(() => {
    const todayMonth = todayIso.slice(0, 7) + '-01';
    setCalendarMonth(todayMonth);
  }, [todayIso]);

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
          onRequestClose={closeDatePicker}
        >
          <View style={historicalStyles.modalBackdrop}>
            <TouchableOpacity style={historicalStyles.modalOverlay} activeOpacity={1} onPress={closeDatePicker} />
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
                <TouchableOpacity onPress={closeDatePicker} style={historicalStyles.closeButton}>
                  <Text style={historicalStyles.closeButtonText}>Done</Text>
                </TouchableOpacity>
              </View>

              <Calendar
                current={calendarMonth}
                minDate="2020-01-01"
                maxDate={todayIso}
                onDayPress={handleDayPress}
                markedDates={markedDates}
                onMonthChange={handleMonthChange}
                hideExtraDays={true}
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
                  {sortField === 'date' && sortDirection === 'asc' ? '↑' : '↓'}
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
                  {sortField === 'hr' && sortDirection === 'asc' ? '↑' : '↓'}
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
                  {sortField === 'qrs' && sortDirection === 'asc' ? '↑' : '↓'}
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
                  {sortField === 'qtc' && sortDirection === 'asc' ? '↑' : '↓'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={[historicalStyles.cell, historicalStyles.colSmall]}>
              <Text style={historicalStyles.headerText}>HRV</Text>
            </View>
            <View style={[historicalStyles.cell, historicalStyles.colPlot]}>
              <Text style={historicalStyles.headerText}>Plot</Text>
            </View>
          </View>

          <ScrollView style={historicalStyles.tableBody}>
            {rows.map((r, i) => (
              <View key={i} style={[historicalStyles.tableRow, i % 2 === 0 && historicalStyles.evenRow]}>
                <Text style={[historicalStyles.cell, historicalStyles.colDate, historicalStyles.cellText]}>
                  {format(parseISO(r.date), 'dd/MM/yyyy')}
                </Text>
                <Text style={[historicalStyles.cell, historicalStyles.colSmall, historicalStyles.cellText]}>{r.hr}</Text>
                <Text style={[historicalStyles.cell, historicalStyles.colSmall, historicalStyles.cellText]}>{r.qrs}</Text>
                <Text style={[historicalStyles.cell, historicalStyles.colSmall, historicalStyles.cellText]}>{r.qtc}</Text>
                <Text style={[historicalStyles.cell, historicalStyles.colSmall, historicalStyles.cellText]}>{r.heartvariance}</Text>
                <TouchableOpacity style={[historicalStyles.cell, historicalStyles.colPlot, { alignItems: 'center' }]}>
                  <MaterialCommunityIcons name="chart-line" size={20} color="#09f" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

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