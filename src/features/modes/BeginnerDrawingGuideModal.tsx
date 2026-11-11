/**
 * ARTISTRY AI — Beginner Drawing Guide Modal
 * Comprehensive quick-reference handbook for beginners:
 * - Materials & Graphite Scale (9H to 9B)
 * - Holding the Pencil (Overhand vs. Tripod Grip)
 * - Line Confidence & Ghosting
 * - The 5-Value Form Shading Rule
 * - Andrew Loomis Head Quick Reference
 */

import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface BeginnerDrawingGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

const GUIDE_SECTIONS = [
  {
    id: "materials",
    icon: "✏️",
    title: "Graphite Grades & Paper",
    content: [
      { subtitle: "Hardness vs. Blackness", body: "Pencils marked 'H' have hard clay-rich graphite that makes faint, razor-sharp lines. Pencils marked 'B' have soft carbon-rich graphite that lays down deep, velvety blacks." },
      { subtitle: "The Golden Rule of Construction", body: "Always sketch your initial guidelines with a 2H or H pencil using light pressure. Save 2B, 4B, and 6B exclusively for core shadows and deep accents." },
      { subtitle: "Paper Tooth", body: "Hot press paper is ultra-smooth for botanical and technical rendering. Cold press paper has tooth that grabs graphite for rich values and charcoal blends." },
    ],
  },
  {
    id: "grip",
    icon: "✋",
    title: "Pencil Grip & Arm Movement",
    content: [
      { subtitle: "Overhand Grip", body: "Hold the pencil between your thumb and all four fingertips with the palm facing down. This uses the side of the lead and lets you move your whole arm from the shoulder." },
      { subtitle: "Move from the Shoulder", body: "Lock your wrist. Swing your arm from your shoulder joint to draw long, straight lines without wobble." },
      { subtitle: "Tripod Grip for Final Inking", body: "Only switch back to the handwriting tripod grip for minute eyelashes, pupils, or signatures." },
    ],
  },
  {
    id: "ghosting",
    icon: "〰️",
    title: "Line Ghosting & Confidence",
    content: [
      { subtitle: "Never Chicken-Scratch", body: "Repeated short, scratchy strokes make drawings look timid and messy. Commit to single, deliberate continuous lines." },
      { subtitle: "The Ghosting Rehearsal", body: "Hover your pencil 1 mm above the paper between point A and point B. Rehearse the stroke in the air 2 to 3 times before touching down." },
      { subtitle: "Speed Creates Straightness", body: "Do not steer the pencil slowly. Swift, confident motion produces straight, clean trajectories." },
    ],
  },
  {
    id: "shading",
    icon: "◑",
    title: "The 5-Value Form Shading Rule",
    content: [
      { subtitle: "The Terminator Boundary", body: "Light divides 3D objects into two worlds: the Light Side and the Shadow Side. The boundary where light rays can no longer touch the curvature is the Terminator." },
      { subtitle: "Reflected Light Rule", body: "Light bounces off the floor back into the shadow. Crucial rule: Reflected light is ALWAYS darker than the darkest halftone." },
      { subtitle: "5-Value Zones", body: "1) Highlight (pure white); 2) Halftone (local color); 3) Core Shadow (darkest band on form); 4) Reflected Light (ambient bounce); 5) Cast Shadow (ground occlusion)." },
    ],
  },
  {
    id: "loomis",
    icon: "👤",
    title: "Loomis Head Construction",
    content: [
      { subtitle: "Cranial Sphere", body: "The braincase is a solid ball. It never deforms or stretches." },
      { subtitle: "Flattened Temples", body: "Slice 2/3 of the height off each side of the sphere to form the flat temple disc where the ear attaches." },
      { subtitle: "Facial Thirds", body: "The human face divides into three equal spaces: Hairline to Brow = 1 Unit; Brow to Nose Base = 1 Unit; Nose Base to Chin = 1 Unit." },
      { subtitle: "Eye Level Midpoint", body: "The eyes sit on the exact vertical halfway line of the skull—not in the upper third." },
    ],
  },
];

export function BeginnerDrawingGuideModal({ visible, onClose }: BeginnerDrawingGuideModalProps) {
  const [activeSectionId, setActiveSectionId] = useState("materials");
  const activeSection = GUIDE_SECTIONS.find((s) => s.id === activeSectionId) ?? GUIDE_SECTIONS[0]!;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Beginner Drawing Guide</Text>
              <Text style={styles.subtitle}>Classical Studio Principles & Foundations</Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              accessibilityLabel="Close guide"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Section Navigation Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsContainer}
            contentContainerStyle={styles.tabsContent}
          >
            {GUIDE_SECTIONS.map((sec) => {
              const isActive = sec.id === activeSectionId;
              return (
                <Pressable
                  key={sec.id}
                  onPress={() => setActiveSectionId(sec.id)}
                  style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                >
                  <Text style={styles.tabIcon}>{sec.icon}</Text>
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {sec.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Section Body */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionHeaderCard}>
              <Text style={styles.sectionIconLarge}>{activeSection.icon}</Text>
              <Text style={styles.sectionTitleLarge}>{activeSection.title}</Text>
            </View>

            {activeSection.content.map((item, idx) => (
              <View key={idx} style={styles.guideCard}>
                <Text style={styles.guideCardSubtitle}>{item.subtitle}</Text>
                <Text style={styles.guideCardBody}>{item.body}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 13, 11, 0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#161B18",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#28342D",
    height: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#242E28",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F6F5EE",
  },
  subtitle: {
    fontSize: 12,
    color: "#8B988E",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#222B25",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    color: "#D4DDD6",
    fontSize: 13,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.8,
  },
  tabsContainer: {
    maxHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: "#222C26",
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1F2822",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#2B372F",
  },
  tabBtnActive: {
    backgroundColor: "#28594B",
    borderColor: "#3A7E6B",
  },
  tabIcon: {
    fontSize: 13,
  },
  tabLabel: {
    fontSize: 12,
    color: "#9EA9A1",
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
    paddingBottom: 40,
  },
  sectionHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1C2420",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#29362E",
  },
  sectionIconLarge: {
    fontSize: 26,
  },
  sectionTitleLarge: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F6F5EE",
  },
  guideCard: {
    backgroundColor: "#1F2722",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2B372F",
    gap: 6,
  },
  guideCardSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#D5A844",
  },
  guideCardBody: {
    fontSize: 13,
    color: "#D0DAD3",
    lineHeight: 19,
  },
});
