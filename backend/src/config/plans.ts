export type SubscriptionTier = "free" | "pro" | "premium";
export type BillingCycle = "monthly" | "yearly";

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  includedIn: SubscriptionTier[];
}

export interface PlanConfig {
  tier: SubscriptionTier;
  name: string;
  tagline: string;
  monthlyCredits: number;
  maxCloudStorageMb: number;
  monthlyProductId: string;
  yearlyProductId: string;
  pricing: {
    monthlyUsd: number;
    yearlyUsd: number;
    monthlyInr: number;
    yearlyInr: number;
  };
  features: string[];
  priorityProcessing: boolean;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, PlanConfig> = {
  free: {
    tier: "free",
    name: "Free Artist",
    tagline: "Essential classical drawing studio with on-device AI",
    monthlyCredits: 50,
    maxCloudStorageMb: 25,
    monthlyProductId: "artistry_free",
    yearlyProductId: "artistry_free",
    pricing: {
      monthlyUsd: 0,
      yearlyUsd: 0,
      monthlyInr: 0,
      yearlyInr: 0,
    },
    features: [
      "Core Skia drawing canvas (100% offline)",
      "All 4 brush types (Pencil, Ink Pen, Brush, Eraser)",
      "8-stage Loomis head construction",
      "Perspective vanishing point assistant",
      "5-value shading studio",
      "50 monthly cloud AI credits",
      "Offline reference library",
    ],
    priorityProcessing: false,
  },
  pro: {
    tier: "pro",
    name: "Pro Illustrator",
    tagline: "Advanced AI drawing intelligence and anatomical coaching",
    monthlyCredits: 500,
    maxCloudStorageMb: 250,
    monthlyProductId: "artistry_pro_monthly",
    yearlyProductId: "artistry_pro_yearly",
    pricing: {
      monthlyUsd: 9.99,
      yearlyUsd: 95.88, // ~20% discount
      monthlyInr: 499,
      yearlyInr: 4790,
    },
    features: [
      "Everything in Free Plan",
      "500 monthly cloud AI credits",
      "AI Drawing Analyzer with multi-factor rubrics",
      "Photographic Sketch Converter with paper textures",
      "Pose & Gesture Coach with 33 landmarks",
      "Hand & Foot anatomical assistant",
      "Cloud project backup and progress sync",
      "High-resolution vector SVG export",
    ],
    priorityProcessing: false,
  },
  premium: {
    tier: "premium",
    name: "Studio Master",
    tagline: "Full access to all AI mentor dialogues, turnarounds and diffusion reference synthesis",
    monthlyCredits: 2000,
    maxCloudStorageMb: 2048,
    monthlyProductId: "artistry_premium_monthly",
    yearlyProductId: "artistry_premium_yearly",
    pricing: {
      monthlyUsd: 19.99,
      yearlyUsd: 191.88, // ~20% discount
      monthlyInr: 999,
      yearlyInr: 9590,
    },
    features: [
      "Everything in Pro Plan",
      "2,000 monthly cloud AI credits",
      "Unlimited AI Art Mentor conversational sessions",
      "Generative diffusion reference synthesis",
      "4-view 3D character turnaround sheet generator",
      "AI Mistake Detector with cranium & eye-drift alerts",
      "2 GB secure cloud storage for artworks",
      "Priority GPU job processing",
    ],
    priorityProcessing: true,
  },
};

/**
 * Feature gate mapping specifying minimum tier required
 */
export const FEATURE_ENTITLEMENT_GATES: Record<string, SubscriptionTier> = {
  // Free tier features
  canvas: "free",
  loomis: "free",
  perspective: "free",
  shading: "free",
  reference_library: "free",
  stroke_replay: "free",

  // Pro tier features
  drawing_analysis: "pro",
  sketch_conversion: "pro",
  pose_coach: "pro",
  hand_foot: "pro",
  line_cleaner: "pro",
  color_recommender: "pro",
  vectorizer: "pro",
  cloud_sync: "pro",

  // Premium tier features
  art_mentor: "premium",
  reference_generation: "premium",
  turnaround_creator: "premium",
  mistake_detector: "premium",
  smart_segmentation: "premium",
  lighting_predictor: "premium",
};
