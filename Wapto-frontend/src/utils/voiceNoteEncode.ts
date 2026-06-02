"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const FFMPEG_CORE_VERSION = "0.12.6";

let ffmpegLoadPromise: Promise<FFmpeg> | null = null;

async function getFfmpeg(): Promise<FFmpeg> {
  if (typeof window === "undefined") {
    throw new Error("Voice encoding is only available in the browser");
  }

  if (!ffmpegLoadPromise) {
    ffmpegLoadPromise = (async () => {
      const ffmpeg = new FFmpeg();
      const baseURL = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return ffmpeg;
    })();
  }

  return ffmpegLoadPromise;
}

export function normalizeAudioMime(mime: string): string {
  return (mime || "").split(";")[0].trim().toLowerCase();
}

const WHATSAPP_SAFE_VOICE_BASE = new Set([
  "audio/ogg",
  "audio/mp4",
  "audio/aac",
  "audio/mpeg",
  "audio/amr",
]);

export function isWhatsAppSafeVoiceMime(mime: string): boolean {
  return WHATSAPP_SAFE_VOICE_BASE.has(normalizeAudioMime(mime));
}

export function needsVoiceTranscode(mime: string): boolean {
  const base = normalizeAudioMime(mime);
  return base === "audio/webm" || base === "audio/wav" || base === "audio/x-wav";
}

async function transcodeToOggOpus(blob: Blob): Promise<Blob> {
  const ffmpeg = await getFfmpeg();
  const inputName = "voice-input.webm";
  const outputName = "voice-output.ogg";

  await ffmpeg.writeFile(inputName, await fetchFile(blob));
  await ffmpeg.exec(["-i", inputName, "-c:a", "libopus", "-b:a", "32k", "-vn", outputName]);
  const data = await ffmpeg.readFile(outputName);
  if (!(data instanceof Uint8Array)) {
    throw new Error("Unexpected ffmpeg output format while encoding voice note");
  }
  const bytes = Uint8Array.from(data);
  return new Blob([bytes.buffer], { type: "audio/ogg; codecs=opus" });
}

/**
 * Normalize a recorded voice blob to a WhatsApp-uploadable format.
 * OGG/Opus and Safari MP4 are sent as-is; WEBM is transcoded to OGG/Opus.
 */
export async function normalizeVoiceBlobForWhatsApp(blob: Blob): Promise<Blob> {
  const mime = blob.type || "";
  if (isWhatsAppSafeVoiceMime(mime)) {
    return blob;
  }

  if (needsVoiceTranscode(mime)) {
    try {
      return await transcodeToOggOpus(blob);
    } catch (err) {
      console.error("[voiceNoteEncode] WEBM transcode failed:", err);
      throw new Error(
        "Could not convert voice recording for WhatsApp. Please try again or use another browser."
      );
    }
  }

  throw new Error(`Unsupported voice recording format: ${mime || "unknown"}`);
}
