//------------------------------------BPM-------------------------//
// BPM
function bpm(peaks, frek) {
    // Calculate period (sample difference/sampling rate), in seconds
    const period = new Array(peaks.length - 1);
    const insHr = new Array(peaks.length - 1);

    for (let i = 0; i < peaks.length - 1; i++) {
        period[i] = (peaks[i + 1] - peaks[i]) / frek;
        insHr[i] = 60 / period[i];
    }

    return [insHr, period];
}

//-----------------------------Delineate--------------------------//
// Segment
function segment(signal, peaks, period, frek, ratio = 0.35) {
    const dur = Math.round(mean(period) * frek);
    const start = Math.round(ratio * dur);

    // Create Epoch
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
            // Find flat region after a drop
            while (iAhead < x.length && x[iAhead] === x[i]) {
                iAhead += 1;
            }

            // Check if it's a local minimum (valley)
            if (iAhead < x.length && x[iAhead] > x[i]) {
                const midpoint = Math.floor((i + iAhead - 1) / 2);  // middle of the flat region
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

// Delineate
function delineate(signal, peaks, period, frek, ratio = 0.35) {
    // Find heartbeat
    const [heartbeat, start] = segment(signal, peaks, period, frek, ratio);

    // Find PQRST
    const qindeks = [];
    const sindeks = [];
    const tindeks = [];

    for (let i = 0; i < heartbeat.length; i++) {
        // Start offset
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
        const tmax = indexOfMax(tsegment) + tstart;
        tindeks.push(tmax);
    }

    return [qindeks, sindeks, tindeks];
}

// ECG Analysis
function analisis(clean, frek) {
    // R-Peak Detection:
    const Rpeaks = peakRdetect(clean, 0.1, 0.75, 1.5, 0.4, 0.3);

    // Instantaneous HR and period
    const [instHR, period] = bpm(Rpeaks, frek);

    // Segment + Delineate
    const [qwave, swave, twave] = delineate(clean, Rpeaks, period, frek, 0.35);

    // Calculate BPM
    const HR = mean(instHR);

    // Calculate heart rhythm (from SD1, HRV Poincare Plot)
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
}