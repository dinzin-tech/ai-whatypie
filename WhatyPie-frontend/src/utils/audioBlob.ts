import { isWhatsAppSafeVoiceMime, normalizeAudioMime, normalizeVoiceBlobForWhatsApp } from "./voiceNoteEncode";

export { normalizeVoiceBlobForWhatsApp, isWhatsAppSafeVoiceMime, normalizeAudioMime };

export function getAudioExtensionFromBlob(blob: Blob): string {
  const type = normalizeAudioMime(blob.type);
  if (type.includes("ogg")) return "ogg";
  if (type.includes("webm")) return "webm";
  if (type.includes("mp4") || type.includes("m4a")) return "m4a";
  if (type.includes("mpeg") || type.includes("mp3")) return "mp3";
  if (type.includes("aac")) return "aac";
  if (type.includes("amr")) return "amr";
  return "ogg";
}

export function getVoiceUploadFilename(blob: Blob): string {
  return `audio_message.${getAudioExtensionFromBlob(blob)}`;
}
