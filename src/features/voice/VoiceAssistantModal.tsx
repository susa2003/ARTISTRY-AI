import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { voiceAssistantEngine, VoiceActionResult } from "./VoiceAssistantEngine";
import { colors } from "../../theme";

interface VoiceAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  currentScreen?: string;
}

export function VoiceAssistantModal({
  visible,
  onClose,
  currentScreen = "home",
}: VoiceAssistantModalProps) {
  const router = useRouter();
  const [language, setLanguage] = useState<"en" | "ta">("en");
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [lastResult, setLastResult] = useState<VoiceActionResult | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState(false);

  const handleProcess = async (text: string) => {
    if (!text.trim()) return;
    setTranscript(text);
    setIsListening(false);

    const result = await voiceAssistantEngine.processVoiceCommand(
      text,
      language,
      currentScreen
    );
    setLastResult(result);

    if (result.requiresConfirmation) {
      setPendingConfirm(true);
    } else {
      voiceAssistantEngine.executeAction(result, (route) => {
        onClose();
        router.push(route as any);
      });
    }
  };

  const handleConfirmAction = () => {
    if (lastResult) {
      voiceAssistantEngine.executeAction(lastResult, (route) => {
        onClose();
        router.push(route as any);
      });
    }
    setPendingConfirm(false);
  };

  const sampleChips =
    language === "en"
      ? [
          "Select pencil",
          "Select eraser",
          "Undo last stroke",
          "Open Anatomy Academy",
          "How to shade a sphere?",
          "Clear canvas",
        ]
      : [
          "பென்சில் தேர்ந்தெடு",
          "அழிப்பான் தேர்ந்தெடு",
          "முந்தைய நிலை",
          "அனாடமி பகுதி திற",
          "நிழல் வரைவது எப்படி?",
          "அனைத்தையும் அழி",
        ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {language === "en" ? "Voice Drawing Assistant" : "குரல் வரைதல் உதவியாளர்"}
              </Text>
              <Text style={styles.subtitle}>
                {language === "en"
                  ? "Speak commands in English or Tamil"
                  : "தமிழ் அல்லது ஆங்கிலத்தில் கட்டளைகளைக் கூறவும்"}
              </Text>
            </View>
            {/* Language Switcher */}
            <View style={styles.langPill}>
              <TouchableOpacity
                onPress={() => setLanguage("en")}
                style={[styles.langBtn, language === "en" && styles.langBtnActive]}
              >
                <Text
                  style={[styles.langText, language === "en" && styles.langTextActive]}
                >
                  EN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLanguage("ta")}
                style={[styles.langBtn, language === "ta" && styles.langBtnActive]}
              >
                <Text
                  style={[styles.langText, language === "ta" && styles.langTextActive]}
                >
                  தமிழ்
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mic Visualizer / Input Box */}
          <View style={styles.micBox}>
            <TouchableOpacity
              onPress={() => setIsListening(!isListening)}
              style={[styles.micCircle, isListening && styles.micCircleActive]}
            >
              <Text style={styles.micIcon}>{isListening ? "⏹" : "🎙"}</Text>
            </TouchableOpacity>
            <Text style={styles.listeningText}>
              {isListening
                ? language === "en"
                  ? "Listening... Tap to stop"
                  : "கேட்கிறது... நிறுத்த தட்டவும்"
                : language === "en"
                ? "Tap mic or choose a quick prompt"
                : "மைக் தட்டவும் அல்லது கட்டளையை தேர்வு செய்யவும்"}
            </Text>
          </View>

          {/* Transcript / Input text */}
          <TextInput
            style={styles.input}
            placeholder={
              language === "en"
                ? "Type or speak drawing command..."
                : "கட்டளையை தட்டச்சு செய்யவும்..."
            }
            placeholderTextColor="#71796F"
            value={transcript}
            onChangeText={setTranscript}
            onSubmitEditing={() => handleProcess(transcript)}
          />

          {/* Quick chips */}
          <Text style={styles.chipHeader}>
            {language === "en" ? "Suggested Commands:" : "பரிந்துரைக்கப்பட்ட கட்டளைகள்:"}
          </Text>
          <View style={styles.chipRow}>
            {sampleChips.map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.chip}
                onPress={() => handleProcess(chip)}
              >
                <Text style={styles.chipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Spoken Response Result */}
          {lastResult && (
            <View style={styles.responseBox}>
              <Text style={styles.responseTitle}>
                {language === "en" ? "Assistant Response:" : "உதவியாளர் பதில்:"}
              </Text>
              <Text style={styles.responseText}>
                {language === "en"
                  ? lastResult.spokenResponseEn
                  : lastResult.spokenResponseTa}
              </Text>
            </View>
          )}

          {/* Confirmation Box if required */}
          {pendingConfirm && (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>
                {language === "en"
                  ? "Confirm: Clear all artwork on canvas?"
                  : "உறுதிப்படுத்தவும்: வரைபடத்தை முழுமையாக அழிக்கவா?"}
              </Text>
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={[styles.confirmBtn, styles.confirmBtnDanger]}
                  onPress={handleConfirmAction}
                >
                  <Text style={styles.confirmBtnTextDanger}>
                    {language === "en" ? "Yes, Clear" : "ஆம், அழி"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, styles.confirmBtnCancel]}
                  onPress={() => setPendingConfirm(false)}
                >
                  <Text style={styles.confirmBtnTextCancel}>
                    {language === "en" ? "Cancel" : "ரத்து செய்"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>
              {language === "en" ? "Close" : "மூடு"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(23, 32, 28, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: colors.paper,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.ink,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  langPill: {
    flexDirection: "row",
    backgroundColor: "#E5DEC9",
    borderRadius: 8,
    padding: 2,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  langBtnActive: {
    backgroundColor: colors.forest,
  },
  langText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.ink,
  },
  langTextActive: {
    color: colors.white,
  },
  micBox: {
    alignItems: "center",
    marginVertical: 12,
  },
  micCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.forest,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  micCircleActive: {
    backgroundColor: colors.danger,
  },
  micIcon: {
    fontSize: 28,
    color: colors.white,
  },
  listeningText: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 12,
  },
  chipHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: "#EAE3D2",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 11,
    color: colors.ink,
  },
  responseBox: {
    backgroundColor: "#EBF1EE",
    borderLeftWidth: 4,
    borderLeftColor: colors.forest,
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  responseTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.forest,
  },
  responseText: {
    fontSize: 13,
    color: colors.ink,
    marginTop: 2,
  },
  confirmBox: {
    backgroundColor: "#FDF2E9",
    borderWidth: 1,
    borderColor: colors.terracotta,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  confirmText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
    textAlign: "center",
    marginBottom: 8,
  },
  confirmActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  confirmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  confirmBtnDanger: {
    backgroundColor: colors.danger,
  },
  confirmBtnCancel: {
    backgroundColor: colors.line,
  },
  confirmBtnTextDanger: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  confirmBtnTextCancel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "600",
  },
  closeBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
});
