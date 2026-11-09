import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import type { LocalReference } from "../../domain/types";
import { useAppStore } from "../../state/appStore";
import { cacheSelectedImage } from "../../storage/imageFiles";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

export async function choosePhotoFromSystemPicker(): Promise<LocalReference | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  if (asset.mimeType && !acceptedTypes.includes(asset.mimeType.toLowerCase())) {
    throw new Error("Choose a JPG, PNG or WEBP image.");
  }
  const reference = await cacheSelectedImage(asset.uri, asset.fileName ?? "Reference image", {
    width: asset.width,
    height: asset.height,
  });
  await useAppStore.getState().setReference(reference);
  return reference;
}

export async function chooseImageFromDocuments(): Promise<LocalReference | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: acceptedTypes,
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  const reference = await cacheSelectedImage(asset.uri, asset.name);
  await useAppStore.getState().setReference(reference);
  return reference;
}

export async function importCameraCapture(uri: string, name = "Camera reference.jpg") {
  const reference = await cacheSelectedImage(uri, name);
  await useAppStore.getState().setReference(reference);
  return reference;
}
