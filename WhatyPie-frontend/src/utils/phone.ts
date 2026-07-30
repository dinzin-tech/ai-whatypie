/**
 * Phone normalization — mirrors backend logic for forms (digits only, no +).
 */

const KNOWN_DIAL_CODES = [
  "971", "966", "972", "880", "886", "852", "853", "855", "856",
  "91", "92", "93", "94", "95", "98", "86", "81", "82", "84", "66", "60", "65", "62", "63",
  "44", "49", "33", "39", "34", "31", "32", "41", "43", "48", "46", "47", "45",
  "1", "7", "61", "64", "27", "20", "234", "254",
].sort((a, b) => b.length - a.length);

export const digitsOnly = (value: string | undefined | null): string => {
  if (value === undefined || value === null) return "";
  return String(value).replace(/\D/g, "");
};

export const splitCountryAndNational = (
  countryCode: string,
  phone: string
): { countryCode: string; nationalPhone: string } => {
  const cc = digitsOnly(countryCode);
  let national = digitsOnly(phone);

  if (cc && national.startsWith(cc)) {
    national = national.slice(cc.length);
  }

  national = national.replace(/^0+/, "");

  return { countryCode: cc, nationalPhone: national };
};

export const toE164Digits = (countryCode: string, phone: string): string => {
  const { countryCode: cc, nationalPhone } = splitCountryAndNational(countryCode, phone);
  if (!cc) return nationalPhone;
  if (!nationalPhone) return cc;
  return `${cc}${nationalPhone}`;
};

/** Parse full E.164 digits into country dial code + national for form fields */
export const extractPhoneInfo = (
  fullNumber: string,
  dialCodes: { dial_code: string }[]
): { code: string; phone: string } => {
  const digits = digitsOnly(fullNumber);
  if (!digits) return { code: "+91", phone: "" };

  const sorted = [...dialCodes].sort(
    (a, b) => digitsOnly(b.dial_code).length - digitsOnly(a.dial_code).length
  );

  for (const country of sorted) {
    const cc = digitsOnly(country.dial_code);
    if (cc && digits.startsWith(cc)) {
      return {
        code: country.dial_code.startsWith("+") ? country.dial_code : `+${cc}`,
        phone: digits.slice(cc.length),
      };
    }
  }

  return { code: "+91", phone: digits };
};
