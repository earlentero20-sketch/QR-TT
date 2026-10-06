import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { registerAttendance } from '@/lib/attendance';
import { useRole } from '@/lib/profiles';

export default function ScanScreen() {
  const { user } = useAuth();
  const { role } = useRole();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastData, setLastData] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  // The camera can report the same QR several times before React re-renders,
  // which used to submit it twice ("recorded" instantly replaced by "already registered").
  const scanLock = useRef(false);

  // Tabs keep every screen mounted. A CameraView that stays mounted in a hidden
  // tab can come back with a frozen/black preview and a dead barcode analyzer,
  // so the camera is only mounted while this tab is actually on screen.
  const isFocused = useIsFocused();

  // Start every visit with a fresh scanner. Without this, a previous result
  // ("QR Code detected!") stays on screen and the camera keeps ignoring QR codes
  // until "Scan Again" is pressed.
  useEffect(() => {
    if (isFocused) {
      scanLock.current = false;
      setScanned(false);
      setLastData(null);
      setMessage(null);
      setSuccess(false);
      setCameraError(null);
    }
  }, [isFocused]);

  if (role === 'teacher') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Students Only</Text>
        <Text style={styles.subtitle}>
          This scan screen is for student attendance. Teacher accounts use the Teacher tab to create QR codes.
        </Text>
      </View>
    );
  }

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera Permission Needed</Text>
        <Text style={styles.subtitle}>
          {permission.canAskAgain
            ? 'We need access to your camera to scan QR codes.'
            : 'Camera access is turned off for this app. Enable it in your phone Settings > Apps > QR Attendance > Permissions.'}
        </Text>
        {permission.canAskAgain && (
          <AppButton
            theme="primary"
            title="Grant Permission"
            icon="camera"
            onPress={requestPermission}
          />
        )}
      </View>
    );
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanLock.current) return;
    scanLock.current = true;
    setScanned(true);
    setLastData(data);
    setMessage(null);
    setSuccess(false);
    const studentId = user?.id ?? 'unknown';
    registerAttendance(data, studentId)
      .then((result) => {
        setMessage(result.message);
        setSuccess(result.success);
      })
      .catch((error: unknown) => {
        console.warn('Unable to record attendance:', error);
        setMessage('Unable to record attendance. Check that the database is configured.');
        setSuccess(false);
      });
  };

  const handleScanAgain = () => {
    scanLock.current = false;
    setScanned(false);
    setLastData(null);
    setMessage(null);
    setSuccess(false);
  };

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={BARCODE_SETTINGS}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          onMountError={(event) => {
            console.warn('Camera failed to start:', event.message);
            setCameraError(event.message);
          }}
        />
      )}

      <View style={styles.overlay}>
        <Text style={styles.overlayText}>
          {scanned ? 'QR Code detected!' : 'Point your camera at a QR code'}
        </Text>

        {cameraError && (
          <Text style={[styles.scanResult, styles.error]}>
            Camera error: {cameraError}
          </Text>
        )}

        {scanned && message && (
          <Text
            style={[styles.scanResult, success ? styles.success : styles.error]}
          >
            {message}
          </Text>
        )}

        {scanned && lastData && (
          <Text style={styles.scanData}>{lastData}</Text>
        )}

        {scanned && (
          <AppButton
            theme="primary"
            title="Scan Again"
            icon="refresh"
            onPress={handleScanAgain}
          />
        )}
      </View>
    </View>
  );
}

// Module-level constant so the camera isn't handed a new settings object on
// every render (that can make Android re-bind the camera and drop frames).
const BARCODE_SETTINGS = { barcodeTypes: ['qr' as const] };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  overlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 60,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  overlayText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  scanResult: { fontSize: 14, textAlign: 'center', marginBottom: 8, fontWeight: '600' },
  success: { color: '#2E7D32' },
  error: { color: '#C62828' },
  scanData: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 12 },
});