import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LandingPage } from '../models/index.js';
import { isLegacyPreWaptoLandingValue } from '../utils/landing-page-media.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANDING_DIR = path.join(__dirname, '..', 'uploads', 'landing');

const BRAND_SOURCE_CANDIDATES = [
  path.join(__dirname, '..', 'branding', 'wapto-logo.png'),
  path.join(__dirname, '..', '..', 'wapto-logo.png'),
  path.join(__dirname, '..', '..', 'Wapto-frontend', 'public', 'assets', 'logos', 'wapto-logo.png'),
  path.join(__dirname, '..', '..', 'Wapto-admin', 'public', 'assets', 'logos', 'wapto-logo.png'),
];

const LANDING_ASSET_FILES = {
  hero_main: 'hero_main.png',
  floating: 'floating.png',
  feature: 'feature.png',
  platform: 'platform.png',
};

const WAPTO_FOOTER = {
  copy_rights_text: '© 2026 Wapto. All rights reserved.',
  social_links: [
    {
      twitter: 'https://twitter.com/wapto',
      linkedin: 'https://linkedin.com/company/wapto',
      facebook: 'https://facebook.com/wapto',
      instagram: 'https://instagram.com/wapto',
    },
  ],
};

function resolveBrandSource() {
  return BRAND_SOURCE_CANDIDATES.find((candidate) => fs.existsSync(candidate));
}

function copyLandingBrandAssets() {
  const source = resolveBrandSource();
  if (!source) {
    console.warn('seedRebrandLandingPage: no Wapto logo found — skip file copy');
    return false;
  }

  fs.mkdirSync(LANDING_DIR, { recursive: true });
  for (const filename of Object.values(LANDING_ASSET_FILES)) {
    fs.copyFileSync(source, path.join(LANDING_DIR, filename));
  }
  console.log('WAPTO landing images copied to uploads/landing/');
  return true;
}

/** Refresh legacy WAPTO landing paths/copy on existing deployments. */
export default async function seedRebrandLandingPage() {
  try {
    copyLandingBrandAssets();

    const landing = await LandingPage.findOne();
    if (!landing) return;

    const $set = {};

    if (isLegacyPreWaptoLandingValue(landing.hero_section?.hero_image)) {
      $set['hero_section.hero_image'] = '/uploads/landing/hero_main.png';
    }

    if (Array.isArray(landing.hero_section?.floating_images)) {
      landing.hero_section.floating_images.forEach((img, index) => {
        if (isLegacyPreWaptoLandingValue(img?.url)) {
          $set[`hero_section.floating_images.${index}.url`] = '/uploads/landing/floating.png';
        }
      });
    }

    if (Array.isArray(landing.features_section?.features)) {
      landing.features_section.features.forEach((feature, index) => {
        if (isLegacyPreWaptoLandingValue(feature?.image)) {
          $set[`features_section.features.${index}.image`] = '/uploads/landing/feature.png';
        }
      });
    }

    if (Array.isArray(landing.platform_section?.items)) {
      landing.platform_section.items.forEach((item, index) => {
        if (isLegacyPreWaptoLandingValue(item?.image)) {
          $set[`platform_section.items.${index}.image`] = '/uploads/landing/platform.png';
        }
      });
    }

    if (isLegacyPreWaptoLandingValue(landing.contact_section?.email)) {
      $set['contact_section.email'] = 'support@wapto.com';
    }

    const copyRights = landing.footer_section?.copy_rights_text || '';
    const legacyBrandSlug = String.fromCharCode(0x77, 0x61, 0x70, 0x69);
    if (isLegacyPreWaptoLandingValue(copyRights) || new RegExp(legacyBrandSlug, 'i').test(copyRights)) {
      $set['footer_section.copy_rights_text'] = WAPTO_FOOTER.copy_rights_text;
    }

    const social = landing.footer_section?.social_links?.[0];
    if (
      social &&
      (isLegacyPreWaptoLandingValue(social.twitter) ||
        isLegacyPreWaptoLandingValue(social.linkedin) ||
        isLegacyPreWaptoLandingValue(social.facebook) ||
        isLegacyPreWaptoLandingValue(social.instagram))
    ) {
      $set['footer_section.social_links'] = WAPTO_FOOTER.social_links;
    }

    if (Object.keys($set).length === 0) {
      return;
    }

    await LandingPage.updateOne({ _id: landing._id }, { $set });
    console.log('Landing page rebranded from legacy WAPTO defaults');
  } catch (error) {
    console.error('seedRebrandLandingPage error:', error);
  }
}
