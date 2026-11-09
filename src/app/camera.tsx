import { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions, type CameraView as CameraViewType } from "expo-camera";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { importCameraCapture } from "../features/images/pickImage";
import { colors } from "../theme";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraViewType>(null);
  const [busy, setBusy] = useState(false);

  if (!permission) return <View style={styles.empty}><Text style={styles.message}>Preparing camera…</Text></View>;
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.empty}>
        <Text style={styles.eyebrow}>CAMERA ACCESS</Text>
        <Text style={styles.title}>Allow only when you choose to take a photo.</Text>
        <Text style={styles.message}>ARTISTRY AI asks for camera permission when you open this camera screen. Photo and document picking do not require camera access.</Text>
        <Pressable onPress={() => void requestPermission()} style={styles.permissionButton}><Text style={styles.captureText}>Allow camera</Text></Pressable>
        <Pressable onPress={() => router.back()} style={styles.cancel}><Text style={styles.cancelText}>Go back</Text></Pressable>
      </SafeAreaView>
    );
  }

  const capture = async () => {
    if (!camera.current || busy) return;
    setBusy(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.95, skipProcessing: false });
      if (photo?.uri) {
        await importCameraCapture(photo.uri);
        router.replace("/reference");
      }
    } catch (error) {
      Alert.alert("Photo could not be captured", error instanceof Error ? error.message : "Try again.");
    } finally { setBusy(false); }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" />
      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
          <Text style={styles.cameraTitle}>REFERENCE CAMERA</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.guide} />
        <View style={styles.bottomBar}>
          <Text style={styles.hint}>The original photo stays in your gallery.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Take photo" onPress={() => void capture()} disabled={busy} style={[styles.shutter, busy && { opacity: 0.5 }]}>
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101411" },
  empty: { flex: 1, padding: 28, backgroundColor: colors.canvas, justifyContent: "center" },
  eyebrow: { color: colors.moss, fontSize: 10, fontWeight: "800", letterSpacing: 1.7, marginBottom: 12 },
  title: { color: colors.ink, fontFamily: "Georgia", fontSize: 26, lineHeight: 33, marginBottom: 12 },
  message: { color: colors.muted, lineHeight: 21, fontSize: 14 },
  permissionButton: { height: 50, borderRadius: 16, backgroundColor: colors.dark, alignItems: "center", justifyContent: "center", marginTop: 22 },
  captureText: { color: colors.white, fontWeight: "700" },
  cancel: { alignItems: "center", padding: 14, marginTop: 4 },
  cancelText: { color: colors.muted, fontWeight: "700" },
  overlay: { ...StyleSheet.absoluteFill, justifyContent: "space-between", alignItems: "center" },
  topBar: { width: "100%", height: 65, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20 },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(20,25,22,.55)", alignItems: "center", justifyContent: "center" },
  closeText: { color: colors.white, fontSize: 27, lineHeight: 31 },
  cameraTitle: { color: colors.white, letterSpacing: 1.6, fontSize: 10, fontWeight: "800" },
  guide: { width: "76%", height: "52%", borderWidth: 1, borderColor: "rgba(255,255,255,.65)", borderRadius: 21 },
  bottomBar: { width: "100%", alignItems: "center", paddingBottom: 34, gap: 13 },
  hint: { color: colors.white, fontSize: 12, backgroundColor: "rgba(20,25,22,.46)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  shutter: { width: 75, height: 75, borderRadius: 38, borderWidth: 4, borderColor: colors.white, alignItems: "center", justifyContent: "center" },
  shutterInner: { width: 57, height: 57, borderRadius: 30, backgroundColor: colors.white },
});
