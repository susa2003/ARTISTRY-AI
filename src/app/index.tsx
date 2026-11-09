import { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { AppHeader, Button, Eyebrow, InfoCard, Screen, SectionHeading } from "../components/AppUI";
import { FEATURES } from "../domain/features";
import { chooseImageFromDocuments, choosePhotoFromSystemPicker } from "../features/images/pickImage";
import { VoiceAssistantModal } from "../features/voice/VoiceAssistantModal";
import { useTranslation } from "../i18n";
import { useAppStore } from "../state/appStore";
import { useAuthStore } from "../state/authStore";
import { colors } from "../theme";
import type { ToolId } from "../domain/types";

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const columns = width > 760 ? 4 : 2;
  const { t, language, setLanguage } = useTranslation();
  const reference = useAppStore((state) => state.reference);
  const createProject = useAppStore((state) => state.createProject);
  const experienceMode = useAppStore((state) => state.experienceMode);
  const setExperienceMode = useAppStore((state) => state.setExperienceMode);
  const user = useAuthStore((state) => state.user);
  const [busy, setBusy] = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(false);

  const startDrawing = async (withReference = false) => {
    try {
      const id = await createProject(withReference ? reference?.uri ?? null : null);
      router.push(`/studio/${id}`);
    } catch {
      Alert.alert("Could not start drawing", "The local project store could not be opened.");
    }
  };

  const choosePhoto = async (source: "gallery" | "documents") => {
    setBusy(true);
    try {
      const result = source === "gallery" ? await choosePhotoFromSystemPicker() : await chooseImageFromDocuments();
      if (result) router.push("/reference");
    } catch (error) {
      Alert.alert("Image could not be opened", error instanceof Error ? error.message : "Choose a JPG, PNG or WEBP image.");
    } finally { setBusy(false); }
  };

  const openTool = (id: ToolId) => router.push(`/tools/${id}`);

  return (
    <Screen>
      <AppHeader
        title={t.app.title}
        right={
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <Pressable onPress={() => setVoiceVisible(true)} style={styles.voiceButton}>
              <Text style={styles.voiceButtonText}>🎙 {language === "ta" ? "குரல்" : "Voice"}</Text>
            </Pressable>
            <Pressable
              onPress={() => setLanguage(language === "en" ? "ta" : "en")}
              style={styles.langToggle}
            >
              <Text style={styles.langToggleText}>
                {language === "en" ? "தமிழ்" : "EN"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void setExperienceMode(experienceMode === "beginner" ? "professional" : "beginner")}
              style={styles.tierToggle}
            >
              <Text style={styles.tierToggleText}>
                {experienceMode === "beginner" ? (language === "ta" ? "🌱 தொடக்கம்" : "🌱 Beginner") : (language === "ta" ? "⚡ தொழில்" : "⚡ Pro")}
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push("/profile" as any)} style={styles.profileButton}>
              <Text style={styles.profileButtonText}>
                {user ? user.displayName.charAt(0).toUpperCase() : "👤"}
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push("/projects")} style={styles.projectLink}>
              <Text style={styles.projectLinkText}>{language === "ta" ? "ஓவியங்கள் ›" : "Projects ›"}</Text>
            </Pressable>
          </View>
        }
      />
      <View style={[styles.hero, isMobile && { flexDirection: "column", padding: 20 }]}>
        <View style={[styles.heroCopy, isMobile && { maxWidth: "100%" }]}>
          <Eyebrow>{language === "ta" ? "உங்கள் அமைதியான பயிற்சி இடம்" : "YOUR QUIET PLACE TO PRACTICE"}</Eyebrow>
          <Text style={[styles.headline, isMobile && { fontSize: 32, lineHeight: 36 }]}>
            {language === "ta" ? "ஒரு ஓவியத்திற்கு " : "Make room\nfor "}
            <Text style={styles.headlineAccent}>{language === "ta" ? "இடமளியுங்கள்." : "a drawing."}</Text>
          </Text>
          <Text style={styles.intro}>{t.app.drawDirectly}</Text>
          <View style={styles.heroButtons}>
            <Button title={t.app.startBlank} icon="✎" onPress={() => void startDrawing(false)} style={styles.heroButton} />
            {reference ? <Button title={language === "ta" ? "மாதிரியிலிருந்து வரை" : "Draw from this reference"} icon="◉" tone="soft" onPress={() => void startDrawing(true)} style={styles.heroButton} /> : null}
          </View>
          <View style={styles.offlineNote}><View style={styles.dot} /><Text style={styles.offlineText}>{t.status.offline}</Text></View>
        </View>
        {!isMobile ? (
          <View style={styles.heroArt}>
            <View style={styles.artPaper}>
              <View style={styles.artOrbit} />
              <View style={styles.artSun} />
              <View style={styles.artLine} />
              <Text style={styles.artLetter}>a.</Text>
              <Text style={styles.artCaption}>STUDIO NOTE 01</Text>
            </View>
            <Text style={styles.artMark}>✳</Text>
          </View>
        ) : null}
      </View>

      <SectionHeading title={language === "ta" ? "மாதிரிப் படத்தை இணைக்க" : "Bring in a reference"} detail={language === "ta" ? "விருப்பத்தேர்வு · அசல் படம் மாறாது" : "Optional · original stays untouched"} />
      <InfoCard style={styles.importCard}>
        <View style={styles.importCopy}>
          <Text style={styles.importTitle}>{reference ? (language === "ta" ? "உள்ளூர் மாதிரி தயார்" : "Your local reference is ready") : (language === "ta" ? "உள்ளூர் படத்தை தேர்வு செய்" : "Choose a local image")}</Text>
          <Text style={styles.importDetail}>{language === "ta" ? "JPG, JPEG, PNG மற்றும் WEBP. படம் இந்த சாதனத்தில் சேமிக்கப்படுகிறது, எங்கும் அனுப்பப்படாது." : "JPG, JPEG, PNG and WEBP. The image is copied to this device and is never sent anywhere automatically."}</Text>
          <View style={styles.importButtons}>
            <Button title={t.app.choosePhoto} icon="▧" onPress={() => void choosePhoto("gallery")} disabled={busy} style={styles.importButton} />
            <Button title={t.app.camera} icon="◉" tone="line" onPress={() => router.push("/camera")} style={styles.importButton} />
            <Button title={language === "ta" ? "கோப்புகள்" : "Browse files"} icon="⌕" tone="line" onPress={() => void choosePhoto("documents")} disabled={busy} style={styles.importButton} />
          </View>
        </View>
        {reference ? <Pressable onPress={() => router.push("/reference")} style={styles.thumbWrap} accessibilityLabel="Open reference preview"><Image source={{ uri: reference.uri }} style={styles.thumb} /><Text style={styles.thumbLabel}>Preview</Text></Pressable> : <View style={styles.importGlyph}><Text style={styles.importGlyphText}>＋</Text></View>}
      </InfoCard>

      <SectionHeading title={language === "ta" ? "AI வரைதல் நுண்ணறிவு சுற்றுச்சூழல்" : "AI Drawing Intelligence Ecosystem"} detail={language === "ta" ? "27 ஸ்டுடியோக்கள் & கருவிகள் · ஆஃப்லைன் தயார்" : "27 studios & assistants · Offline-ready"} />
      <View style={[styles.toolGrid, { gap: 11 }]}>
        {FEATURES.map((feature, index) => {
          const localized = (t.tools as any)?.[feature.id];
          const toolTitle = localized?.name || feature.title;
          const toolDesc = localized?.desc || feature.detail;
          return (
            <Pressable key={feature.id} onPress={() => openTool(feature.id)} style={({ pressed }) => [styles.toolCard, { width: `${100 / columns - (columns === 2 ? 1.7 : 1.1)}%` }, pressed && styles.pressed]}>
              <View style={[styles.toolNumber, index % 3 === 1 && styles.toolNumberAlt]}><Text style={styles.toolNumberText}>{String(index + 1).padStart(2, "0")}</Text></View>
              <Text style={styles.toolTitle}>{toolTitle}</Text>
              <Text style={styles.toolDetail}>{toolDesc}</Text>
              <Text style={styles.toolArrow}>↗</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ height: 28 }} />

      <VoiceAssistantModal
        visible={voiceVisible}
        onClose={() => setVoiceVisible(false)}
        currentScreen="home"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  voiceButton: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 16, backgroundColor: colors.forest },
  voiceButtonText: { fontSize: 11, fontWeight: "700", color: colors.white },
  langToggle: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 16, backgroundColor: "#DFD8C8" },
  langToggleText: { fontSize: 11, fontWeight: "700", color: colors.charcoal },
  tierToggle: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 16, backgroundColor: "#EBE5D8" },
  tierToggleText: { fontSize: 11, fontWeight: "700", color: colors.charcoal },
  projectLink: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18, backgroundColor: colors.mossLight },
  projectLinkText: { fontSize: 12, fontWeight: "700", color: colors.moss },
  profileButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  profileButtonText: { fontSize: 14, fontWeight: "700", color: colors.ink },
  hero: { minHeight: 300, flexDirection: "row", alignItems: "center", backgroundColor: "#ECEFE6", borderRadius: 28, padding: 25, overflow: "hidden" },
  heroCopy: { flex: 1, zIndex: 2, maxWidth: 620 },
  headline: { fontSize: 39, lineHeight: 43, color: colors.ink, fontFamily: "Georgia", letterSpacing: -0.9 },
  headlineAccent: { color: colors.moss, fontStyle: "italic" },
  intro: { marginTop: 12, maxWidth: 430, color: colors.muted, fontSize: 14, lineHeight: 21 },
  heroButtons: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 18 },
  heroButton: { marginBottom: 2 },
  offlineNote: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 15 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.moss },
  offlineText: { color: colors.muted, fontSize: 11 },
  heroArt: { width: 225, height: 245, marginLeft: 14, alignItems: "center", justifyContent: "center" },
  artPaper: { width: 168, height: 218, borderRadius: 9, backgroundColor: "#FCF8EA", borderWidth: 1, borderColor: "#D9D3BE", transform: [{ rotate: "4deg" }], overflow: "hidden", alignItems: "center", justifyContent: "center" },
  artOrbit: { width: 116, height: 145, borderRadius: 70, borderWidth: 1.3, borderColor: "#28594B", transform: [{ rotate: "21deg" }], position: "absolute", top: 29 },
  artSun: { width: 59, height: 75, borderRadius: 35, borderWidth: 1.3, borderColor: "#CB7857", position: "absolute", top: 63, left: 61, transform: [{ rotate: "-13deg" }] },
  artLine: { width: 1, height: 140, backgroundColor: "#2A5B4E", position: "absolute", top: 39, opacity: 0.72 },
  artLetter: { color: "#18251F", fontSize: 31, fontFamily: "Georgia", fontStyle: "italic", marginTop: 69 },
  artCaption: { position: "absolute", bottom: 12, fontSize: 7, letterSpacing: 1.7, color: colors.muted },
  artMark: { position: "absolute", fontSize: 28, right: 13, top: 13, color: colors.clay },
  importCard: { flexDirection: "row", gap: 16, alignItems: "center" },
  importCopy: { flex: 1 },
  importTitle: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  importDetail: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  importButtons: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  importButton: { minHeight: 42, paddingHorizontal: 13 },
  importGlyph: { width: 66, height: 66, borderRadius: 20, backgroundColor: colors.mossLight, alignItems: "center", justifyContent: "center" },
  importGlyphText: { fontSize: 34, lineHeight: 38, color: colors.moss },
  thumbWrap: { width: 78, alignItems: "center", gap: 4 },
  thumb: { width: 76, height: 76, borderRadius: 16, backgroundColor: colors.mossLight },
  thumbLabel: { color: colors.moss, fontSize: 10, fontWeight: "700" },
  toolGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  toolCard: { minHeight: 150, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 19, padding: 15, marginBottom: 1 },
  toolNumber: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#E8EEE7", marginBottom: 12 },
  toolNumberAlt: { backgroundColor: "#F4E7DF" },
  toolNumberText: { color: colors.moss, fontSize: 10, fontWeight: "800" },
  toolTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  toolDetail: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4, paddingRight: 8 },
  toolArrow: { position: "absolute", right: 14, bottom: 12, color: colors.clay, fontSize: 17 },
  pressed: { opacity: 0.78 },
});
