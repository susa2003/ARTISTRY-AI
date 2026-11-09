import { useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppHeader, Button, Eyebrow, InfoCard, Screen, SectionHeading } from "../components/AppUI";
import { chooseImageFromDocuments, choosePhotoFromSystemPicker } from "../features/images/pickImage";
import { useAppStore } from "../state/appStore";
import { editWorkingCopy, restoreOriginal } from "../storage/imageFiles";
import { colors } from "../theme";

export default function ReferenceScreen() {
  const reference = useAppStore((state) => state.reference);
  const setReference = useAppStore((state) => state.setReference);
  const [busy, setBusy] = useState(false);
  if (!reference) {
    return <Screen><AppHeader title="Reference image" onBack={() => router.back()} /><InfoCard><Text style={styles.title}>No local image selected</Text><Text style={styles.copy}>Pick a photo, capture one, or browse your files. This is optional for direct drawing.</Text><Button title="Choose image" onPress={() => router.push("/")} /></InfoCard></Screen>;
  }

  const applyEdit = async (edit: Parameters<typeof editWorkingCopy>[1]) => {
    setBusy(true);
    try { await setReference(await editWorkingCopy(reference, edit)); }
    catch (error) { Alert.alert("Could not update working copy", error instanceof Error ? error.message : "Try another image."); }
    finally { setBusy(false); }
  };
  const resetWorkingCopy = async () => {
    setBusy(true);
    try { await setReference(await restoreOriginal(reference)); }
    catch { Alert.alert("Could not restore", "The selected image copy could not be restored."); }
    finally { setBusy(false); }
  };
  const chooseAnother = async (kind: "photo" | "file") => {
    setBusy(true);
    try {
      const next = kind === "photo" ? await choosePhotoFromSystemPicker() : await chooseImageFromDocuments();
      if (next) await setReference(next);
    } catch (error) { Alert.alert("Image could not be opened", error instanceof Error ? error.message : "Choose a supported image."); }
    finally { setBusy(false); }
  };

  return (
    <Screen>
      <AppHeader title="Reference image" onBack={() => router.back()} />
      <Eyebrow>ON THIS DEVICE · ORIGINAL UNCHANGED</Eyebrow>
      <Text style={styles.title}>Prepare a working copy.</Text>
      <Text style={styles.copy}>Edits create a new app-owned copy. The image in your photo library or files stays unchanged.</Text>
      <InfoCard style={styles.previewCard}>
        <Image source={{ uri: reference.uri }} resizeMode="contain" style={styles.preview} />
        <View style={styles.previewMeta}>
          <Text numberOfLines={1} style={styles.fileName}>{reference.name}</Text>
          <Text style={styles.dimensions}>{reference.width} × {reference.height} px · cached locally</Text>
          <Text style={styles.safe}>✓ Original image unchanged</Text>
        </View>
      </InfoCard>
      <SectionHeading title="Adjust this copy" detail="Stored locally" />
      <View style={styles.actionGrid}>
        <Button title="Rotate left" icon="↶" tone="line" onPress={() => void applyEdit({ kind: "rotate", degrees: -90 })} disabled={busy} style={styles.action} />
        <Button title="Rotate right" icon="↷" tone="line" onPress={() => void applyEdit({ kind: "rotate", degrees: 90 })} disabled={busy} style={styles.action} />
        <Button title="Center crop" icon="⌗" tone="line" onPress={() => void applyEdit({ kind: "crop", leftPercent: 10, topPercent: 10, widthPercent: 80, heightPercent: 80 })} disabled={busy} style={styles.action} />
        <Button title="Resize to 1200 px" icon="↗" tone="line" onPress={() => {
          const scale = Math.min(1, 1200 / Math.max(reference.width, reference.height));
          void applyEdit({ kind: "resize", width: Math.round(reference.width * scale), height: Math.round(reference.height * scale) });
        }} disabled={busy} style={styles.action} />
      </View>
      {reference.isEdited ? <Button title="Restore working copy from original" tone="soft" onPress={() => void resetWorkingCopy()} disabled={busy} style={styles.fullButton} /> : null}
      <View style={styles.actionGrid}>
        <Button title="Use another photo" onPress={() => void chooseAnother("photo")} disabled={busy} style={styles.action} />
        <Button title="Browse files" tone="line" onPress={() => void chooseAnother("file")} disabled={busy} style={styles.action} />
      </View>
      <Button title="Explore image tools" icon="→" onPress={() => router.push("/tools/loomis")} style={styles.fullButton} />
      <Button title="Draw on a blank canvas" tone="soft" onPress={async () => {
        const id = await useAppStore.getState().createProject(null);
        router.push(`/studio/${id}`);
      }} style={styles.fullButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, lineHeight: 34, color: colors.ink, fontFamily: "Georgia", marginBottom: 8 },
  copy: { color: colors.muted, lineHeight: 20, fontSize: 13, marginBottom: 16 },
  previewCard: { padding: 0, overflow: "hidden" },
  preview: { width: "100%", height: 340, backgroundColor: "#F0EFE8" },
  previewMeta: { paddingHorizontal: 17, paddingVertical: 13 },
  fileName: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  dimensions: { color: colors.muted, fontSize: 11, marginTop: 3 },
  safe: { color: colors.moss, fontSize: 11, marginTop: 8, fontWeight: "700" },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  action: { flexGrow: 1, minWidth: "46%" },
  fullButton: { marginTop: 8, width: "100%" },
});
