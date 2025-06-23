import { useState, useEffect, useRef, useMemo } from 'react';
import useBLEECGNO from './useBLEECG';
import coeffData from './firCoefficients.json';
const koefFIRmatlab = coeffData.koefFIRmatlab;

function applyFIRFilter(signal, coeffs) {
    if (!signal || signal.length === 0) return [];

    const N = coeffs.length;
    const filtered = new Array(signal.length).fill(0);

    for (let i = 0; i < signal.length; i++) {
        let acc = 0;
        for (let j = 0; j < N; j++) {
            if (i - j >= 0) {
                acc += coeffs[j] * signal[i - j];
            }
        }
        filtered[i] = acc;
    }
    return filtered;
}

function forwardBackwardFIRFilter(signal, coeffs) {
    if (!signal || signal.length === 0) return [];

    // Forward pass
    const forward = applyFIRFilter(signal, coeffs);
    // Reverse signal
    const reversed = forward.slice().reverse();
    // Backward filter
    const backward = applyFIRFilter(reversed, coeffs);
    // Reverse again to restore original order
    return backward.reverse();
}

function gradient(array) {
    const grad = new Array(array.length).fill(0.0);

    for (let i = 0; i < array.length; i++) {
        if (i === 0 || i === array.length - 1) {
            continue;
        }
        grad[i] = Math.abs((array[i + 1] - array[i - 1]) / 2);
    }

    grad[0] = Math.abs(array[1] - array[0]);
    grad[array.length - 1] = Math.abs(array[array.length - 1] - array[array.length - 2]);

    return grad;
}

function mv_avg(signal, windowSize) {
    const halfWindow = Math.floor(windowSize / 2);
    const averaged = [];

    for (let i = 0; i < signal.length; i++) {
        let acc = 0.0;
        for (let j = i - halfWindow; j <= i + halfWindow; j++) {
            if (j >= 0 && j < signal.length) {
                acc += signal[j];
            } else {
                acc += 0.0;  // Zero padding outside the signal
            }
        }
        averaged.push(acc / windowSize);
    }

    return averaged;
}

function index_of_max(arr) {
    if (!arr || arr.length === 0) return -1;
    let max_index = 0;
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > arr[max_index]) {
            max_index = i;
        }
    }
    return max_index;
}

function peakRdetect(signal, smoothwindow = 0.1, avgwindow = 0.75,
    gradthreshweight = 1.5, minlenweight = 0.4, mindelay = 0.3) {

    if (!signal || signal.length === 0) return [];

    const SAMPLING_RATE = 320;
    let grad = gradient(signal);
    let smthgrd = mv_avg(grad, Math.round(smoothwindow * SAMPLING_RATE));
    let avggrd = mv_avg(smthgrd, Math.round(avgwindow * SAMPLING_RATE));
    let threshgrd = avggrd.map(val => val * gradthreshweight);
    let minDelay = Math.round(mindelay * SAMPLING_RATE);
    let start = [], end = [], duration = [];
    let count = 0, mulai = 0;

    for (let i = 0; i < avggrd.length; i++) {
        if (smthgrd[i] > threshgrd[i] && mulai === 1) {
            count += 1;
        } else if (smthgrd[i] > threshgrd[i] && mulai === 0) {
            start.push(i);
            count += 1;
            mulai = 1;
        } else if (!(smthgrd[i] > threshgrd[i]) && mulai === 1) {
            end.push(i - 1);
            duration.push(count);
            count = 0;
            mulai = 0;
        }
    }

    if (duration.length === 0) return [];

    const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    let mindur = mean(duration) * minlenweight;
    let peak = [0];

    for (let i = 0; i < duration.length; i++) {
        if (duration[i] < mindur) continue;
        let data = signal.slice(start[i], end[i] + 1);
        let max = index_of_max(data) + start[i];
        if (max - peak[peak.length - 1] > minDelay) {
            peak.push(max);
        }
    }

    peak.shift(); // Remove the initial placeholder 0
    return peak;
}

// Function to calculate 6-lead ECG from Lead I and Lead II
function calculateAllLeads(lead1, lead2) {
    if (!lead1 || !lead2 || lead1.length === 0 || lead2.length === 0) {
        return {
            leadI: [],
            leadII: [],
            leadIII: [],
            aVR: [],
            aVL: [],
            aVF: []
        };
    }

    // Ensure both leads have the same length
    const minLength = Math.min(lead1.length, lead2.length);
    const leadI = lead1.slice(0, minLength);
    const leadII = lead2.slice(0, minLength);

    // Calculate Lead III: Lead III = Lead II - Lead I
    const leadIII = leadII.map((val, idx) => val - leadI[idx]);

    // Calculate augmented leads
    // aVR = -(Lead I + Lead II) / 2
    const aVR = leadI.map((val, idx) => -((val + leadII[idx]) / 2));

    // aVL = Lead I - Lead III / 2
    const aVL = leadI.map((val, idx) => val - (leadIII[idx] / 2));

    // aVF = Lead II + Lead III / 2
    const aVF = leadII.map((val, idx) => val + (leadIII[idx] / 2));

    return {
        leadI,
        leadII,
        leadIII,
        aVR,
        aVL,
        aVF
    };
}

// Import calculation functions
function mean(arr) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
    }
    return sum / arr.length;
}

function variance(arr) {
    const n = arr.length;
    if (n < 2) {
        return 0.0;  // Not enough data
    }
    const meanVal = arr.reduce((sum, x) => sum + x, 0) / n;
    const varVal = arr.reduce((sum, x) => sum + Math.pow(x - meanVal, 2), 0) / (n - 1);
    return varVal;
}

// BPM calculation
function bpm(peaks, frek) {
    const period = new Array(peaks.length - 1);
    const insHr = new Array(peaks.length - 1);

    for (let i = 0; i < peaks.length - 1; i++) {
        period[i] = (peaks[i + 1] - peaks[i]) / frek;
        insHr[i] = 60 / period[i];
    }

    return [insHr, period];
}

// Segment function
function segment(signal, peaks, period, frek, ratio = 0.35) {
    const dur = Math.round(mean(period) * frek);
    const start = Math.round(ratio * dur);

    const heartbeat = [];
    for (let i = 0; i < peaks.length; i++) {
        const beat = [];
        const mulai = peaks[i] - start;
        for (let j = 0; j < dur; j++) {
            beat.push(signal[mulai + j]);
        }
        heartbeat.push(beat);
    }

    return [heartbeat, start];
}

// Local Minima
function localMinima1d(x, minHeight = null) {
    const midpoints = [];
    let i = 1;
    const iMax = x.length - 1;

    while (i < iMax) {
        if (x[i - 1] > x[i]) {
            let iAhead = i + 1;
            while (iAhead < x.length && x[iAhead] === x[i]) {
                iAhead += 1;
            }

            if (iAhead < x.length && x[iAhead] > x[i]) {
                const midpoint = Math.floor((i + iAhead - 1) / 2);
                if (minHeight === null || x[i] <= minHeight) {
                    midpoints.push(midpoint);
                }
                i = iAhead;
            } else {
                i += 1;
            }
        } else {
            i += 1;
        }
    }

    return midpoints;
}

// Delineate function
function delineate(signal, peaks, period, frek, ratio = 0.35) {
    const [heartbeat, start] = segment(signal, peaks, period, frek, ratio);

    const qindeks = [];
    const sindeks = [];
    const tindeks = [];

    for (let i = 0; i < heartbeat.length; i++) {
        const awal = peaks[i] - start;

        // Q wave
        const qsegment = heartbeat[i].slice(0, start);
        const minhq = 0.05 * (Math.max(...qsegment) - Math.min(...qsegment));
        const midq = localMinima1d(qsegment, minhq);
        if (midq.length !== 0) {
            qindeks.push(midq[midq.length - 1] + awal);
        } else {
            qindeks.push(-1);
        }

        // S wave
        const ssegment = heartbeat[i].slice(start);
        const mihs = 0.05 * (Math.max(...ssegment) - Math.min(...ssegment));
        const mids = localMinima1d(ssegment, mihs);
        let tsegment;
        let tstart;
        if (mids.length !== 0) {
            sindeks.push(mids[0] + awal + start);
            tsegment = heartbeat[i].slice(mids[0] + start);
            tstart = awal + start + mids[0];
        } else {
            sindeks.push(-1);
            tsegment = heartbeat[i].slice(start);
            tstart = awal + start;
        }

        // T wave
        const tmax = index_of_max(tsegment) + tstart;
        tindeks.push(tmax);
    }

    return [qindeks, sindeks, tindeks];
}

// ECG Analysis function
function analisis(clean, frek = 320) {
    try {
        // R-Peak Detection
        const Rpeaks = peakRdetect(clean, 0.1, 0.75, 1.5, 0.4, 0.3);

        if (Rpeaks.length < 2) {
            return [0, 0, 0, 0]; // Not enough peaks for analysis
        }

        // Instantaneous HR and period
        const [instHR, period] = bpm(Rpeaks, frek);

        // Segment + Delineate
        const [qwave, swave, twave] = delineate(clean, Rpeaks, period, frek, 0.35);

        // Calculate BPM
        const HR = mean(instHR);

        // Calculate heart rhythm variance
        const VarHR = variance(period) * 1000;

        // Calculate QTc and QRS period
        const qtc = [];
        const qrs = [];
        for (let i = 0; i < qwave.length; i++) {
            if (qwave[i] !== -1) {
                const qt = (twave[i] - qwave[i]) * 1000 / frek;
                qtc.push(qt);
                if (swave[i] !== -1) {
                    const qs = (swave[i] - qwave[i]) * 1000 / frek;
                    qrs.push(qs);
                }
            }
        }

        // Calculate average QT and QRS duration
        const meanqtc = mean(qtc);
        const meanqrs = mean(qrs);

        return [HR, VarHR, meanqtc, meanqrs];
    } catch (error) {
        console.error('Analysis failed:', error);
        return [0, 0, 0, 0];
    }
}

export default function useECGAnalysis(deviceId, shouldStop = false) {
    // Get raw samples from BLE
    const bleData = useBLEECGNO(deviceId, shouldStop);
    const rawLead1 = bleData?.lead1 || [];
    const rawLead2 = bleData?.lead2 || [];

    // State to store final processed data and calculations
    const [processedData, setProcessedData] = useState({
        filteredLead1: [],
        filteredLead2: [],
        filteredLead3: [],
        filteredAVR: [],
        filteredAVL: [],
        filteredAVF: [],
        peaksLead1: [],
        peaksLead2: [],
        peaksLead3: [],
        peaksAVR: [],
        peaksAVL: [],
        peaksAVF: [],
        isProcessed: false,
        // Add calculation results
        heartbeatDuration: 0,
        heartvarianceDuration: 0,
        qtcDuration: 0,
        qrsDuration: 0
    });

    const processingTimeoutRef = useRef(null);

    // Memoized processing function
    const processECGData = useMemo(() => {
        return (lead1Data, lead2Data) => {
            if (!lead1Data?.length || !lead2Data?.length) {
                return {
                    filteredLead1: [],
                    filteredLead2: [],
                    filteredLead3: [],
                    filteredAVR: [],
                    filteredAVL: [],
                    filteredAVF: [],
                    peaksLead1: [],
                    peaksLead2: [],
                    peaksLead3: [],
                    peaksAVR: [],
                    peaksAVL: [],
                    peaksAVF: [],
                    isProcessed: false,
                    heartbeatDuration: 0,
                    heartvarianceDuration: 0,
                    qtcDuration: 0,
                    qrsDuration: 0
                };
            }

            try {
                console.log(`🔄 Processing complete ECG data: Lead1=${lead1Data.length}, Lead2=${lead2Data.length} samples`);

                // Apply FIR filter to raw leads
                const filteredRawLead1 = forwardBackwardFIRFilter(lead1Data, koefFIRmatlab);
                const filteredRawLead2 = forwardBackwardFIRFilter(lead2Data, koefFIRmatlab);

                // Calculate all 6 leads from the filtered raw data
                const allLeads = calculateAllLeads(filteredRawLead1, filteredRawLead2);

                // Apply peak detection to all leads
                const peakDetection = (leadData, leadName) => {
                    try {
                        return peakRdetect(leadData);
                    } catch (e) {
                        console.warn(`Peak detection failed for ${leadName}:`, e);
                        return [];
                    }
                };

                // Perform ECG analysis on filtered Lead I
                console.log('🔬 Performing ECG analysis on filtered Lead I...');
                const [heartbeatDuration, heartvarianceDuration, qtcDuration, qrsDuration] = analisis(allLeads.leadI, 320);

                const result = {
                    filteredLead1: allLeads.leadI,
                    filteredLead2: allLeads.leadII,
                    filteredLead3: allLeads.leadIII,
                    filteredAVR: allLeads.aVR,
                    filteredAVL: allLeads.aVL,
                    filteredAVF: allLeads.aVF,
                    peaksLead1: peakDetection(allLeads.leadI, 'Lead I'),
                    peaksLead2: peakDetection(allLeads.leadII, 'Lead II'),
                    peaksLead3: peakDetection(allLeads.leadIII, 'Lead III'),
                    peaksAVR: peakDetection(allLeads.aVR, 'aVR'),
                    peaksAVL: peakDetection(allLeads.aVL, 'aVL'),
                    peaksAVF: peakDetection(allLeads.aVF, 'aVF'),
                    isProcessed: true,
                    // Add calculation results
                    heartbeatDuration: Math.round(heartbeatDuration * 100) / 100,
                    heartvarianceDuration: Math.round(heartvarianceDuration * 100) / 100,
                    qtcDuration: Math.round(qtcDuration * 100) / 100,
                    qrsDuration: Math.round(qrsDuration * 100) / 100
                };

                console.log(`✅ Processing complete: ${result.filteredLead1.length} filtered samples`);
                console.log(`📊 Analysis results: HR=${result.heartbeatDuration}, HRV=${result.heartvarianceDuration}, QTc=${result.qtcDuration}, QRS=${result.qrsDuration}`);

                return result;

            } catch (error) {
                console.error('ECG processing failed:', error);
                return {
                    filteredLead1: lead1Data,
                    filteredLead2: lead2Data,
                    filteredLead3: [],
                    filteredAVR: [],
                    filteredAVL: [],
                    filteredAVF: [],
                    peaksLead1: [],
                    peaksLead2: [],
                    peaksLead3: [],
                    peaksAVR: [],
                    peaksAVL: [],
                    peaksAVF: [],
                    isProcessed: false,
                    heartbeatDuration: 0,
                    heartvarianceDuration: 0,
                    qtcDuration: 0,
                    qrsDuration: 0
                };
            }
        };
    }, []);

    // Function to manually trigger processing
    const processCompleteData = () => {
        console.log(`🚀 processCompleteData called with: Lead1=${rawLead1.length}, Lead2=${rawLead2.length}`);

        if (rawLead1.length > 0 && rawLead2.length > 0) {
            console.log(`🚀 Starting complete data processing...`);
            const newProcessedData = processECGData(rawLead1, rawLead2);
            setProcessedData(newProcessedData);
            console.log(`✅ Processing result:`, {
                filteredLead1Length: newProcessedData.filteredLead1.length,
                isProcessed: newProcessedData.isProcessed,
                heartbeatDuration: newProcessedData.heartbeatDuration
            });
            return newProcessedData;
        } else {
            console.log(`❌ No raw data available for processing: Lead1=${rawLead1.length}, Lead2=${rawLead2.length}`);
            return null;
        }
    };

    console.log(`🔍 useECGAnalysis Debug:`);
    console.log(`  shouldStop: ${shouldStop}`);
    console.log(`  rawLead1.length: ${rawLead1.length}`);
    console.log(`  rawLead2.length: ${rawLead2.length}`);
    console.log(`  isProcessed: ${processedData.isProcessed}`);

    return {
        // Raw data
        rawLead1: rawLead1 || [],
        rawLead2: rawLead2 || [],

        // Processed data
        filteredLead1: processedData.filteredLead1 || [],
        filteredLead2: processedData.filteredLead2 || [],
        filteredLead3: processedData.filteredLead3 || [],
        filteredAVR: processedData.filteredAVR || [],
        filteredAVL: processedData.filteredAVL || [],
        filteredAVF: processedData.filteredAVF || [],

        // Peak detection results
        peaksLead1: processedData.peaksLead1 || [],
        peaksLead2: processedData.peaksLead2 || [],
        peaksLead3: processedData.peaksLead3 || [],
        peaksAVR: processedData.peaksAVR || [],
        peaksAVL: processedData.peaksAVL || [],
        peaksAVF: processedData.peaksAVF || [],

        // Calculation results
        heartbeatDuration: processedData.heartbeatDuration || 0,
        heartvarianceDuration: processedData.heartvarianceDuration || 0,
        qtcDuration: processedData.qtcDuration || 0,
        qrsDuration: processedData.qrsDuration || 0,

        // Status
        isProcessing: false,
        isProcessed: processedData.isProcessed,

        // Function to trigger processing
        processCompleteData,

        // Debug info
        sampleCount: Math.min(rawLead1.length, rawLead2.length),
        isStopped: bleData?.isStopped || false
    };
}