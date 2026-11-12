import { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { AppHeader, Button, Eyebrow, InfoCard, Screen, SectionHeading, useResponsiveLayout } from "../components/AppUI";
import { FEATURES } from "../domain/features";
import { chooseImageFromDocuments, choosePhotoFromSystemPicker } from "../features/images/pickImage";
import { VoiceAssistantModal } from "../features/voice/VoiceAssistantModal";
import { BeginnerDashboard } from "../features/modes/BeginnerDashboard";
import { ModeSelectorModal } from "../features/modes/ModeSelectorModal";
import { useTranslation } from "../i18n";
import { useAppStore } from "../state/appStore";
import { useAuthStore } from "../state/authStore";
import { colors } from "../theme";
import type { ToolId } from "../domain/types";

type ToolCategoryFilter = "all" | "core" | "ai-studio" | "assistant" | "processing" | "pro";

export default function HomeScreen() {
  const { width, isSmallPhone, isTablet, isLandscape } = useResponsiveLayout();
  const isMobile = width < 600;
  const columns = width >= 900 ? 4 : width >= 600 ? 3 : width < 340 ? 1 : 2;
  const studioCardWidth = isSmallPhone ? "100%" : isTablet ? "23.5%" : "48%";
  const { t, language, setLanguage } = useTranslation();
  const ready = useAppStore((state) => state.ready);
  const onboardingCompleted = useAppStore((state) => state.onboardingCompleted);
  const projects = useAppStore((state) => state.projects);
  const reference = useAppStore((state) => state.reference);
  const createProject = useAppStore((state) => state.createProject);
  const experienceMode = useAppStore((state) => state.experienceMode);
  const setExperienceMode = useAppStore((state) => state.setExperienceMode);
  const user = useAuthStore((state) => state.user);
  const [busy, setBusy] = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [modeSelectorVisible, setModeSelectorVisible] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<ToolCategoryFilter>("all");

  useEffect(() => {
    if (ready && !onboardingCompleted) {
      router.replace("/onboarding" as any);
    }
  }, [ready, onboardingCompleted]);

  const startDrawing = async (withReference = false) => {
    if (busy) return;
    setBusy(true);
    try {
      const id = await createProject(
        withReference ? reference?.uri ?? null : null,
        withReference ? "Reference Study" : "Blank Drawing"
      );
      if (withReference) {
        router.push(`/reference-studio/${id}`);
      } else {
        router.push(`/studio/${id}`);
      }
    } catch {
      Alert.alert("Could not start drawing", "The local project store could not be opened.");
    } finally {
      setBusy(false);
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

  const filteredFeatures = FEATURES.filter((f) => {
    if (categoryFilter === "all") return true;
    return f.category === categoryFilter;
  });

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
              onPress={() => setModeSelectorVisible(true)}
              style={styles.tierToggle}
            >
              <Text style={styles.tierToggleText}>
                {experienceMode === "beginner" ? (language === "ta" ? "🌱 தொடக்கம்" : "🌱 Beginner") : (language === "ta" ? "⚡ தொழில்" : "⚡ Pro")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/subscription" as any)}
              style={styles.creditPill}
            >
              <Text style={styles.creditPillTier}>{(user?.subscriptionTier || "free").toUpperCase()}</Text>
              <Text style={styles.creditPillCount}>{user?.creditBalance ?? 50}c</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/profile" as any)} style={styles.profileButton}>
              <Text style={styles.profileButtonText}>
                {user ? user.displayName.charAt(0).toUpperCase() : "👤"}
              </Text>
            </Pressable>
          </View>
        }
      />

      {experienceMode === "beginner" ? (
        <BeginnerDashboard onOpenModeSelector={() => setModeSelectorVisible(true)} />
      ) : (
        <>
          {/* Professional Workstation Banner */}
          <View style={styles.proModeBanner}>
            <View style={styles.proModeTag}>
              <Text style={styles.proModeIcon}>⚡</Text>
              <Text style={styles.proModeText}>
                {language === "ta" ? "தொழில்முறை கலைஞர் பணிநிலையம்" : "Professional Artist Workstation"}
              </Text>
            </View>
            <Pressable
              onPress={() => setModeSelectorVisible(true)}
              style={styles.switchModePill}
              accessibilityLabel="Switch experience mode"
            >
              <Text style={styles.switchModePillText}>
                {language === "ta" ? "மாற்று ›" : "Switch Mode ›"}
              </Text>
            </Pressable>
          </View>

          {/* Hero Section */}
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

      {/* Recent Projects Shelf (If any exist) */}
      {projects && projects.length > 0 ? (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <SectionHeading
              title={language === "ta" ? "சமீபத்திய ஓவியங்கள்" : "Recent Projects"}
              detail={`${projects.length} ${language === "ta" ? "திட்டங்கள் சேமிக்கப்பட்டுள்ளன" : "saved locally"}`}
            />
            <Pressable onPress={() => router.push("/projects")} style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>{language === "ta" ? "அனைத்தும் ›" : "View All ›"}</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
            {projects.slice(0, 6).map((proj) => {
              const isRef = Boolean(proj.referenceUri);
              return (
                <Pressable
                  key={proj.id}
                  onPress={() => {
                    if (isRef) {
                      router.push(`/reference-studio/${proj.id}` as any);
                    } else {
                      router.push(`/studio/${proj.id}` as any);
                    }
                  }}
                  style={styles.recentCard}
                  accessibilityLabel={`Open ${proj.name} in ${isRef ? "Reference Studio" : "Free Drawing Studio"}`}
                >
                  <View style={styles.recentThumb}>
                    <Text style={styles.recentIcon}>{isRef ? "📐" : "🎨"}</Text>
                    <Text style={styles.recentLayerCount}>
                      {proj.width}×{proj.height}
                    </Text>
                  </View>
                  <Text style={styles.recentTitle} numberOfLines={1}>
                    {proj.name}
                  </Text>
                  <Text style={styles.recentDate}>
                    {new Date(proj.updatedAt).toLocaleDateString()}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Reference Import Card */}
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

      {/* Traditional Learning & AI Companion Studios Hub */}
      <SectionHeading
        title={language === "ta" ? "பாரம்பரிய கற்றல் & AI வழிகாட்டி" : "Traditional Learning & AI Companion"}
        detail={language === "ta" ? "பாடத்திட்டம் · தினசரி பயிற்சி · ஆய்வு · ஒப்பீடு" : "Curriculum · Daily Practice · Reference Analysis · Comparison"}
      />
      <View style={styles.phase7StudioRow}>
        <Pressable
          onPress={() => router.push("/learning/index" as any)}
          style={({ pressed }) => [styles.phase7Card, { width: studioCardWidth as any }, pressed && styles.pressed]}
        >
          <Text style={styles.phase7CardIcon}>🎓</Text>
          <Text style={styles.phase7CardTitle}>{language === "ta" ? "கற்றல் ஸ்டுடியோ" : "Learning Studio"}</Text>
          <Text style={styles.phase7CardSub}>{language === "ta" ? "40 பாடங்கள் (7 நிலைகள்)" : "40 Lessons (7 Levels)"}</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/practice/index" as any)}
          style={({ pressed }) => [styles.phase7Card, { width: studioCardWidth as any }, pressed && styles.pressed]}
        >
          <Text style={styles.phase7CardIcon}>⏱️</Text>
          <Text style={styles.phase7CardTitle}>{language === "ta" ? "பயிற்சி ஸ்டுடியோ" : "Practice Studio"}</Text>
          <Text style={styles.phase7CardSub}>{language === "ta" ? "தினசரி சவால்கள்" : "Daily Challenges"}</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/assistant/index" as any)}
          style={({ pressed }) => [styles.phase7Card, { width: studioCardWidth as any }, pressed && styles.pressed]}
        >
          <Text style={styles.phase7CardIcon}>🤖</Text>
          <Text style={styles.phase7CardTitle}>{language === "ta" ? "AI வழிகாட்டி" : "AI Assistant"}</Text>
          <Text style={styles.phase7CardSub}>{language === "ta" ? "மாதிரி ஆய்வு & அடுக்குகள்" : "Reference Guidance"}</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/comparison/index" as any)}
          style={({ pressed }) => [styles.phase7Card, { width: studioCardWidth as any }, pressed && styles.pressed]}
        >
          <Text style={styles.phase7CardIcon}>⚖️</Text>
          <Text style={styles.phase7CardTitle}>{language === "ta" ? "வரைதல் ஒப்பீடு" : "Comparison"}</Text>
          <Text style={styles.phase7CardSub}>{language === "ta" ? "அமைப்பு & வடிவ கருத்து" : "Align & Compare"}</Text>
        </Pressable>
      </View>

      {/* 27 Studio Tools & Assistants with Category Tabs */}
      <SectionHeading
        title={language === "ta" ? "AI வரைதல் நுண்ணறிவு சுற்றுச்சூழல்" : "AI Drawing Intelligence Ecosystem"}
        detail={language === "ta" ? "27 ஸ்டுடியோக்கள் & கருவிகள் · ஆஃப்லைன் தயார்" : "27 studios & assistants · Offline-ready"}
      />

      {/* Category Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
        {[
          { key: "all", label: language === "ta" ? "அனைத்தும் (27)" : "All (27)" },
          { key: "core", label: language === "ta" ? "அடிப்படை (11)" : "Classical (11)" },
          { key: "ai-studio", label: language === "ta" ? "AI ஸ்டுடியோ (4)" : "AI Studio (4)" },
          { key: "assistant", label: language === "ta" ? "AI பயிற்சியாளர்கள் (4)" : "Coaches (4)" },
          { key: "processing", label: language === "ta" ? "படம் செயலாக்கம் (4)" : "Processing (4)" },
          { key: "pro", label: language === "ta" ? "தொழில்முறை (4)" : "Pro Tools (4)" },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setCategoryFilter(tab.key as ToolCategoryFilter)}
            style={[styles.filterTab, categoryFilter === tab.key && styles.filterTabActive]}
          >
            <Text style={[styles.filterTabText, categoryFilter === tab.key && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Tools Grid */}
      <View style={[styles.toolGrid, { gap: 11 }]}>
        {filteredFeatures.map((feature, index) => {
          const localized = (t.tools as any)?.[feature.id];
          const toolTitle = localized?.name || feature.title;
          const toolDesc = localized?.desc || feature.detail;
          return (
            <Pressable
              key={feature.id}
              onPress={() => openTool(feature.id)}
              style={({ pressed }) => [
                styles.toolCard,
                { width: columns === 1 ? "100%" : `${100 / columns - (columns === 2 ? 1.7 : columns === 3 ? 1.4 : 1.1)}%` },
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.toolNumber, index % 3 === 1 && styles.toolNumberAlt]}>
                <Text style={styles.toolNumberText}>{String(index + 1).padStart(2, "0")}</Text>
              </View>
              <Text style={styles.toolTitle}>{toolTitle}</Text>
              <Text style={styles.toolDetail}>{toolDesc}</Text>
              <Text style={styles.toolArrow}>↗</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ height: 28 }} />
        </>
      )}

      <VoiceAssistantModal
        visible={voiceVisible}
        onClose={() => setVoiceVisible(false)}
        currentScreen="home"
      />

      <ModeSelectorModal
        visible={modeSelectorVisible}
        onClose={() => setModeSelectorVisible(false)}
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
  creditPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: "#E2ECE5", borderWidth: 1, borderColor: "#C6DDD0" },
  creditPillTier: { fontSize: 10, fontWeight: "800", color: colors.forest, letterSpacing: 0.5 },
  creditPillCount: { fontSize: 11, fontWeight: "700", color: colors.copper },
  profileButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  profileButtonText: { fontSize: 14, fontWeight: "700", color: colors.ink },
  proModeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0EBE1",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DDD4C4",
    marginBottom: 16,
  },
  proModeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  proModeIcon: {
    fontSize: 16,
    color: colors.clay,
  },
  proModeText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
  },
  switchModePill: {
    backgroundColor: "#E2DBD0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  switchModePillText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.charcoal,
  },
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
  recentSection: { marginTop: 16, marginBottom: 8 },
  recentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  viewAllBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  viewAllText: { fontSize: 13, fontWeight: "600", color: colors.moss },
  recentScroll: { gap: 12, paddingVertical: 8 },
  recentCard: { width: 130, backgroundColor: colors.paper, borderRadius: 16, padding: 10, borderWidth: 1, borderColor: colors.line },
  recentThumb: { height: 72, backgroundColor: "#ECEFE6", borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  recentIcon: { fontSize: 24, marginBottom: 2 },
  recentLayerCount: { fontSize: 9, color: colors.muted, fontWeight: "600" },
  recentTitle: { fontSize: 13, fontWeight: "700", color: colors.ink, marginBottom: 2 },
  recentDate: { fontSize: 10, color: colors.muted },
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
  filterTabs: { flexDirection: "row", gap: 8, paddingVertical: 8, marginBottom: 12 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#EAE6DB", borderWidth: 1, borderColor: "transparent" },
  filterTabActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  filterTabText: { fontSize: 12, fontWeight: "600", color: colors.charcoal },
  filterTabTextActive: { color: "#fff", fontWeight: "700" },
  toolGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  toolCard: { minHeight: 150, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 19, padding: 15, marginBottom: 1 },
  toolNumber: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#E8EEE7", marginBottom: 12 },
  toolNumberAlt: { backgroundColor: "#F4E7DF" },
  toolNumberText: { color: colors.moss, fontSize: 10, fontWeight: "800" },
  toolTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  toolDetail: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4, paddingRight: 8 },
  toolArrow: { position: "absolute", right: 14, bottom: 12, color: colors.clay, fontSize: 17 },
  pressed: { opacity: 0.78 },
  phase7StudioRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  phase7Card: {
    width: "48%",
    backgroundColor: colors.paper,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 3,
  },
  phase7CardIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  phase7CardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
  },
  phase7CardSub: {
    fontSize: 11,
    color: colors.muted,
  },
});
