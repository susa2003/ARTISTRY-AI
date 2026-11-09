import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuthStore } from "../state/authStore";
import { useAppStore } from "../state/appStore";
import { t } from "../i18n";
import { colors } from "../theme";

interface PlanItem {
  tier: "free" | "pro" | "premium";
  name: string;
  tagline: string;
  monthlyCredits: number;
  pricing: {
    monthlyUsd: number;
    yearlyUsd: number;
  };
  features: string[];
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const language = useAppStore((state) => state.language);
  const { user, isAuthenticated } = useAuthStore();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_AI_API_URL || "http://localhost:4000/api/v1";
      const res = await fetch(`${baseUrl}/subscriptions/plans`);
      const data = await res.json();
      if (data.success && data.data?.plans) {
        setPlans(data.data.plans);
      }
    } catch {
      // Fallback local plans if offline
      setPlans([
        {
          tier: "free",
          name: "Free Artist",
          tagline: "Essential classical drawing studio with on-device AI",
          monthlyCredits: 50,
          pricing: { monthlyUsd: 0, yearlyUsd: 0 },
          features: [
            "Core Skia drawing canvas (100% offline)",
            "All 4 brush types",
            "8-stage Loomis head studio",
            "Perspective assistant",
            "5-value shading studio",
            "50 monthly AI credits",
          ],
        },
        {
          tier: "pro",
          name: "Pro Illustrator",
          tagline: "Advanced AI drawing intelligence and anatomical coaching",
          monthlyCredits: 500,
          pricing: { monthlyUsd: 9.99, yearlyUsd: 95.88 },
          features: [
            "Everything in Free Plan",
            "500 monthly AI credits",
            "AI Drawing Analyzer with multi-factor rubrics",
            "Photographic Sketch Converter with paper textures",
            "Pose & Gesture Coach (33 landmarks)",
            "Hand & Foot assistant",
            "Cloud project backup & sync",
          ],
        },
        {
          tier: "premium",
          name: "Studio Master",
          tagline: "Full access to conversational AI mentor and diffusion reference generator",
          monthlyCredits: 2000,
          pricing: { monthlyUsd: 19.99, yearlyUsd: 191.88 },
          features: [
            "Everything in Pro Plan",
            "2,000 monthly AI credits",
            "Unlimited AI Art Mentor conversational sessions",
            "Generative diffusion reference synthesis",
            "4-view 3D turnaround character sheet generator",
            "AI Mistake Detector with cranium drift alerts",
            "Priority GPU processing",
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: PlanItem) => {
    if (plan.tier === "free") return;

    if (!isAuthenticated) {
      Alert.alert(
        "Sign In Required",
        "Please create or sign in to your ARTISTRY AI account before subscribing.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => router.push("/auth/login" as any) },
        ]
      );
      return;
    }

    setPurchasing(true);
    // Prepared for native Google Play Billing purchase invocation
    Alert.alert(
      "Google Play Billing",
      `Initiating Google Play purchase for ${plan.name} (${billingCycle === "yearly" ? `$${plan.pricing.yearlyUsd}/year` : `$${plan.pricing.monthlyUsd}/month`}).\n\nNote: Requires Google Play Developer API production credentials to cryptographically verify receipt.`,
      [{ text: "OK", onPress: () => setPurchasing(false) }]
    );
  };

  const handleRestorePurchases = async () => {
    if (!isAuthenticated) {
      Alert.alert("Sign In Required", "Please sign in to restore purchases.");
      return;
    }
    setPurchasing(true);
    try {
      const baseUrl = process.env.EXPO_PUBLIC_AI_API_URL || "http://localhost:4000/api/v1";
      const token = useAuthStore.getState().tokens?.accessToken;
      const res = await fetch(`${baseUrl}/subscriptions/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert("Purchases Restored", `Active plan: ${data.data.tier.toUpperCase()}`);
      } else {
        Alert.alert("Restore Completed", "No active previous subscriptions found.");
      }
    } catch {
      Alert.alert("Offline", "Unable to verify purchases while offline.");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ padding: 20, paddingTop: 50, paddingBottom: 60 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
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
          {t(language, "auth.subscription")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={{ fontSize: 26, fontWeight: "800", color: colors.ink, textAlign: "center", marginBottom: 6 }}>
        Upgrade Your Studio
      </Text>
      <Text style={{ fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20 }}>
        Unlock advanced AI drawing intelligence, full pedagogical mentor sessions, and high-volume cloud generation.
      </Text>

      {/* Billing Cycle Switcher */}
      <View style={{ flexDirection: "row", backgroundColor: "#E5E7EB", borderRadius: 12, padding: 4, alignSelf: "center", marginBottom: 24 }}>
        <TouchableOpacity
          onPress={() => setBillingCycle("monthly")}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: billingCycle === "monthly" ? "#fff" : "transparent",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink }}>Monthly</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setBillingCycle("yearly")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: billingCycle === "yearly" ? "#fff" : "transparent",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink, marginRight: 6 }}>
            Yearly
          </Text>
          <View style={{ backgroundColor: "#D1FAE5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: "#065F46" }}>SAVE 20%</Text>
          </View>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.sage} style={{ marginVertical: 40 }} />
      ) : (
        <View style={{ gap: 16, marginBottom: 24 }}>
          {plans.map((p) => {
            const isCurrent = user?.subscriptionTier === p.tier || (!user && p.tier === "free");
            const price = billingCycle === "yearly" ? `$${p.pricing.yearlyUsd}/yr` : `$${p.pricing.monthlyUsd}/mo`;

            return (
              <View
                key={p.tier}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: p.tier === "premium" ? 2 : 1,
                  borderColor: p.tier === "premium" ? colors.copper : "#E5E7EB",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <View>
                    <Text style={{ fontSize: 20, fontWeight: "800", color: colors.ink }}>{p.name}</Text>
                    <Text style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{p.tagline}</Text>
                  </View>
                  {isCurrent ? (
                    <View style={{ backgroundColor: "#D1FAE5", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: "800", color: "#065F46" }}>CURRENT</Text>
                    </View>
                  ) : null}
                </View>

                {/* Price Display */}
                <View style={{ flexDirection: "row", alignItems: "baseline", marginVertical: 12 }}>
                  <Text style={{ fontSize: 32, fontWeight: "800", color: colors.ink }}>
                    {p.tier === "free" ? "$0" : price}
                  </Text>
                  {p.tier !== "free" && billingCycle === "yearly" ? (
                    <Text style={{ fontSize: 13, color: "#666", marginLeft: 8 }}>
                      (${((p.pricing.yearlyUsd / 12)).toFixed(2)}/mo billed annually)
                    </Text>
                  ) : null}
                </View>

                {/* Credits badge */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                  <Feather name="zap" size={16} color={colors.sage} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.sage }}>
                    {p.monthlyCredits} monthly AI credits included
                  </Text>
                </View>

                {/* Features List */}
                <View style={{ gap: 8, marginBottom: 18, borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 12 }}>
                  {p.features.map((feat, idx) => (
                    <View key={idx} style={{ flexDirection: "row", alignItems: "center" }}>
                      <Feather name="check" size={16} color={colors.sage} style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 13, color: colors.ink, flex: 1 }}>{feat}</Text>
                    </View>
                  ))}
                </View>

                {/* Select / CTA Button */}
                <TouchableOpacity
                  onPress={() => handleSelectPlan(p)}
                  disabled={isCurrent || purchasing}
                  style={{
                    backgroundColor: isCurrent ? "#F3F4F6" : p.tier === "premium" ? colors.copper : colors.sage,
                    padding: 14,
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: isCurrent ? "#9CA3AF" : "#fff",
                    }}
                  >
                    {isCurrent ? "Current Plan" : `Choose ${p.name}`}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Restore Purchases */}
      <TouchableOpacity
        onPress={handleRestorePurchases}
        style={{ alignSelf: "center", padding: 12, marginBottom: 16 }}
      >
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.sage }}>
          Restore Previous Purchases
        </Text>
      </TouchableOpacity>

      {/* Offline Guarantee Disclaimer */}
      <View style={{ backgroundColor: "#F9FAFB", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB" }}>
        <Text style={{ fontSize: 12, color: "#666", lineHeight: 18, textAlign: "center" }}>
          <Text style={{ fontWeight: "700" }}>Offline Freedom Promise:</Text> The core drawing canvas, 4 brush tools, 8-stage Loomis head guides, perspective vanishing points, and local projects will remain 100% free and functional without internet access forever.
        </Text>
      </View>
    </ScrollView>
  );
}
