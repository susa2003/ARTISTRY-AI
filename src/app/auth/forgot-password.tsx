import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { clientAuthService } from "../../services/auth/AuthService";
import { useAppStore } from "../../state/appStore";
import { t } from "../../i18n";
import { colors } from "../../theme";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const language = useAppStore((state) => state.language);

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSendLink = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    setIsLoading(true);
    try {
      await clientAuthService.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to dispatch reset link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}
      >
        <Feather name="arrow-left" size={24} color={colors.ink} />
        <Text style={{ marginLeft: 8, fontSize: 16, color: colors.ink }}>
          {t(language, "navigation.back")}
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 28, fontWeight: "800", color: colors.ink, marginBottom: 8 }}>
        {t(language, "auth.forgotPassword")}
      </Text>

      {submitted ? (
        <View style={{ backgroundColor: "#DEF7EC", padding: 20, borderRadius: 12, marginTop: 16 }}>
          <Feather name="check-circle" size={32} color="#0E9F6E" style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#03543F", marginBottom: 6 }}>
            Check your email
          </Text>
          <Text style={{ fontSize: 14, color: "#03543F", lineHeight: 20, marginBottom: 20 }}>
            If an account exists for {email}, a password reset link has been dispatched.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/auth/login" as any)}
            style={{
              backgroundColor: colors.sage,
              padding: 12,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={{ fontSize: 15, color: "#666", marginBottom: 28 }}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.ink, marginBottom: 6 }}>
              {t(language, "auth.email")}
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="artist@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 10,
                padding: 14,
                fontSize: 16,
                backgroundColor: "#fff",
              }}
            />
          </View>

          <TouchableOpacity
            onPress={handleSendLink}
            disabled={isLoading}
            style={{
              backgroundColor: colors.sage,
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                {t(language, "auth.sendResetLink")}
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}
