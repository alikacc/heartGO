import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { useLocalSearchParams } from 'expo-router'
import Header from './component/header'
import { useUser } from './UserContext'
import { parse, format, isValid } from 'date-fns'

const CHART_CONFIG = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(52,121,249,${opacity})`,
  propsForDots: { r: '4', strokeWidth: '2', stroke: '#3479F9' },
  propsForBackgroundLines: { stroke: '#EEE' },
  propsForLabels: { fontSize: 10 },
}

const PARAMETER_CONFIG = {
  Heartbeat: { column: 'heartbeat', unit: ' BPM', description: 'measured per your ECG recording' },
  'QT Interval': { column: 'qt', unit: ' ms', description: 'measured per your ECG recording' },
  'QRS Duration': { column: 'qrs', unit: ' ms', description: 'measured per your ECG recording' },
  'Heart Rate': { column: 'heartrate', unit: ' BPM', description: 'measured per your ECG recording' },
}

export default function ParameterScreen() {
  const { parameter } = useLocalSearchParams()
  const { db, getCurrentUserTable, currentUser } = useUser()
  const paramConfig = PARAMETER_CONFIG[parameter] || PARAMETER_CONFIG.Heartbeat

  const [records, setRecords] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(0)

  // Memoized calculations
  const { chartData, chartConfig, selectedData, yAxisBounds } = useMemo(() => {
    if (!records.length) {
      return {
        chartData: { labels: [], datasets: [{ data: [0] }] },
        chartConfig: CHART_CONFIG,
        selectedData: { value: 0, date: null },
        yAxisBounds: { yMin: 0, yMax: 1 }
      }
    }

    const labels = records.map(r => format(r.date, 'HH:mm'))
    const dataValues = records.map(r => r.value)

    // Calculate safe y-axis bounds
    const minVal = Math.min(...dataValues)
    const maxVal = Math.max(...dataValues)
    const yMin = minVal === maxVal ? minVal - 1 : minVal
    const yMax = minVal === maxVal ? maxVal + 1 : maxVal

    const selectedRecord = records[selectedIdx] || {}

    return {
      chartData: {
        labels,
        datasets: [{
          data: dataValues,
          color: (opacity = 1) => `rgba(52,121,249,${opacity})`,
          strokeWidth: 2,
        }],
      },
      chartConfig: CHART_CONFIG,
      selectedData: {
        value: dataValues[selectedIdx] ?? 0,
        date: selectedRecord.date,
      },
      yAxisBounds: { yMin, yMax }
    }
  }, [records, selectedIdx])

  // Memoized chart dimensions
  const chartDimensions = useMemo(() => {
    const screenWidth = Dimensions.get('window').width
    const padding = 16
    return {
      width: screenWidth - padding * 4,
      height: 220
    }
  }, [])

  // Load data effect with UserContext
  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      if (!db || !currentUser) {
        console.log('⚠️ Database or current user not ready yet for parameter:', parameter);
        return;
      }

      try {
        const tableName = getCurrentUserTable()
        console.log(`📊 Loading parameter data from table: ${tableName} for user: ${currentUser.name}`)

        const rows = await db.getAllAsync(`
          SELECT timestamp, ${paramConfig.column} AS value, metadata
          FROM ${tableName}
          ORDER BY timestamp DESC
          LIMIT 10;
        `)

        console.log(`📈 Loaded ${rows.length} parameter records from ${tableName}`)

        const parsed = rows
          .map(r => ({
            date: parse(r.timestamp, 'dd/MM/yyyy HH:mm:ss', new Date()),
            value: r.value,
            metadata: r.metadata
          }))
          .filter(r => isValid(r.date))
          .sort((a, b) => a.date - b.date)

        if (!cancelled) {
          setRecords(parsed)
          setSelectedIdx(Math.max(0, parsed.length - 1))
        }
      } catch (error) {
        console.error('❌ Error loading parameter data:', error)
        if (!cancelled) {
          setRecords([])
          setSelectedIdx(0)
        }
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [paramConfig.column, db, currentUser, getCurrentUserTable])

  // Event handlers
  const handlePointClick = ({ index }) => setSelectedIdx(index)

  const getDotProps = (dataPoint, index) => ({
    r: index === selectedIdx ? '6' : '4',
    strokeWidth: '2',
    stroke: '#3479F9',
    fill: index === selectedIdx ? '#3479F9' : '#fff'
  })

  const renderSelectedDot = ({ x, y, index }) => (
    index === selectedIdx ? (
      <View key={index} style={[styles.selectedDot, { top: y - 6, left: x - 6 }]} />
    ) : null
  )

  // Format display values
  const formattedDate = selectedData.date ? format(selectedData.date, 'd MMMM yyyy') : '--'
  const formattedTime = selectedData.date ? format(selectedData.date, 'HH:mm') : '--:--'

  // Helper function to parse metadata
  const parseMetadata = (metadataStr) => {
    if (!metadataStr) return { tags: [], notes: '' }
    try {
      const parsed = JSON.parse(metadataStr)
      return {
        tags: parsed.t || [],
        notes: parsed.n || ''
      }
    } catch {
      return { tags: [], notes: '' }
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.panelContainer}>
            {records.length > 0 ? (
              <>
                <View style={styles.chartContainer}>
                  <LineChart
                    data={chartData}
                    width={chartDimensions.width}
                    height={chartDimensions.height}
                    chartConfig={chartConfig}
                    withDots
                    withShadow
                    fillShadowGradient="#3479F9"
                    fillShadowGradientOpacity={0.1}
                    withVerticalLines
                    withHorizontalLines
                    bezier
                    fromZero={false}
                    yAxisMin={yAxisBounds.yMin}
                    yAxisMax={yAxisBounds.yMax}
                    onDataPointClick={handlePointClick}
                    xLabelsOffset={-10}
                    getDotProps={getDotProps}
                    verticalLabelRotation={45}
                    style={styles.chart}
                    segments={4}
                    renderDotContent={renderSelectedDot}
                  />
                </View>

                <View style={styles.selectionRow}>
                  <TouchableOpacity style={[styles.selectionButton, styles.selectionButtonActive]}>
                    <Text style={[styles.selectionText, styles.activeSelectionText]}>
                      {formattedDate}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.selectionButton}>
                    <Text style={styles.selectionText}>
                      {formattedTime}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.resultContainer}>
                  <Text style={styles.resultLabel}>
                    Your {parameter.toLowerCase()}
                  </Text>
                  <Text style={styles.resultValue}>
                    {selectedData.value}
                    <Text style={styles.resultUnit}>{paramConfig.unit}</Text>
                  </Text>
                  <Text style={styles.resultStatus}>is normal</Text>
                </View>

                {/* Tags and Notes Box - Always visible */}
                <View style={styles.metadataContainer}>
                  <View style={styles.tagsContainer}>
                    <Text style={styles.metadataLabel}>Tags:</Text>
                    <Text style={styles.tagsText}>
                      {(() => {
                        if (!records[selectedIdx]) return 'Empty'
                        const metadata = parseMetadata(records[selectedIdx].metadata)
                        return metadata.tags.length > 0 ? metadata.tags.join(', ') : 'Empty'
                      })()}
                    </Text>
                  </View>
                  <View style={styles.notesContainer}>
                    <Text style={styles.metadataLabel}>Notes:</Text>
                    <Text style={styles.notesText}>
                      {(() => {
                        if (!records[selectedIdx]) return 'Empty'
                        const metadata = parseMetadata(records[selectedIdx].metadata)
                        return metadata.notes || 'Empty'
                      })()}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.noDataText}>No data to display</Text>
            )}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {parameter} is {paramConfig.description}. Monitoring can help track your health over time.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  panelContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2EB5FA',
    borderRadius: 16,
    margin: 16,
    padding: 16,
  },
  chartContainer: {
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
    paddingRight: 64,
  },
  noDataText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
    fontSize: 16,
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  selectionButton: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2EB5FA',
  },
  selectionButtonActive: {
    backgroundColor: '#2EB5FA',
  },
  selectionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2EB5FA',
  },
  activeSelectionText: {
    color: '#fff',
  },
  selectedDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3479F9',
  },
  resultContainer: {
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  resultUnit: {
    fontSize: 24,
    color: '#666',
  },
  resultStatus: {
    fontSize: 16,
    color: '#333',
  },
  infoBox: {
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
  },
  metadataContainer: {
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8EEFF',
    minHeight: 80,
  },
  tagsContainer: {
    marginBottom: 12,
  },
  notesContainer: {
    // No margin needed
  },
  metadataLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  tagsText: {
    fontSize: 14,
    color: '#3479F9',
    fontWeight: '500',
    minHeight: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
    minHeight: 16,
  },
})