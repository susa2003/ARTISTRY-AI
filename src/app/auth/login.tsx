import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuthStore } from "../../state/authStore";
import { useAppStore } from "../../state/appStore";
import { t } from "../../i18n";
import { colors } from "../../theme";

export default function LoginScreen() {
  const router = useRouter();
  const language = useAppStore((state) => state.language);
  const { login, loginWithGoogle, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    try {
      clearError();
      await login(email, password);
      router.replace("/");
    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "Invalid credentials.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      clearError();
      // For demonstration / dev verification, sends verified test token
      await loginWithGoogle("test_google_token_artist_user");
      router.replace("/");
    } catch (err: any) {
      Alert.alert("Google Sign-In Failed", err.message);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}
      >
        <Feather name="arrow-left" size={24} color={colors.ink} />
        <Text style={{ marginLeft: 8, fontSize: 16, color: colors.ink }}>
          {t(language, "navigation.back")}
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 32, fontWeight: "800", color: colors.ink, marginBottom: 8 }}>
        {t(language, "auth.signIn")}
      </Text>
      <Text style={{ fontSize: 15, color: "#666", marginBottom: 32 }}>
        {t(language, "auth.loginToSync")}
      </Text>

      {error ? (
        <View style={{ backgroundColor: "#FDE8E8", padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ color: "#E02424", fontSize: 14 }}>{error}</Text>
        </View>
      ) : null}

      {/* Email input */}
      <View style={{ marginBottom: 16 }}>
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

      {/* Password input */}
      <View style={{ marginBottom: 16 }}>
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
            style={{ flex: 1, padding: 14, fontSize: 16 }}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 14 }}>
            <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Forgot Password */}
      <TouchableOpacity
        onPress={() => router.push("/auth/forgot-password" as any)}
        style={{ alignSelf: "flex-end", marginBottom: 24 }}
      >
        <Text style={{ color: colors.copper, fontSize: 14, fontWeight: "600" }}>
          {t(language, "auth.forgotPassword")}
        </Text>
      </TouchableOpacity>

      {/* Submit button */}
      <TouchableOpacity
        onPress={handleLogin}
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
            {t(language, "auth.signIn")}
          </Text>
        )}
      </TouchableOpacity>

      {/* Google Sign In */}
      <TouchableOpacity
        onPress={handleGoogleLogin}
        style={{
          flexDirection: "row",
          borderWidth: 1,
          borderColor: "#D1D5DB",
          backgroundColor: "#fff",
          padding: 14,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 32,
        }}
      >
        <Feather name="globe" size={20} color="#4285F4" style={{ marginRight: 10 }} />
        <Text style={{ color: colors.ink, fontSize: 15, fontWeight: "600" }}>
          {t(language, "auth.googleSignIn")}
        </Text>
      </TouchableOpacity>

      {/* Sign Up Link */}
      <TouchableOpacity
        onPress={() => router.push("/auth/register" as any)}
        style={{ alignItems: "center" }}
      >
        <Text style={{ color: "#666", fontSize: 15 }}>
          {t(language, "auth.dontHaveAccount")}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
