/** WhatsApp Cloud API supported audio MIME types (base, no parameters). */
export const WHATSAPP_ALLOWED_AUDIO_MIMES = new Set([
  'audio/aac',
  'audio/amr',
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg'
]);

export function normalizeAudioMime(mime) {
  return String(mime || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
}

export function isWhatsAppAllowedAudioMime(mime) {
  return WHATSAPP_ALLOWED_AUDIO_MIMES.has(normalizeAudioMime(mime));
}

/**
 * @throws {Error} when MIME is not uploadable to WhatsApp media endpoint
 */
export function assertWhatsAppAllowedAudioMime(mime) {
  const base = normalizeAudioMime(mime);
  if (!WHATSAPP_ALLOWED_AUDIO_MIMES.has(base)) {
    throw new Error(
      `Unsupported voice MIME: ${mime || 'unknown'}; expected audio/ogg or audio/mp4`
    );
  }
  return base;
}

/** MIME sent to Graph media upload (voice OGG should include Opus codec hint). */
export function getWhatsAppAudioUploadMime(mime, { isVoiceNote = false } = {}) {
  const base = normalizeAudioMime(mime);
  if (isVoiceNote && base === 'audio/ogg') {
    return 'audio/ogg; codecs=opus';
  }
  return mime || base;
}

export function isLikelyChatVoiceNote(file) {
  if (!file?.mimetype?.startsWith('audio/')) return false;
  const name = String(file.originalname || '').toLowerCase();
  if (name.startsWith('audio_message.')) return true;
  const base = normalizeAudioMime(file.mimetype);
  return base === 'audio/ogg' || base === 'audio/mp4';
}
