export const FEATURE_CREDIT_COSTS: Record<string, number> = {
  // Free / Classical tools (always 0 credits)
  canvas: 0,
  loomis: 0,
  perspective: 0,
  shading: 0,
  reference_library: 0,
  stroke_replay: 0,

  // AI & CV tools
  drawing_analysis: 5,
  sketch_conversion: 3,
  reference_generation: 10,
  turnaround_creator: 15,
  art_mentor: 2,
  pose_coach: 2,
  hand_foot: 2,
  lighting_predictor: 2,
  composition_coach: 2,
  line_cleaner: 3,
  smart_segmentation: 4,
  color_recommender: 2,
  vectorizer: 3,
  mistake_detector: 3,
};

export function getFeatureCost(featureKey: string): number {
  return FEATURE_CREDIT_COSTS[featureKey] ?? 1;
}
