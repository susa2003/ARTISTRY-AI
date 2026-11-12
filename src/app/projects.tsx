import { useEffect, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { AppHeader, Button, Eyebrow, InfoCard, Screen, useResponsiveLayout } from "../components/AppUI";
import { useAppStore } from "../state/appStore";
import { colors } from "../theme";

export default function ProjectsScreen() {
  const layout = useResponsiveLayout();
  const projects = useAppStore((state) => state.projects);
  const refresh = useAppStore((state) => state.refreshProjects);
  const createProject = useAppStore((state) => state.createProject);
  const openProject = useAppStore((state) => state.openProject);
  const renameProject = useAppStore((state) => state.renameProject);
  const deleteProject = useAppStore((state) => state.deleteProject);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => { void refresh(); }, [refresh]);

  const [busy, setBusy] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const newFreeDrawing = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const id = await createProject(null, "Blank Free Drawing");
      router.push(`/studio/${id}`);
    } catch {
      Alert.alert("Creation Error", "Could not create new drawing.");
    } finally {
      setBusy(false);
    }
  };

  const newReferenceStudy = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const id = await createProject(null, "New Reference Study");
      router.push(`/reference-studio/${id}`);
    } catch {
      Alert.alert("Creation Error", "Could not create reference study.");
    } finally {
      setBusy(false);
    }
  };

  const handleOpenProject = async (project: { id: string; referenceUri?: string | null }, target?: "reference-studio" | "studio") => {
    if (busy) return;
    setBusy(true);
    try {
      await openProject(project.id);
      const destination = target
        ? `/${target}/${project.id}`
        : project.referenceUri
        ? `/reference-studio/${project.id}`
        : `/studio/${project.id}`;
      router.push(destination as any);
    } catch {
      Alert.alert("Project Error", "Could not open this project.");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = (id: string, title: string) => Alert.alert("Delete this local project?", `“${title}” will be removed from this device.`, [
    { text: "Keep project", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: () => void deleteProject(id) },
  ]);

  return (
    <Screen>
      <View style={{ maxWidth: typeof layout.contentMaxWidth === "number" ? layout.contentMaxWidth : "100%", alignSelf: "center", width: "100%" }}>
        <AppHeader title="Your projects" onBack={handleBack} />
        <Eyebrow>KEPT ON THIS DEVICE</Eyebrow>
        <View style={[styles.headingRow, layout.isSmallPhone && { flexDirection: "column", alignItems: "stretch" }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>A place for every study.</Text>
            <Text style={styles.copy}>Projects save automatically and work without an account or an internet connection.</Text>
          </View>
          <View style={[styles.newButtonsRow, layout.isSmallPhone && { flexDirection: "column" }]}>
            <Button title="New Drawing" icon="✎" onPress={() => void newFreeDrawing()} style={styles.newBtn} />
            <Button title="Reference Study" icon="📐" tone="soft" onPress={() => void newReferenceStudy()} style={styles.newBtn} />
          </View>
        </View>

        {projects.length === 0 ? (
          <InfoCard style={styles.emptyCard}>
            <Text style={styles.emptyMark}>✎</Text>
            <Text style={styles.emptyTitle}>No projects yet</Text>
            <Text style={styles.copy}>Start on a blank canvas or reference study whenever you’re ready.</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <Button title="Free Drawing" icon="✎" onPress={() => void newFreeDrawing()} />
              <Button title="Reference Study" icon="📐" tone="soft" onPress={() => void newReferenceStudy()} />
            </View>
          </InfoCard>
        ) : (
          <View style={styles.list}>
            {projects.map((project) => (
              <InfoCard key={project.id} style={styles.projectCard}>
                <Pressable
                  onPress={() => void handleOpenProject(project)}
                  style={styles.projectMain}
                >
                  {project.referenceUri ? (
                    <Image source={{ uri: project.referenceUri }} style={styles.projectThumb} />
                  ) : (
                    <View style={styles.blankThumb}>
                      <Text style={styles.thumbMark}>✎</Text>
                    </View>
                  )}
                  <View style={styles.projectText}>
                    {renaming === project.id ? (
                      <TextInput
                        autoFocus
                        value={name}
                        onChangeText={setName}
                        onSubmitEditing={() => {
                          void renameProject(project.id, name);
                          setRenaming(null);
                        }}
                        style={styles.nameInput}
                        returnKeyType="done"
                      />
                    ) : (
                      <Text numberOfLines={1} style={styles.projectName}>
                        {project.name}
                      </Text>
                    )}
                    <Text style={styles.projectMeta}>
                      {project.width} × {project.height} · Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </Text>
                    <View style={styles.tagRow}>
                      <Text style={styles.localTag}>● LOCAL PROJECT</Text>
                      <Text style={styles.workspaceTag}>
                        {project.referenceUri ? "📐 Reference Study" : "🎨 Free Drawing"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.openArrow}>›</Text>
                </Pressable>

                <View style={styles.projectActions}>
                  <View style={styles.openPills}>
                    <Pressable
                      onPress={() => void handleOpenProject(project, "studio")}
                      style={styles.openPill}
                      accessibilityLabel="Open in Free Drawing Studio"
                    >
                      <Text style={styles.openPillText}>🎨 Drawing</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void handleOpenProject(project, "reference-studio")}
                      style={styles.openPill}
                      accessibilityLabel="Open in Reference Studio"
                    >
                      <Text style={styles.openPillText}>📐 Reference</Text>
                    </Pressable>
                  </View>

                  <View style={styles.manageRow}>
                    {renaming === project.id ? (
                      <Pressable
                        onPress={() => {
                          void renameProject(project.id, name);
                          setRenaming(null);
                        }}
                        style={styles.actionBtn}
                      >
                        <Text style={styles.actionText}>Save name</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => {
                          setName(project.name);
                          setRenaming(project.id);
                        }}
                        style={styles.actionBtn}
                      >
                        <Text style={styles.actionText}>Rename</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => confirmDelete(project.id, project.name)}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.deleteText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              </InfoCard>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headingRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 19 },
  title: { color: colors.ink, fontFamily: "Georgia", fontSize: 29, lineHeight: 35 },
  copy: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 7, maxWidth: 540 },
  newButtonsRow: { flexDirection: "row", gap: 8 },
  newBtn: { minHeight: 40 },
  emptyCard: { paddingVertical: 30, alignItems: "center" },
  emptyMark: { fontSize: 30, color: colors.moss, marginBottom: 10 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: "700" },
  list: { gap: 12 },
  projectCard: { padding: 12 },
  projectMain: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 12 },
  projectThumb: { width: 62, height: 70, borderRadius: 13, backgroundColor: "#EEECE4" },
  blankThumb: { width: 62, height: 70, borderRadius: 13, backgroundColor: "#E6EADF", alignItems: "center", justifyContent: "center" },
  thumbMark: { color: colors.moss, fontSize: 23 },
  projectText: { flex: 1 },
  projectName: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  projectMeta: { color: colors.muted, fontSize: 10, marginTop: 4 },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  localTag: { color: colors.moss, fontWeight: "800", letterSpacing: 0.8, fontSize: 8 },
  workspaceTag: { color: "#688072", fontSize: 9, fontWeight: "600" },
  openArrow: { color: colors.clay, fontSize: 25, paddingHorizontal: 4 },
  projectActions: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: 10,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  openPills: { flexDirection: "row", gap: 6 },
  openPill: {
    backgroundColor: "#E7ECE2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minHeight: 32,
    justifyContent: "center",
  },
  openPillText: { fontSize: 10, fontWeight: "700", color: colors.moss },
  manageRow: { flexDirection: "row", gap: 16, alignItems: "center" },
  actionBtn: { minHeight: 32, justifyContent: "center" },
  actionText: { fontSize: 12, fontWeight: "700", color: colors.moss },
  deleteText: { fontSize: 12, fontWeight: "700", color: colors.danger },
  nameInput: { borderBottomWidth: 1, borderColor: colors.moss, paddingVertical: 3, color: colors.ink, fontWeight: "700" },
});
