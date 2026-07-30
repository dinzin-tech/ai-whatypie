import axios from "axios";
import FormData from "form-data";
import {
  assertWhatsAppAllowedAudioMime,
  getWhatsAppAudioUploadMime,
  normalizeAudioMime
} from './whatsapp-voice-mime.js';
import { formatWhatsAppGraphError, logWhatsAppGraphError } from './whatsapp-graph-error.js';

async function uploadMediaToWhatsApp({
  phone_number_id,
  access_token,
  buffer,
  mime_type,
  filename,
  isVoiceNote = false
}) {
  const mimeBase = normalizeAudioMime(mime_type);
  if (mimeBase.startsWith('audio/')) {
    assertWhatsAppAllowedAudioMime(mime_type);
  }

  const uploadMimeType = mimeBase.startsWith('audio/')
    ? getWhatsAppAudioUploadMime(mime_type, { isVoiceNote })
    : mime_type;

  const form = new FormData();

  form.append("messaging_product", "whatsapp");
  form.append("type", uploadMimeType);

  const fileOptions = {
    filename: filename || 'audio.ogg',
    contentType: uploadMimeType
  };

  if (mimeBase === 'audio/ogg' && !fileOptions.filename.endsWith('.ogg')) {
    fileOptions.filename = `${fileOptions.filename}.ogg`;
  }

  form.append("file", buffer, fileOptions);

  console.log('[UploadMedia] Uploading to WhatsApp:', {
    phone_number_id,
    mime_type: uploadMimeType,
    filename: fileOptions.filename,
    bufferSize: buffer.length
  });

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${phone_number_id}/media`,
      form,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          ...form.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    return response.data.id;
  } catch (err) {
    const responseData = err.response?.data;
    const httpStatus = err.response?.status;

    if (responseData) {
      logWhatsAppGraphError('uploadMediaToWhatsApp', responseData, httpStatus, {
        mime_type: uploadMimeType,
        filename: fileOptions.filename,
        bufferSize: buffer?.length
      });
      throw new Error(formatWhatsAppGraphError(responseData, httpStatus));
    }

    console.error('[UploadMedia] Upload failed:', err.message);
    throw err;
  }
}

function getWhatsAppTypeFromMime(mime) {
  if (!mime) return "text";

  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";

  return "document";
}

async function getWhatsAppMediaUrl(mediaId, access_token) {
  const res = await axios.get(
    `https://graph.facebook.com/v19.0/${mediaId}`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    }
  );

  return res.data.url;
}

export { uploadMediaToWhatsApp, getWhatsAppTypeFromMime, getWhatsAppMediaUrl };
