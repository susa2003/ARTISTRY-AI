import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { Image as NativeImage } from "react-native";
import type { LocalReference } from "../domain/types";

const referenceDirectory = `${FileSystem.documentDirectory}references/`;
const projectDirectory = `${FileSystem.documentDirectory}projects/`;

export function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function ensureDirectory(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) await FileSystem.makeDirectoryAsync(path, { intermediates: true });
}

function extension(name: string, uri: string) {
  const candidate = `${name} ${uri}`.match(/\.(jpe?g|png|webp)(?:[?#]|$)/i)?.[1]?.toLowerCase();
  return candidate === "jpeg" ? "jpg" : candidate ?? "jpg";
}

export function getImageDimensions(uri: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    NativeImage.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

export async function cacheSelectedImage(uri: string, name: string, dimensions?: { width: number; height: number }) {
  await ensureDirectory(referenceDirectory);
  const id = createId();
  const fileExt = extension(name, uri);
  const originalUri = `${referenceDirectory}${id}-original.${fileExt}`;
  const uriCopy = `${referenceDirectory}${id}-working.${fileExt}`;
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    await FileSystem.downloadAsync(uri, originalUri);
  } else {
    await FileSystem.copyAsync({ from: uri, to: originalUri });
  }
  await FileSystem.copyAsync({ from: originalUri, to: uriCopy });
  const rawSize = dimensions?.width && dimensions.height ? dimensions : await getImageDimensions(uriCopy);
  let finalWidth = rawSize.width;
  let finalHeight = rawSize.height;

  // Constrain texture bounds for hardware acceleration stability & memory protection (max 2048px)
  const MAX_WORKING_DIM = 2048;
  if (rawSize.width > MAX_WORKING_DIM || rawSize.height > MAX_WORKING_DIM) {
    try {
      const scale = Math.min(MAX_WORKING_DIM / rawSize.width, MAX_WORKING_DIM / rawSize.height);
      const targetWidth = Math.round(rawSize.width * scale);
      const resized = await ImageManipulator.manipulateAsync(
        uriCopy,
        [{ resize: { width: targetWidth } }],
        { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
      );
      await FileSystem.copyAsync({ from: resized.uri, to: uriCopy });
      const newSize = await getImageDimensions(uriCopy);
      finalWidth = newSize.width;
      finalHeight = newSize.height;
    } catch {
      // Fallback to unresized copy if manipulator fails
    }
  }

  const reference: LocalReference = {
    id, name: name || `Reference.${fileExt}`, uri: uriCopy, originalUri,
    width: finalWidth, height: finalHeight, isEdited: false, updatedAt: Date.now(),
  };
  return reference;
}

async function persistManipulated(reference: LocalReference, actions: ImageManipulator.Action[]) {
  await ensureDirectory(referenceDirectory);
  const result = await ImageManipulator.manipulateAsync(reference.uri, actions, {
    compress: 0.96,
    format: ImageManipulator.SaveFormat.PNG,
  });
  const uri = `${referenceDirectory}${reference.id}-edit-${Date.now()}.png`;
  await FileSystem.copyAsync({ from: result.uri, to: uri });
  return {
    ...reference, uri, ...await getImageDimensions(uri), isEdited: true, updatedAt: Date.now(),
  } satisfies LocalReference;
}

export type ReferenceEdit =
  | { kind: "rotate"; degrees: 90 | -90 }
  | { kind: "crop"; leftPercent: number; topPercent: number; widthPercent: number; heightPercent: number }
  | { kind: "resize"; width: number; height: number };

export async function editWorkingCopy(reference: LocalReference, edit: ReferenceEdit) {
  if (edit.kind === "rotate") return persistManipulated(reference, [{ rotate: edit.degrees }]);
  if (edit.kind === "resize") {
    return persistManipulated(reference, [{ resize: { width: Math.max(1, Math.round(edit.width)), height: Math.max(1, Math.round(edit.height)) } }]);
  }
  const left = Math.max(0, Math.min(99, edit.leftPercent)) / 100;
  const top = Math.max(0, Math.min(99, edit.topPercent)) / 100;
  const widthPct = Math.max(1, Math.min(100 - left * 100, edit.widthPercent)) / 100;
  const heightPct = Math.max(1, Math.min(100 - top * 100, edit.heightPercent)) / 100;
  return persistManipulated(reference, [{ crop: {
    originX: Math.round(reference.width * left), originY: Math.round(reference.height * top),
    width: Math.max(1, Math.round(reference.width * widthPct)),
    height: Math.max(1, Math.round(reference.height * heightPct)),
  } }]);
}

export async function restoreOriginal(reference: LocalReference) {
  const fileExt = extension(reference.name, reference.originalUri);
  const uri = `${referenceDirectory}${reference.id}-restored-${Date.now()}.${fileExt}`;
  await FileSystem.copyAsync({ from: reference.originalUri, to: uri });
  return { ...reference, uri, ...await getImageDimensions(uri), isEdited: false, updatedAt: Date.now() };
}

export async function copyProjectExport(base64: string, format: "png" | "jpg") {
  await ensureDirectory(projectDirectory);
  const uri = `${projectDirectory}artistry-${Date.now()}.${format}`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  return uri;
}
