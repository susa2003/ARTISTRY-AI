import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuthStore } from "../../state/authStore";
import { useAppStore } from "../../state/appStore";
import { checkPasswordStrength } from "../../services/auth/AuthService";
import { t } from "../../i18n";
import { colors } from "../../theme";

export default function RegisterScreen() {
  const router = useRouter();
  const language = useAppStore((state) => state.language);
  const experienceMode = useAppStore((state) => state.experienceMode);
  const { register, isLoading, error, clearError } = useAuthStore();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [consentTerms, setConsentTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const strength = checkPasswordStrength(password);

  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    if (!consentTerms) {
      Alert.alert("Terms Required", "You must agree to the Terms of Service and Privacy Policy.");
      return;
    }
    if (!strength.isStrongEnough) {
      Alert.alert("Weak Password", strength.issues.join("\n"));
      return;
    }

    try {
      clearError();
      await register({
        displayName,
        email,
        password,
        confirmPassword,
        consentTerms,
        language,
        experienceMode,
      });
      Alert.alert("Success", "Account created successfully!", [
        { text: "Continue", onPress: () => router.replace("/") },
      ]);
    } catch (err: any) {
      Alert.alert("Registration Failed", err.message || "Could not register account.");
    }
  };

  const getStrengthBarColor = (index: number) => {
    if (strength.score <= index) return "#E5E7EB";
    if (strength.score === 1) return "#EF4444";
    if (strength.score === 2) return "#F59E0B";
    if (strength.score === 3) return "#3B82F6";
    return "#10B981";
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}
      >
        <Feather name="arrow-left" size={24} color={colors.ink} />
        <Text style={{ marginLeft: 8, fontSize: 16, color: colors.ink }}>
          {t(language, "navigation.back")}
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 30, fontWeight: "800", color: colors.ink, marginBottom: 6 }}>
        {t(language, "auth.signUp")}
      </Text>
      <Text style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>
        Join ARTISTRY AI and master drawing with classical and AI studio intelligence.
      </Text>

      {error ? (
        <View style={{ backgroundColor: "#FDE8E8", padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ color: "#E02424", fontSize: 14 }}>{error}</Text>
        </View>
      ) : null}

      {/* Full Name */}
      <View style={{ marginBottom: 14 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.ink, marginBottom: 6 }}>
          {t(language, "auth.fullName")}
        </Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Leonardo da Vinci"
          style={{
            borderWidth: 1,
            borderColor: "#D1D5DB",
            borderRadius: 10,
            padding: 12,
            fontSize: 16,
            backgroundColor: "#fff",
          }}
        />
      </View>

      {/* Email Address */}
      <View style={{ marginBottom: 14 }}>
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
            padding: 12,
            fontSize: 16,
            backgroundColor: "#fff",
          }}
        />
      </View>

      {/* Password */}
      <View style={{ marginBottom: 14 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.ink, marginBottom: 6 }}>
          {t(language, "auth.password")}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10, backgroundColor: "#fff" }}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            style={{ flex: 1, padding: 12, fontSize: 16 }}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 12 }}>
            <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Password Strength Meter */}
        {password.length > 0 ? (
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 12, color: "#666" }}>Strength: {strength.label}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 4, height: 6 }}>
              {[0, 1, 2, 3].map((idx) => (
                <View
                  key={idx}
                  style={{
                    flex: 1,
                    borderRadius: 3,
                    backgroundColor: getStrengthBarColor(idx),
                  }}
                />
              ))}
            </View>
            {strength.issues.length > 0 ? (
              <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                Missing: {strength.issues.join(", ")}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Confirm Password */}
      <View style={{ marginBottom: 18 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.ink, marginBottom: 6 }}>
          {t(language, "auth.confirmPassword")}
        </Text>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          style={{
            borderWidth: 1,
            borderColor: confirmPassword && confirmPassword !== password ? "#EF4444" : "#D1D5DB",
            borderRadius: 10,
            padding: 12,
            fontSize: 16,
            backgroundColor: "#fff",
          }}
        />
      </View>

      {/* Terms Consent Checkbox */}
      <TouchableOpacity
        onPress={() => setConsentTerms(!consentTerms)}
        style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 24 }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: consentTerms ? colors.sage : "#9CA3AF",
            backgroundColor: consentTerms ? colors.sage : "#fff",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
            marginTop: 2,
          }}
        >
          {consentTerms ? <Feather name="check" size={14} color="#fff" /> : null}
        </View>
        <Text style={{ flex: 1, fontSize: 13, color: colors.ink, lineHeight: 18 }}>
          {t(language, "auth.agreeToTerms")}
        </Text>
      </TouchableOpacity>

      {/* Register Submit */}
      <TouchableOpacity
        onPress={handleRegister}
        disabled={isLoading}
        style={{
          backgroundColor: colors.sage,
          padding: 16,
          borderRadius: 12,
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
            {t(language, "auth.signUp")}
          </Text>
        )}
      </TouchableOpacity>

      {/* Back to Login Link */}
      <TouchableOpacity
        onPress={() => router.replace("/auth/login" as any)}
        style={{ alignItems: "center", marginBottom: 30 }}
      >
        <Text style={{ color: "#666", fontSize: 15 }}>
          {t(language, "auth.alreadyHaveAccount")}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
