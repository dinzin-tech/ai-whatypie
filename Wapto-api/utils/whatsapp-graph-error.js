/**
 * Format and log Meta Graph API errors from WhatsApp message sends.
 */

export const extractWhatsAppGraphError = (responseData, httpStatus) => {
  const err = responseData?.error || {};
  return {
    httpStatus: httpStatus ?? null,
    code: err.code ?? null,
    error_subcode: err.error_subcode ?? null,
    type: err.type ?? null,
    message: err.message ?? null,
    error_user_msg: err.error_user_msg ?? null,
    details: err.error_data?.details ?? null,
    fbtrace_id: err.fbtrace_id ?? null
  };
};

export const formatWhatsAppGraphError = (responseData, httpStatus) => {
  const e = extractWhatsAppGraphError(responseData, httpStatus);
  const parts = [];
  if (e.code != null) parts.push(`(#${e.code})`);
  if (e.message) parts.push(e.message);
  else if (e.error_user_msg) parts.push(e.error_user_msg);
  else if (e.details) parts.push(e.details);
  if (e.error_subcode != null) parts.push(`subcode=${e.error_subcode}`);
  if (e.fbtrace_id) parts.push(`trace=${e.fbtrace_id}`);
  if (httpStatus != null) parts.push(`HTTP ${httpStatus}`);
  return parts.length ? parts.join(' ') : 'Unknown WhatsApp API error';
};

export const logWhatsAppGraphError = (context, responseData, httpStatus, extra = {}) => {
  const e = extractWhatsAppGraphError(responseData, httpStatus);
  console.error('[WhatsAppAPI] Graph API error', {
    ...context,
    ...extra,
    httpStatus: e.httpStatus,
    code: e.code,
    error_subcode: e.error_subcode,
    type: e.type,
    message: e.message,
    error_user_msg: e.error_user_msg,
    details: e.details,
    fbtrace_id: e.fbtrace_id
  });
};

export default {
  extractWhatsAppGraphError,
  formatWhatsAppGraphError,
  logWhatsAppGraphError
};
