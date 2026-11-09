import React, { useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAppStore } from "../state/appStore";
import { useAuthStore } from "../state/authStore";
import { colors } from "../theme";

const { width } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();
  const { language, setLanguage, experienceMode, setExperienceMode, setOnboardingCompleted } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const [slideIndex, setSlideIndex] = useState(0);

  const isTa = language === "ta";

  const handleFinish = async (targetRoute: string = "/") => {
    await setOnboardingCompleted(true);
    router.replace(targetRoute as any);
  };

  const slides = [
    {
      icon: "feather",
      title: isTa ? "ஓவியத்திற்கு இடமளியுங்கள்" : "Make Room for a Drawing",
      subtitle: isTa
        ? "உங்கள் கைபேசியில் ஒரு அமைதியான, தொழில்முறை வரைதல் அரங்கம்."
        : "A quiet, professional studio designed for serious drawing practice.",
      badge: isTa ? "வரவேற்கிறோம்" : "WELCOME",
    },
    {
      icon: "layers",
      title: isTa ? "100% ஆஃப்லைன் வரைதல்" : "100% Offline-First Freedom",
      subtitle: isTa
        ? "ஸ்கியா கேன்வாஸ், தூரிகைகள் மற்றும் லூமிஸ் வழிகாட்டிகள் இணையம் அல்லது உள்நுழைவு இல்லாமலும் இயங்கும்."
        : "Skia hardware-accelerated canvas, brushes, and classical academies work completely offline with zero account requirements.",
      badge: isTa ? "தனியுரிமை & ஆஃப்லைன்" : "PRIVACY & OFFLINE",
    },
    {
      icon: "cpu",
      title: isTa ? "AI வரைதல் நுண்ணறிவு" : "AI Drawing Intelligence",
      subtitle: isTa
        ? "16 AI வழிகாட்டிகள்: உடற்கூறியல், நிழலமைப்பு, போஸ் பகுப்பாய்வு மற்றும் கலை வழிகாட்டி உங்கள் விரல் நுனியில்."
        : "16 dedicated assistants: anatomy proportion checks, 360° shading, mistake detection, and live art mentoring.",
      badge: isTa ? "27 ஸ்டுடியோ கருவிகள்" : "27 STUDIO TOOLS",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Top Bar with Language Toggle & Skip */}
      <View style={styles.topBar}>
        <View style={styles.langPill}>
          <Pressable
            onPress={() => setLanguage("en")}
            style={[styles.langBtn, language === "en" && styles.langBtnActive]}
          >
            <Text style={[styles.langText, language === "en" && styles.langTextActive]}>EN</Text>
          </Pressable>
          <Pressable
            onPress={() => setLanguage("ta")}
            style={[styles.langBtn, language === "ta" && styles.langBtnActive]}
          >
            <Text style={[styles.langText, language === "ta" && styles.langTextActive]}>தமிழ்</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => handleFinish("/")} style={styles.skipBtn}>
          <Text style={styles.skipText}>{isTa ? "தவிர் ›" : "Skip ›"}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Slide Card */}
        <View style={styles.slideCard}>
          <View style={styles.badgeWrap}>
            <Text style={styles.badgeText}>{slides[slideIndex].badge}</Text>
          </View>

          <View style={styles.iconCircle}>
            <Feather name={slides[slideIndex].icon as any} size={42} color={colors.forest} />
          </View>

          <Text style={styles.slideTitle}>{slides[slideIndex].title}</Text>
          <Text style={styles.slideSubtitle}>{slides[slideIndex].subtitle}</Text>

          {/* Dots Indicator */}
          <View style={styles.dotsRow}>
            {slides.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => setSlideIndex(i)}
                style={[styles.dot, slideIndex === i && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        {/* Experience Mode Selector Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>
            {isTa ? "உங்கள் அனுபவ நிலையைத் தேர்ந்தெடுக்கவும்" : "Select Your Experience Level"}
          </Text>
          <Text style={styles.sectionDesc}>
            {isTa
              ? "எந்த நேரத்திலும் அமைப்புகளில் மாற்றிக்கொள்ளலாம்."
              : "You can change this anytime from the app header."}
          </Text>

          <View style={styles.modeRow}>
            <Pressable
              onPress={() => setExperienceMode("beginner")}
              style={[styles.modeCard, experienceMode === "beginner" && styles.modeCardActive]}
            >
              <View style={styles.modeHeader}>
                <Text style={styles.modeIcon}>🌱</Text>
                <Text style={styles.modeTitle}>{isTa ? "தொடக்க நிலை" : "Beginner"}</Text>
              </View>
              <Text style={styles.modeDetail}>
                {isTa
                  ? "எளிய இடைமுகம், சூழல்சார் குறிப்புகள், மற்றும் படிப்படியான வழிகாட்டுதல்."
                  : "Simplified toolbars, contextual coaching tips, and curated foundational presets."}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setExperienceMode("professional")}
              style={[styles.modeCard, experienceMode === "professional" && styles.modeCardActive]}
            >
              <View style={styles.modeHeader}>
                <Text style={styles.modeIcon}>⚡</Text>
                <Text style={styles.modeTitle}>{isTa ? "தொழில்முறை" : "Professional"}</Text>
              </View>
              <Text style={styles.modeDetail}>
                {isTa
                  ? "முழுமையான அளவுருக் கட்டுப்பாடுகள், வடிவியல் அளவீடுகள், மற்றும் நேரடி வெக்டார் ஏற்றுமதி."
                  : "Full parametric slider ranges, geometric coordinate telemetry, and vector SVG exports."}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Offline Guarantee & Privacy Disclosure Card */}
        <View style={styles.privacyCard}>
          <View style={styles.privacyIconRow}>
            <Feather name="shield" size={20} color={colors.moss} />
            <Text style={styles.privacyHeading}>
              {isTa ? "எங்கள் தனியுரிமை & ஆஃப்லைன் உறுதி" : "Our Privacy & Offline Promise"}
            </Text>
          </View>
          <Text style={styles.privacyText}>
            {isTa
              ? "• அடிப்படை வரைதல், தூரிகைகள் மற்றும் உள்ளூர் திட்டங்கள் எப்போதும் இலவசம் மற்றும் 100% ஆஃப்லைனில் செயல்படும்.\n• புகைப்படங்கள் சாதனத்தை விட்டு தானாக எங்கும் பதிவேற்றப்படாது.\n• சந்தா கட்டாயமில்லை — நீங்கள் விரும்பினால் மட்டுமே கிளவுட் AI-ஐப் பயன்படுத்தலாம்."
              : "• Core drawing, brushes, and local projects are free forever and operate 100% offline.\n• Photos are stored on-device and never auto-uploaded.\n• Subscriptions are strictly optional for cloud AI features."}
          </Text>
        </View>

        {/* Call to Action Buttons */}
        <View style={styles.actionBlock}>
          <Pressable onPress={() => handleFinish("/")} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>
              {isTa ? "வரைதல் அரங்கிற்குச் செல் ›" : "Enter Drawing Studio ›"}
            </Text>
          </Pressable>

          {!isAuthenticated ? (
            <View style={styles.authRow}>
              <Pressable
                onPress={() => handleFinish("/auth/login")}
                style={styles.secondaryBtn}
              >
                <Text style={styles.secondaryBtnText}>
                  {isTa ? "உள்நுழைக" : "Sign In"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleFinish("/auth/register")}
                style={styles.secondaryBtn}
              >
                <Text style={styles.secondaryBtnText}>
                  {isTa ? "பதிவு செய்க" : "Create Account"}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingTop: 50,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  langPill: {
    flexDirection: "row",
    backgroundColor: "#DFD8C8",
    borderRadius: 20,
    padding: 3,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  langBtnActive: {
    backgroundColor: colors.forest,
  },
  langText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.charcoal,
  },
  langTextActive: {
    color: "#fff",
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.clay,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  slideCard: {
    backgroundColor: colors.paper,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    marginBottom: 20,
  },
  badgeWrap: {
    backgroundColor: "#E8EEE7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.moss,
    letterSpacing: 0.8,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#ECEFE6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.ink,
    textAlign: "center",
    fontFamily: "Georgia",
    marginBottom: 8,
  },
  slideSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 320,
    marginBottom: 18,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D9D3BE",
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.forest,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 12,
    color: "#666",
    marginBottom: 14,
  },
  modeRow: {
    gap: 10,
  },
  modeCard: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#FAFAFA",
  },
  modeCardActive: {
    borderColor: colors.forest,
    backgroundColor: "#F3F7F4",
  },
  modeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  modeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  modeDetail: {
    fontSize: 12,
    lineHeight: 17,
    color: "#555",
  },
  privacyCard: {
    backgroundColor: "#F4F7F2",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#D3E0D1",
    marginBottom: 24,
  },
  privacyIconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  privacyHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.forest,
  },
  privacyText: {
    fontSize: 12,
    lineHeight: 19,
    color: colors.charcoal,
  },
  actionBlock: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: colors.forest,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  authRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.forest,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  secondaryBtnText: {
    color: colors.forest,
    fontSize: 14,
    fontWeight: "600",
  },
});
