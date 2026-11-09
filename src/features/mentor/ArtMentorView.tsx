import React, { useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { AppHeader, Button, Eyebrow, InfoCard, Screen } from "../../components/AppUI";
import { useAppStore } from "../../state/appStore";
import { colors } from "../../theme";
import { INITIAL_MENTOR_MESSAGES, askArtMentor } from "./ArtMentorEngine";
import type { ArtMentorMessage } from "../../services/ai/types";

export const ArtMentorView: React.FC = () => {
  const [messages, setMessages] = useState<ArtMentorMessage[]>(INITIAL_MENTOR_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [busy, setBusy] = useState(false);
  const experienceMode = useAppStore((state) => state.experienceMode);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userQuery = inputText.trim();
    setInputText("");

    const newHistory: ArtMentorMessage[] = [...messages, { role: "user", text: userQuery }];
    setMessages(newHistory);
    setBusy(true);

    try {
      const response = await askArtMentor(newHistory, userQuery, {
        skillLevel: experienceMode === "professional" ? "advanced" : "beginner",
      });
      setMessages((prev) => [...prev, response]);
    } catch {
      Alert.alert("Mentor Unavailable", "Could not reach mentor service. Check network or retry.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="AI Art Mentor" onBack={() => router.back()} />
      <Eyebrow>INTERACTIVE ART ACADEMY COACH</Eyebrow>
      <Text style={styles.title}>AI Art Mentor<Text style={styles.titleDot}>.</Text></Text>
      <Text style={styles.note}>
        Ask questions regarding classical drawing fundamentals, proportion rules, 5-value shading, or perspective.
      </Text>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <FlatList
          data={messages}
          keyExtractor={(_, i) => `msg-${i}`}
          contentContainerStyle={styles.chatList}
          renderItem={({ item }) => {
            const isUser = item.role === "user";
            return (
              <View style={[styles.bubbleWrap, isUser ? styles.bubbleUserWrap : styles.bubbleMentorWrap]}>
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleMentor]}>
                  <Text style={[styles.bubbleSender, isUser && styles.bubbleSenderUser]}>
                    {isUser ? "You" : "Master Atelier Mentor"}
                  </Text>
                  <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.text}</Text>
                  {item.suggestedAction && (
                    <Pressable
                      onPress={() => router.push(`/tools/${item.suggestedAction!.toolId}` as any)}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.actionBtnText}>⚡ {item.suggestedAction.label} ›</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          }}
        />

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask about head construction, shading values..."
            placeholderTextColor="#88928A"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => void handleSend()}
          />
          <Pressable onPress={() => void handleSend()} disabled={busy} style={styles.sendBtn}>
            <Text style={styles.sendText}>{busy ? "..." : "Ask"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "700", color: colors.charcoal, marginTop: 4, marginBottom: 4 },
  titleDot: { color: colors.terracotta },
  note: { fontSize: 13, color: colors.inkMuted, lineHeight: 18, marginBottom: 14 },
  chatList: { gap: 12, paddingBottom: 16 },
  bubbleWrap: { flexDirection: "row", width: "100%" },
  bubbleUserWrap: { justifyContent: "flex-end" },
  bubbleMentorWrap: { justifyContent: "flex-start" },
  bubble: { maxWidth: "88%", padding: 14, borderRadius: 16 },
  bubbleMentor: { backgroundColor: "#F4EFE6", borderWidth: 1, borderColor: "#E2DACB" },
  bubbleUser: { backgroundColor: colors.forest },
  bubbleSender: { fontSize: 10, fontWeight: "700", color: colors.terracotta, marginBottom: 4 },
  bubbleSenderUser: { color: "#D1E7DD" },
  bubbleText: { fontSize: 13, color: colors.charcoal, lineHeight: 18 },
  bubbleTextUser: { color: "#FFFFFF" },
  actionBtn: { marginTop: 10, alignSelf: "flex-start", backgroundColor: colors.forest, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  actionBtnText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  inputBar: { flexDirection: "row", gap: 8, paddingVertical: 12, borderTopWidth: 1, borderColor: "#E5DEC9", marginTop: 8 },
  input: { flex: 1, backgroundColor: "#F9F6F0", borderWidth: 1, borderColor: "#DCD5C5", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: colors.charcoal },
  sendBtn: { backgroundColor: colors.forest, paddingHorizontal: 18, justifyContent: "center", borderRadius: 20 },
  sendText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
});
