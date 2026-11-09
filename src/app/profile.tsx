import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuthStore } from "../state/authStore";
import { useAppStore } from "../state/appStore";
import { t } from "../i18n";
import { colors } from "../theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { language, setLanguage, experienceMode, setExperienceMode } = useAppStore();
  const { user, isAuthenticated, logout, updateProfile, exportData, deleteAccount, isLoading } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "Artist");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await exportData();
      Alert.alert(
        "Data Export Ready",
        "Your complete account export (profile, subscriptions, credit ledgers, and sync history) has been compiled per GDPR Article 20 data portability standards."
      );
    } catch (err: any) {
      Alert.alert("Export Failed", err.message || "Failed to export data.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account Permanently",
      "Are you sure you want to permanently delete your ARTISTRY AI account? All cloud sync data, AI credit balances, and subscription records will be purged immediately. Local offline drawings on this device will not be lost.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount({ confirmEmail: user?.email });
              Alert.alert("Account Purged", "Your personal account and cloud records have been permanently removed.");
              router.replace("/");
            } catch (err: any) {
              Alert.alert("Deletion Failed", err.message || "Could not delete account.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ displayName: displayName.trim() });
      setIsEditing(false);
      Alert.alert("Success", "Profile updated.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? Your offline drawings and projects will remain safely stored on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/");
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ padding: 20, paddingTop: 50, paddingBottom: 60 }}>
      {/* Top Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <Feather name="arrow-left" size={24} color={colors.ink} />
          <Text style={{ marginLeft: 8, fontSize: 16, color: colors.ink }}>
            {t(language, "navigation.back")}
          </Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.ink }}>
          {t(language, "auth.profile")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Guest Mode Card */}
      {!isAuthenticated || !user ? (
        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center" }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <Feather name="user" size={32} color="#9CA3AF" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.ink, marginBottom: 4 }}>
            {t(language, "auth.guestUser")}
          </Text>
          <Text style={{ fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20 }}>
            {t(language, "auth.loginToSync")}
          </Text>
          <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
            <TouchableOpacity
              onPress={() => router.push("/auth/login" as any)}
              style={{
                flex: 1,
                backgroundColor: colors.sage,
                padding: 14,
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                {t(language, "auth.signIn")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/auth/register" as any)}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.sage,
                padding: 14,
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.sage, fontWeight: "700", fontSize: 15 }}>
                {t(language, "auth.signUp")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Authenticated User Profile Card */
        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: "#E5E7EB" }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.sage, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
              <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold" }}>
                {user.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              {isEditing ? (
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  style={{ borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 8, fontSize: 16, marginBottom: 4 }}
                />
              ) : (
                <Text style={{ fontSize: 19, fontWeight: "700", color: colors.ink }}>
                  {user.displayName}
                </Text>
              )}
              <Text style={{ fontSize: 14, color: "#666" }}>{user.email}</Text>
            </View>
            <TouchableOpacity
              onPress={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
              style={{ padding: 8 }}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.sage} />
              ) : (
                <Feather name={isEditing ? "check" : "edit-2"} size={18} color={colors.sage} />
              )}
            </TouchableOpacity>
          </View>

          {/* Subscription & Credit Pills */}
          <View style={{ flexDirection: "row", gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F3F4F6" }}>
            <TouchableOpacity
              onPress={() => router.push("/subscription" as any)}
              style={{ flex: 1, backgroundColor: "#F9FAFB", padding: 12, borderRadius: 10, alignItems: "center" }}
            >
              <Text style={{ fontSize: 12, color: "#666", marginBottom: 2 }}>
                {t(language, "auth.subscription")}
              </Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.copper, textTransform: "uppercase" }}>
                {user.subscriptionTier || "FREE"} ›
              </Text>
            </TouchableOpacity>
            <View style={{ flex: 1, backgroundColor: "#F9FAFB", padding: 12, borderRadius: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: "#666", marginBottom: 2 }}>
                {t(language, "auth.credits")}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.sage }}>
                {user.creditBalance ?? 50}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* App Preferences Section */}
      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.ink, marginBottom: 12, marginLeft: 4 }}>
        Studio Preferences
      </Text>

      <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: "#E5E7EB" }}>
        {/* Language selector */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 }}>
          <Text style={{ fontSize: 15, color: colors.ink, fontWeight: "600" }}>Language</Text>
          <View style={{ flexDirection: "row", backgroundColor: "#F3F4F6", borderRadius: 8, padding: 2 }}>
            <TouchableOpacity
              onPress={() => setLanguage("en")}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: language === "en" ? colors.sage : "transparent",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: language === "en" ? "#fff" : colors.ink }}>
                EN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLanguage("ta")}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: language === "ta" ? colors.sage : "transparent",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: language === "ta" ? "#fff" : colors.ink }}>
                தமிழ்
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Experience mode */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#F3F4F6" }}>
          <Text style={{ fontSize: 15, color: colors.ink, fontWeight: "600" }}>Mode</Text>
          <View style={{ flexDirection: "row", backgroundColor: "#F3F4F6", borderRadius: 8, padding: 2 }}>
            <TouchableOpacity
              onPress={() => setExperienceMode("beginner")}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: experienceMode === "beginner" ? colors.sage : "transparent",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: experienceMode === "beginner" ? "#fff" : colors.ink }}>
                Beginner
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setExperienceMode("professional")}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: experienceMode === "professional" ? colors.sage : "transparent",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: experienceMode === "professional" ? "#fff" : colors.ink }}>
                Pro
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Account Actions & Privacy (When Logged In) */}
      {isAuthenticated ? (
        <>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.ink, marginBottom: 12, marginLeft: 4 }}>
            Privacy & Data Rights
          </Text>

          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 8, marginBottom: 24, borderWidth: 1, borderColor: "#E5E7EB" }}>
            <TouchableOpacity
              onPress={handleExportData}
              disabled={exporting}
              style={{ flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}
            >
              {exporting ? (
                <ActivityIndicator size="small" color={colors.sage} style={{ marginRight: 12 }} />
              ) : (
                <Feather name="download" size={20} color={colors.sage} style={{ marginRight: 12 }} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.ink }}>
                  Export My Personal Data
                </Text>
                <Text style={{ fontSize: 12, color: "#666" }}>
                  GDPR Article 20 data portability JSON bundle
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteAccount}
              disabled={deleting}
              style={{ flexDirection: "row", alignItems: "center", padding: 14 }}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#E02424" style={{ marginRight: 12 }} />
              ) : (
                <Feather name="trash-2" size={20} color="#E02424" style={{ marginRight: 12 }} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#E02424" }}>
                  Delete Account & Data
                </Text>
                <Text style={{ fontSize: 12, color: "#999" }}>
                  Permanent cloud erasure (Right to be Forgotten)
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 8, marginBottom: 24, borderWidth: 1, borderColor: "#E5E7EB" }}>
            <TouchableOpacity
              onPress={handleLogout}
              style={{ flexDirection: "row", alignItems: "center", padding: 14 }}
            >
              <Feather name="log-out" size={20} color="#666" style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#666" }}>
                {t(language, "auth.signOut")}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}
