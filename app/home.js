// Home.js

import React, { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { format, parse, isValid } from 'date-fns';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import Header from './component/header';
import NavigationBar from './component/navbar';
import * as SQLite from 'expo-sqlite';
import { BLEContext } from './BLEContext';
import { useRouter } from 'expo-router';
import { sharedStyles } from './styles/shared';
import { homeStyles } from './styles/components/homeStyles';
import { useUser } from './UserContext';

// ─── Threshold definitions ─────────────────────────────────────
const THRESHOLDS = {
  'Heartbeat': { min: 50, max: 90, unit: 'bpm' },
  'QRS Duration': { min: 75, max: 105, unit: 'ms' },
  'QT Interval': { max: 440, unit: 'ms' }, // Using the most conservative threshold
  'Heart Variance': { max: 20, unit: 'ms' }, // R-R interval variation
};

// ─── Status determination function ─────────────────────────────────────
const determineStatus = (parameter, value) => {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return 'Normal'; // Default for invalid values

  const threshold = THRESHOLDS[parameter];
  if (!threshold) return 'Normal'; // Default for unknown parameters

  switch (parameter) {
    case 'Heartbeat':
      return (numValue >= threshold.min && numValue <= threshold.max) ? 'Normal' : 'Abnormal';

    case 'QRS Duration':
      return (numValue >= threshold.min && numValue <= threshold.max) ? 'Normal' : 'Abnormal';

    case 'QT Interval':
      return (numValue <= threshold.max) ? 'Normal' : 'Abnormal';

    case 'Heart Variance':
      return (numValue <= threshold.max) ? 'Normal' : 'Abnormal';

    default:
      return 'Normal';
  }
};

// ─── Flatten + derive ISO dateKey ─────────────────────────────────────
const flattenDbRows = (rows) =>
  rows.flatMap(r => {
    const rawTs = typeof r.timestamp === 'string' ? r.timestamp : '';
    const dt = parse(rawTs, 'dd/MM/yyyy HH:mm:ss', new Date());
    const dateKey = isValid(dt)
      ? format(dt, 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd');

    const heartbeatValue = String(r.heartbeat || 0);
    const qtValue = String(r.qt || 0);
    const qrsValue = String(r.qrs || 0);
    const heartvarianceValue = String(r.heartvariance || 0);

    return [
      {
        rawTs,
        dateKey,
        parameter: 'Heartbeat',
        value: heartbeatValue,
        unit: 'bpm',
        status: determineStatus('Heartbeat', heartbeatValue)
      },
      {
        rawTs,
        dateKey,
        parameter: 'QT Interval',
        value: qtValue,
        unit: 'ms',
        status: determineStatus('QT Interval', qtValue)
      },
      {
        rawTs,
        dateKey,
        parameter: 'QRS Duration',
        value: qrsValue,
        unit: 'ms',
        status: determineStatus('QRS Duration', qrsValue)
      },
      {
        rawTs,
        dateKey,
        parameter: 'Heart Variance',
        value: heartvarianceValue,
        unit: 'ms',
        status: determineStatus('Heart Variance', heartvarianceValue)
      },
    ];
  });

const getUniqueDates = (data) =>
  [...new Set(data.map(d => d.dateKey))]
    .sort((a, b) => new Date(b) - new Date(a));

const getLatestRecords = (data, dateKey) => {
  const byParam = {};
  data
    .filter(item => item.dateKey === dateKey)
    .forEach(item => {
      (byParam[item.parameter] ||= []).push(item);
    });

  const latest = {};
  for (const [param, items] of Object.entries(byParam)) {
    items.sort((a, b) => {
      const da = parse(a.rawTs, 'dd/MM/yyyy HH:mm:ss', new Date());
      const db = parse(b.rawTs, 'dd/MM/yyyy HH:mm:ss', new Date());
      return db - da;
    });
    latest[param] = {
      ...items[0],
      history: items.slice(1, 3).map(h => ({
        rawTs: h.rawTs,
        value: h.value,
        unit: h.unit,
        status: determineStatus(param, h.value)
      })),
    };
  }
  return latest;
};

// // ─── Helper functions for abnormal status messages ─────────────────────────────────────
// const getAbnormalMessage = (parameter, value) => {
//   const threshold = THRESHOLDS[parameter];
//   if (!threshold) return `${parameter} is abnormal`;

//   switch (parameter) {
//     case 'Heartbeat':
//       if (value < threshold.min) return 'Heart rate is too low (Bradycardia)';
//       if (value > threshold.max) return 'Heart rate is too high (Tachycardia)';
//       break;

//     case 'QRS Duration':
//       if (value < threshold.min) return 'QRS duration is too short';
//       if (value > threshold.max) return 'QRS duration is prolonged';
//       break;

//     case 'QT Interval':
//       if (value > threshold.max) return 'QT interval is prolonged';
//       break;

//     case 'Heart Variance':
//       if (value > threshold.max) return 'Heart rhythm variability is high';
//       break;

//     default:
//       return `${parameter} is abnormal`;
//   }
//   return `${parameter} is abnormal`;
// };

// const getAbnormalDescription = (parameter) => {
//   switch (parameter) {
//     case 'Heartbeat':
//       return 'which may indicate cardiac rhythm disorders';

//     case 'QRS Duration':
//       return 'which may indicate conduction delay';

//     case 'QT Interval':
//       return 'which may increase risk of arrhythmias';

//     case 'Heart Variance':
//       return 'which may indicate irregular heart rhythm';

//     default:
//       return 'please consult with healthcare provider';
//   }
// };

export default function Home() {
  const { isConnected } = useContext(BLEContext);
  const { db, getCurrentUserTable, currentUser } = useUser();
  const router = useRouter();
  const todayIso = format(new Date(), 'yyyy-MM-dd');
  const [flatData, setFlatData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [calendarMonth, setCalendarMonth] = useState(todayIso.slice(0, 7) + '-01');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Use ref to store marked dates and prevent unnecessary re-renders
  const markedDatesRef = useRef({});
  const uniqueDatesRef = useRef([]);

  const loadData = useCallback(async () => {
    if (!db || !currentUser) {
      console.log('⚠️ Database or current user not ready yet');
      return;
    }

    try {
      const tableName = getCurrentUserTable();
      console.log(`📊 Loading data from table: ${tableName} for user: ${currentUser.name}`);

      const rows = await db.getAllAsync(`SELECT * FROM ${tableName};`);
      console.log(`📈 Loaded ${rows.length} records from ${tableName}`);

      const data = flattenDbRows(rows);
      setFlatData(data);

      const dates = getUniqueDates(data);
      if (dates.length) {
        setSelectedDate(dates[0]);
        setCalendarMonth(dates[0].slice(0, 7) + '-01');
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      // If table doesn't exist, it might be a new user with no data yet
      setFlatData([]);
    }
  }, [db, currentUser, getCurrentUserTable]);

  useEffect(() => {
    let cancelled = false;

    const loadMeasurements = async () => {
      if (!db || !currentUser) {
        console.log('⚠️ Database or current user not ready');
        if (!cancelled) {
          setMeasurements([]);
        }
        return;
      }

      try {
        const tableName = getCurrentUserTable();
        console.log(`📊 Loading measurements from table: ${tableName}`);

        // Check if table exists
        const tableExists = await db.getFirstAsync(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name=?;
        `, tableName);

        if (!tableExists) {
          console.log(`⚠️ Table ${tableName} does not exist`);
          if (!cancelled) {
            setMeasurements([]);
          }
          return;
        }

        // Rest of existing loadMeasurements logic...

      } catch (error) {
        console.error('❌ Error loading measurements:', error);
        if (!cancelled) {
          setMeasurements([]);
        }
      }
    };

    loadMeasurements();
    return () => { cancelled = true };
  }, [db, currentUser, getCurrentUserTable, selectedDate]);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  // Console log the fetched database data for the selected date
  useEffect(() => {
    if (flatData.length > 0 && selectedDate) {
      const filteredDataForDate = flatData.filter(item => item.dateKey === selectedDate);
      const latestRecordsForDate = getLatestRecords(flatData, selectedDate);

      console.log(`📅 Fetched database data for date: ${selectedDate}`);
      console.log(`📊 Total records for this date: ${filteredDataForDate.length}`);
      console.log(`📈 Filtered data for ${selectedDate}:`, filteredDataForDate);
      console.log(`🔗 Latest records for ${selectedDate}:`, latestRecordsForDate);
    }
  }, [flatData, selectedDate]);

  const uniqueDates = useMemo(() => {
    const dates = getUniqueDates(flatData);
    uniqueDatesRef.current = dates;
    return dates;
  }, [flatData]);

  const latestRecords = useMemo(() => getLatestRecords(flatData, selectedDate), [flatData, selectedDate]);

  const formatDisplayDate = ds => format(new Date(ds), 'd MMMM yyyy');
  const formatTime = rawTs => {
    const dt = parse(rawTs, 'dd/MM/yyyy HH:mm:ss', new Date());
    return isValid(dt) ? format(dt, 'HH:mm') : '--:--';
  };

  // Optimized marked dates generation - stable reference to prevent flickering
  const markedDates = useMemo(() => {
    if (!calendarMonth || uniqueDates.length === 0) return {};

    const marks = {};
    const uniqueSet = new Set(uniqueDates);
    const [year, month] = calendarMonth.split('-');
    if (!year || !month) return {};

    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${year}-${month.padStart(2, '0')}-${dayStr}`;
      const hasData = uniqueSet.has(dateKey);
      const isSel = dateKey === selectedDate;

      if (hasData || isSel) {
        marks[dateKey] = {
          customStyles: {
            container: {
              backgroundColor: isSel ? '#36f' : 'transparent',
              borderRadius: isSel ? 15 : 0,
            },
            text: {
              color: isSel ? '#fff' : '#36f',
              fontWeight: 'bold',
            },
          },
        };
      }
    }

    return marks;
  }, [calendarMonth, uniqueDates, selectedDate]);

  // Get max allowed month (current month)  
  const maxMonth = useMemo(() => todayIso.slice(0, 7), [todayIso]);

  const goToToday = useCallback(() => {
    const todayMonth = todayIso.slice(0, 7) + '-01';
    setCalendarMonth(todayMonth);
    setSelectedDate(todayIso);
    setShowDatePicker(false);
  }, [todayIso]);

  const handleDayPress = useCallback((day) => {
    if (uniqueDatesRef.current.includes(day.dateString)) {
      setSelectedDate(day.dateString);
      setShowDatePicker(false);
    }
  }, []);

  const handleMonthChange = useCallback((month) => {
    const newMonthStr = `${month.year}-${String(month.month).padStart(2, '0')}`;
    if (newMonthStr <= maxMonth) {
      setCalendarMonth(`${newMonthStr}-01`);
    }
  }, [maxMonth]);

  // Check if today has no measurements
  const todayRecords = useMemo(() => getLatestRecords(flatData, selectedDate), [flatData, selectedDate]);
  const hasNoMeasurements = Object.keys(todayRecords).length === 0;
  const isToday = selectedDate === todayIso;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <SafeAreaView style={sharedStyles.safeArea}>
        <Header title="Home" />
        <StatusBar barStyle="dark-content" />

        {/* <View style={homeStyles.connectionContainer}>
          <Text style={homeStyles.connectionText}>You are </Text>
          <Text style={[
            homeStyles.connectedText,
            { color: isConnected ? '#00CC00' : '#999999' }
          ]}>
            {isConnected ? 'Connected' : 'Not Connected'}
          </Text>
        </View> */}

        {/* Date Picker */}
        <View style={homeStyles.dateTriggerWrapper}>
          <TouchableOpacity
            style={homeStyles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={homeStyles.datePickerText}>
              Date: {formatDisplayDate(selectedDate)}
            </Text>
            <Text style={homeStyles.datePickerIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={homeStyles.modalBackdrop}>
            <TouchableOpacity
              style={homeStyles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            />
            <View style={homeStyles.modalContainer}>
              <View style={homeStyles.modalHeader}>
                <TouchableOpacity
                  onPress={goToToday}
                  style={homeStyles.todayButton}
                >
                  <Text style={homeStyles.todayButtonText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  style={homeStyles.closeButton}
                >
                  <Text style={homeStyles.closeButtonText}>Done</Text>
                </TouchableOpacity>
              </View>

              <Calendar
                current={calendarMonth}
                onMonthChange={handleMonthChange}
                onDayPress={handleDayPress}
                markedDates={markedDates}
                markingType="custom"
                disableAllTouchEventsForDisabledDays={true}
                enableSwipeMonths={true}
                hideExtraDays={true}
                firstDay={1}
                maxDate={todayIso}
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
                style={homeStyles.calendar}
              />
            </View>
          </View>
        </Modal>

        {/* Filters */}
        {/* <View style={homeStyles.filtersContainer}>
          {['All', 'Normal', 'Abnormal'].map(f => (
            <TouchableOpacity
              key={f}
              style={[
                homeStyles.filterButton,
                statusFilter === f && homeStyles.activeFilter
              ]}
              onPress={() => setStatusFilter(f)}
            >
              <Text style={[
                homeStyles.filterText,
                statusFilter === f && homeStyles.activeFilterText
              ]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View> */}

        {/* Two-column grid */}
        <ScrollView
          style={homeStyles.parametersContainer}
          contentContainerStyle={homeStyles.parametersContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {isToday && hasNoMeasurements ? (
            <View style={homeStyles.noMeasurementContainer}>
              <Text style={homeStyles.noMeasurementText}>You have no measurement yet</Text>
            </View>
          ) : (
            <>
              {Object.entries(latestRecords)
                .map(([param, rec]) => (
                  <TouchableOpacity
                    key={param}
                    style={homeStyles.parameterBox}
                    onPress={() =>
                      router.push({
                        pathname: 'parameter',
                        params: { parameter: param }
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <View style={homeStyles.parameterHeader}>
                      <Text style={homeStyles.parameterTitle}>{param}</Text>
                      <Text style={homeStyles.parameterArrow}>›</Text>
                    </View>
                    <View style={homeStyles.parameterValueContainer}>
                      <Text style={homeStyles.parameterValue}>
                        {rec.value}
                        <Text style={homeStyles.parameterUnit}> {rec.unit}</Text>
                      </Text>
                      <Text style={[
                        homeStyles.parameterStatus,
                        rec.status === 'Normal'
                          ? homeStyles.normalStatus
                          : homeStyles.abnormalStatus
                      ]}>
                        {rec.status}
                      </Text>
                    </View>
                    {rec.history.length > 0 && (
                      <View style={homeStyles.historyContainer}>
                        {rec.history.map((h, j) => (
                          <View key={j} style={homeStyles.historyItemContainer}>
                            <Text style={homeStyles.historyItem}>
                              • {h.value} {h.unit}, {formatTime(h.rawTs)}
                            </Text>
                            <View style={[
                              homeStyles.statusCircle,
                              h.status === 'Normal' ? homeStyles.normalCircle : homeStyles.abnormalCircle
                            ]} />
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

              {/* Warning Message Section */}
              {isToday && (() => {
                const abnormalParams = Object.entries(latestRecords)
                  .filter(([param, rec]) =>
                    rec.status === 'Abnormal' &&
                    rec.history.every(h => h.status === 'Abnormal')
                  )
                  .map(([param]) => param);

                if (abnormalParams.length > 0) {
                  const formattedParams = abnormalParams.map(param => (
                    <Text key={param} style={homeStyles.warningBoldText}>{param}</Text>
                  ));

                  return (
                    <View style={homeStyles.warningBox}>
                      <Text style={homeStyles.warningText}>
                        All your{' '}
                        {abnormalParams.length === 1 ? (
                          formattedParams
                        ) : (
                          <>
                            {formattedParams.slice(0, -1).map((param, i) => (
                              <React.Fragment key={i}>
                                {param}
                                {i < formattedParams.length - 2 ? ', ' : ' and '}
                              </React.Fragment>
                            ))}
                            {formattedParams[formattedParams.length - 1]}
                          </>
                        )}{' '}
                        measurements today are abnormal. Please consult with your doctor.
                      </Text>
                    </View>
                  );
                }
                return null;
              })()}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
      <NavigationBar />
    </View>
  );
}