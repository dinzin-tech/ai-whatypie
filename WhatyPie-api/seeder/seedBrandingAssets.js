import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRAND_LOGO_CANDIDATES = [
  path.join(__dirname, '..', 'branding', 'WhatyPie-logo.png'),
  path.join(__dirname, '..', '..', 'WhatyPie-logo.png'),
];
const BRAND_LOGO = BRAND_LOGO_CANDIDATES.find((p) => fs.existsSync(p));
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'attachments');

const BRAND_FILES = [
  'favicon.png',
  'logo_light.png',
  'logo_dark.png',
  'sidebar_light_logo.png',
  'sidebar_dark_logo.png',
];

const LANDING_DIR = path.join(__dirname, '..', 'uploads', 'landing');
const LANDING_FILES = ['hero_main.png', 'floating.png', 'feature.png', 'platform.png'];

/** Copy committed WhatyPie logo into uploads for API /settings and landing page URLs. */
export async function seedBrandingAssets() {
  if (!BRAND_LOGO) {
    console.warn('seedBrandingAssets: WhatyPie-logo.png missing — skip');
    return;
  }
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  for (const name of BRAND_FILES) {
    fs.copyFileSync(BRAND_LOGO, path.join(UPLOAD_DIR, name));
  }

  fs.mkdirSync(LANDING_DIR, { recursive: true });
  for (const name of LANDING_FILES) {
    fs.copyFileSync(BRAND_LOGO, path.join(LANDING_DIR, name));
  }

  console.log('WhatyPie branding assets copied to uploads/attachments and uploads/landing');
}

export default seedBrandingAssets;
