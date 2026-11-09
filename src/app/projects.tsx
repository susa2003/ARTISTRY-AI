import { useEffect, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { AppHeader, Button, Eyebrow, InfoCard, Screen } from "../components/AppUI";
import { useAppStore } from "../state/appStore";
import { colors } from "../theme";

export default function ProjectsScreen() {
  const projects = useAppStore((state) => state.projects);
  const refresh = useAppStore((state) => state.refreshProjects);
  const createProject = useAppStore((state) => state.createProject);
  const openProject = useAppStore((state) => state.openProject);
  const renameProject = useAppStore((state) => state.renameProject);
  const deleteProject = useAppStore((state) => state.deleteProject);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => { void refresh(); }, [refresh]);
  const newDrawing = async () => {
    const id = await createProject(null);
    router.push(`/studio/${id}`);
  };
  const confirmDelete = (id: string, title: string) => Alert.alert("Delete this local project?", `“${title}” will be removed from this device.`, [
    { text: "Keep project", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: () => void deleteProject(id) },
  ]);

  return (
    <Screen>
      <AppHeader title="Your projects" onBack={() => router.back()} />
      <Eyebrow>KEPT ON THIS DEVICE</Eyebrow>
      <View style={styles.headingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>A place for every study.</Text>
          <Text style={styles.copy}>Projects save automatically and work without an account or an internet connection.</Text>
        </View>
        <Button title="New drawing" icon="＋" onPress={() => void newDrawing()} />
      </View>
      {projects.length === 0 ? (
        <InfoCard style={styles.emptyCard}>
          <Text style={styles.emptyMark}>✎</Text>
          <Text style={styles.emptyTitle}>No projects yet</Text>
          <Text style={styles.copy}>Start on a blank canvas whenever you’re ready.</Text>
          <Button title="Create a drawing" onPress={() => void newDrawing()} style={{ marginTop: 14 }} />
        </InfoCard>
      ) : <View style={styles.list}>
        {projects.map((project) => (
          <InfoCard key={project.id} style={styles.projectCard}>
            <Pressable onPress={async () => { await openProject(project.id); router.push(`/studio/${project.id}`); }} style={styles.projectMain}>
              {project.referenceUri ? <Image source={{ uri: project.referenceUri }} style={styles.projectThumb} /> : <View style={styles.blankThumb}><Text style={styles.thumbMark}>✎</Text></View>}
              <View style={styles.projectText}>
                {renaming === project.id ? <TextInput autoFocus value={name} onChangeText={setName} onSubmitEditing={() => { void renameProject(project.id, name); setRenaming(null); }} style={styles.nameInput} returnKeyType="done" /> : <Text numberOfLines={1} style={styles.projectName}>{project.name}</Text>}
                <Text style={styles.projectMeta}>{project.width} × {project.height} · Updated {new Date(project.updatedAt).toLocaleDateString()}</Text>
                <Text style={styles.localTag}>● LOCAL PROJECT</Text>
              </View>
              <Text style={styles.openArrow}>›</Text>
            </Pressable>
            <View style={styles.projectActions}>
              {renaming === project.id ? <Pressable onPress={() => { void renameProject(project.id, name); setRenaming(null); }}><Text style={styles.actionText}>Save name</Text></Pressable> : <Pressable onPress={() => { setName(project.name); setRenaming(project.id); }}><Text style={styles.actionText}>Rename</Text></Pressable>}
              <Pressable onPress={() => confirmDelete(project.id, project.name)}><Text style={styles.deleteText}>Delete</Text></Pressable>
            </View>
          </InfoCard>
        ))}
      </View>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headingRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 19 },
  title: { color: colors.ink, fontFamily: "Georgia", fontSize: 29, lineHeight: 35 },
  copy: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 7, maxWidth: 540 },
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
  localTag: { color: colors.moss, fontWeight: "800", letterSpacing: 1, fontSize: 8, marginTop: 6 },
  openArrow: { color: colors.clay, fontSize: 25, paddingHorizontal: 4 },
  projectActions: { borderTopWidth: 1, borderTopColor: colors.line, marginTop: 10, paddingTop: 10, flexDirection: "row", justifyContent: "flex-end", gap: 23 },
  actionText: { fontSize: 12, fontWeight: "700", color: colors.moss },
  deleteText: { fontSize: 12, fontWeight: "700", color: colors.danger },
  nameInput: { borderBottomWidth: 1, borderColor: colors.moss, paddingVertical: 3, color: colors.ink, fontWeight: "700" },
});
