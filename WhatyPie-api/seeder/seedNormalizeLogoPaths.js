import Setting from '../models/setting.model.js';
import { normalizeUploadPath } from '../utils/upload-path.js';

const LOGO_FIELDS = [
  'favicon_url',
  'logo_light_url',
  'logo_dark_url',
  'sidebar_light_logo_url',
  'sidebar_dark_logo_url',
];

/** Fix legacy backslash or absolute filesystem paths stored in settings. */
export default async function seedNormalizeLogoPaths() {
  const setting = await Setting.findOne();
  if (!setting) return;

  let changed = false;
  for (const field of LOGO_FIELDS) {
    const current = setting[field];
    if (!current || typeof current !== 'string') continue;
    const normalized = normalizeUploadPath(current);
    if (normalized && normalized !== current) {
      setting[field] = normalized;
      changed = true;
    }
  }

  if (changed) {
    await setting.save();
    console.log('Normalized logo URL paths in settings');
  }
}
