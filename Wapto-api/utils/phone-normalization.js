/**
 * Phone normalization helpers — E.164 digits only (no leading +).
 * Prevents duplicate country prefixes (e.g. +91 + 91847... → 9191847...).
 */

/** Common dial codes longest-first for prefix stripping on stored full numbers */
const KNOWN_DIAL_CODES = [
  '971', '966', '972', '880', '886', '852', '853', '855', '856', '880',
  '91', '92', '93', '94', '95', '98', '86', '81', '82', '84', '66', '60', '65', '62', '63',
  '44', '49', '33', '39', '34', '31', '32', '41', '43', '48', '46', '47', '45',
  '1', '7', '61', '64', '27', '20', '234', '254',
].sort((a, b) => b.length - a.length);

export const digitsOnly = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\D/g, '');
};

/**
 * Split country code and national number; strip duplicate country prefix from phone.
 */
export const splitCountryAndNational = (countryCode, phone) => {
  const cc = digitsOnly(countryCode);
  let national = digitsOnly(phone);

  if (cc && national.startsWith(cc)) {
    national = national.slice(cc.length);
  }

  national = national.replace(/^0+/, '');

  return {
    countryCode: cc,
    nationalPhone: national,
  };
};

/**
 * Build E.164 digits string (country + national, no +).
 */
export const toE164Digits = (countryCode, phone) => {
  const { countryCode: cc, nationalPhone } = splitCountryAndNational(countryCode, phone);
  if (!cc) return nationalPhone;
  if (!nationalPhone) return cc;
  return `${cc}${nationalPhone}`;
};

/**
 * Normalize a stored full phone (webhook, import, contact phone_number field).
 * Strips non-digits and removes accidental duplicate country prefix.
 */
export const normalizeStoredPhone = (phone, countryCodeHint = null) => {
  let digits = digitsOnly(phone);
  if (!digits) return '';

  if (countryCodeHint) {
    return toE164Digits(countryCodeHint, digits);
  }

  for (const cc of KNOWN_DIAL_CODES) {
    if (digits.startsWith(cc + cc)) {
      const withoutDup = digits.slice(cc.length);
      if (withoutDup.length >= 6 && withoutDup.length <= 15) {
        digits = withoutDup;
        break;
      }
    }
  }

  return digits;
};

export default {
  digitsOnly,
  splitCountryAndNational,
  toE164Digits,
  normalizeStoredPhone,
};
