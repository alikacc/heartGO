# HeartGo: Offline 6-Lead ECG Monitoring App

**HeartGo** is a React Native application that connects to a Bluetooth Low Energy (BLE) ECG device to visualize and export clinically accurate 6-lead ECG signals in real time — entirely offline.

---

## 📋 Features

- ✅ **6-Lead ECG Rendering** (Leads I, II, III, aVR, aVL, aVF)
- ✅ **Live BLE Streaming** from ECG device
- ✅ **Clinical Grid Format**: 25 mm/s, 10 mm/mV ECG paper simulation
- ✅ **Multi-Lead PDF Export** with high-resolution vector rendering
- ✅ **Offline-first**: no cloud, no internet, suitable for remote clinics or field use
- ✅ **Lead Labels**, Major/Minor Grid Lines, Real-Time Visualization
- ✅ **Designed for mobile and tablet (A4 portrait PDF support)**

---

## 📱 Technology Stack

| Layer        | Tech                                   |
|-------------|----------------------------------------|
| Frontend    | React Native + Expo                    |
| BLE         | [react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx) |
| ECG Display | Custom SVG rendering (based on sampling rate, scale) |
| Export      | `expo-print` + `expo-sharing` for PDF  |
| Storage     | (Optional) SQLite or AsyncStorage for local session logs |

---

## 🩺 ECG Visualization Details

- **Sampling Rate**: 320 Hz
- **Grid Scale**:
  - Horizontal: 25 mm/s (1 second = 25 mm)
  - Vertical: 10 mm/mV (1 mV = 10 mm)
- **Layout**:
  - 6 stacked leads per page: I, II, III, aVR, aVL, aVF
  - Each lead occupies equal vertical height
  - Full A4 portrait layout
- **PDF Generation**:
  - High-fidelity vector output
  - Includes grid, lead labels, and voltage scaling
  - Grid major lines every 5 mm (thicker stroke)

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18.x
- Expo CLI (`npm install -g expo-cli`)
- Physical device (BLE needed)

### Installation

```bash
git clone https://github.com/yourusername/heartgo.git
cd heartgo
npm install
expo start
