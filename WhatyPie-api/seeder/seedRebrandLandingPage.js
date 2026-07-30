import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LandingPage } from '../models/index.js';
import { isLegacyPreWhatyPieLandingValue } from '../utils/landing-page-media.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANDING_DIR = path.join(__dirname, '..', 'uploads', 'landing');

const BRAND_SOURCE_CANDIDATES = [
  path.join(__dirname, '..', 'branding', 'WhatyPie-logo.png'),
  path.join(__dirname, '..', '..', 'WhatyPie-logo.png'),
  path.join(__dirname, '..', '..', 'WhatyPie-frontend', 'public', 'assets', 'logos', 'WhatyPie-logo.png'),
  path.join(__dirname, '..', '..', 'WhatyPie-admin', 'public', 'assets', 'logos', 'WhatyPie-logo.png'),
];

const LANDING_ASSET_FILES = {
  hero_main: 'hero_main.png',
  floating: 'floating.png',
  feature: 'feature.png',
  platform: 'platform.png',
};

const WhatyPie_FOOTER = {
  copy_rights_text: '© 2026 WhatyPie. All rights reserved.',
  social_links: [
    {
      twitter: 'https://twitter.com/whatypie',
      linkedin: 'https://linkedin.com/company/whatypie',
      facebook: 'https://facebook.com/whatypie',
      instagram: 'https://instagram.com/whatypie',
    },
  ],
};

function resolveBrandSource() {
  return BRAND_SOURCE_CANDIDATES.find((candidate) => fs.existsSync(candidate));
}

function copyLandingBrandAssets() {
  const source = resolveBrandSource();
  if (!source) {
    console.warn('seedRebrandLandingPage: no WhatyPie logo found — skip file copy');
    return false;
  }

  fs.mkdirSync(LANDING_DIR, { recursive: true });
  for (const filename of Object.values(LANDING_ASSET_FILES)) {
    fs.copyFileSync(source, path.join(LANDING_DIR, filename));
  }
  console.log('WhatyPie landing images copied to uploads/landing/');
  return true;
}

/** Refresh legacy WhatyPie landing paths/copy on existing deployments. */
export default async function seedRebrandLandingPage() {
  try {
    copyLandingBrandAssets();

    const landing = await LandingPage.findOne();
    if (!landing) return;

    const $set = {};

    if (isLegacyPreWhatyPieLandingValue(landing.hero_section?.hero_image)) {
      $set['hero_section.hero_image'] = '/uploads/landing/hero_main.png';
    }

    if (Array.isArray(landing.hero_section?.floating_images)) {
      landing.hero_section.floating_images.forEach((img, index) => {
        if (isLegacyPreWhatyPieLandingValue(img?.url)) {
          $set[`hero_section.floating_images.${index}.url`] = '/uploads/landing/floating.png';
        }
      });
    }

    if (Array.isArray(landing.features_section?.features)) {
      landing.features_section.features.forEach((feature, index) => {
        if (isLegacyPreWhatyPieLandingValue(feature?.image)) {
          $set[`features_section.features.${index}.image`] = '/uploads/landing/feature.png';
        }
      });
    }

    if (Array.isArray(landing.platform_section?.items)) {
      landing.platform_section.items.forEach((item, index) => {
        if (isLegacyPreWhatyPieLandingValue(item?.image)) {
          $set[`platform_section.items.${index}.image`] = '/uploads/landing/platform.png';
        }
      });
    }

    if (isLegacyPreWhatyPieLandingValue(landing.contact_section?.email)) {
      $set['contact_section.email'] = 'support@whatypie.in';
    }

    const copyRights = landing.footer_section?.copy_rights_text || '';
    const legacyBrandSlug = String.fromCharCode(0x77, 0x61, 0x70, 0x69);
    if (isLegacyPreWhatyPieLandingValue(copyRights) || new RegExp(legacyBrandSlug, 'i').test(copyRights)) {
      $set['footer_section.copy_rights_text'] = WhatyPie_FOOTER.copy_rights_text;
    }

    const social = landing.footer_section?.social_links?.[0];
    if (
      social &&
      (isLegacyPreWhatyPieLandingValue(social.twitter) ||
        isLegacyPreWhatyPieLandingValue(social.linkedin) ||
        isLegacyPreWhatyPieLandingValue(social.facebook) ||
        isLegacyPreWhatyPieLandingValue(social.instagram))
    ) {
      $set['footer_section.social_links'] = WhatyPie_FOOTER.social_links;
    }

    if (Object.keys($set).length === 0) {
      return;
    }

    await LandingPage.updateOne({ _id: landing._id }, { $set });
    console.log('Landing page rebranded from legacy WhatyPie defaults');
  } catch (error) {
    console.error('seedRebrandLandingPage error:', error);
  }
}
